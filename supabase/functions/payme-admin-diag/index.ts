// Super Admin Payme (Paycom) diagnostikasi: konfiguratsiya, endpoint healthcheck,
// tranzaksiyalar, webhook loglari va JSON-RPC test chaqiruvlari.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const mask = (v: string) => (v ? `${v.slice(0, 3)}${"*".repeat(Math.max(0, v.length - 6))}${v.slice(-3)}` : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await anon.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden — admin roli talab qilinadi" }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = String(body?.action ?? "config");
    const environment = String(body?.environment ?? "production") === "sandbox" ? "sandbox" : "production";

    const merchantId = environment === "sandbox"
      ? (Deno.env.get("PAYME_MERCHANT_ID_SANDBOX") || Deno.env.get("PAYME_MERCHANT_ID") || "")
      : (Deno.env.get("PAYME_MERCHANT_ID") || "");
    const secretKey = environment === "sandbox"
      ? (Deno.env.get("PAYME_SECRET_KEY_SANDBOX") || Deno.env.get("PAYME_SECRET_KEY") || "")
      : (Deno.env.get("PAYME_SECRET_KEY") || "");

    const endpoint = "https://pay.med1.uz/payme";
    const fallbackEndpoint = `${supabaseUrl}/functions/v1/payme-webhook`;
    const checkoutHost = environment === "sandbox" ? "https://test.paycom.uz" : "https://checkout.paycom.uz";

    const issues: { level: "error" | "warning"; message: string }[] = [];
    if (!merchantId) issues.push({ level: "error", message: "PAYME_MERCHANT_ID sozlanmagan" });
    if (!secretKey) issues.push({ level: "error", message: "PAYME_SECRET_KEY sozlanmagan" });
    else if (secretKey.length < 20) issues.push({ level: "warning", message: "PAYME_SECRET_KEY juda qisqa ko'rinmoqda" });

    if (action === "config") {
      return json({
        ok: issues.every((i) => i.level !== "error"),
        environment,
        config: {
          merchant_id: merchantId || null,
          merchant_id_masked: mask(merchantId),
          secret_key_masked: mask(secretKey),
          secret_key_length: secretKey.length,
          login: "Paycom",
          account_param: "order_id",
          currency: "UZS (860), tiyinda",
        },
        endpoints: {
          endpoint,
          fallback_endpoint: fallbackEndpoint,
          checkout_host: checkoutHost,
          return_url: "https://med1.uz/payment/success",
        },
        proxy: { domain: "pay.med1.uz", static_ip: "89.39.95.5", network: "TAS-IX" },
        issues,
      });
    }

    if (action === "healthcheck") {
      const checks: { name: string; ok: boolean; status?: number; detail: string }[] = [];

      // 1) Proxy /health markeri
      try {
        const r = await fetch("https://pay.med1.uz/health");
        const txt = (await r.text()).slice(0, 300);
        const ok = r.status === 200 && txt.includes("2026-09-02-v4");
        checks.push({ name: "proxy:health", ok, status: r.status, detail: ok ? "Proxy konfiguratsiyasi dolzarb" : `Eski/noto'g'ri konfiguratsiya: ${txt}` });
      } catch (e) {
        checks.push({ name: "proxy:health", ok: false, detail: `So'rov bajarilmadi: ${e instanceof Error ? e.message : String(e)}` });
      }

      // 2) Payme JSON-RPC 6 metod — kalitsiz chaqiruvda -32504 kutiladi
      const methods = [
        "CheckPerformTransaction", "CreateTransaction", "PerformTransaction",
        "CancelTransaction", "CheckTransaction", "GetStatement",
      ];
      for (const method of methods) {
        try {
          const r = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: {} }),
          });
          const data = await r.json().catch(() => null) as any;
          const code = data?.error?.code;
          const ok = r.status === 200 && code === -32504;
          checks.push({
            name: `rpc:${method}`,
            ok,
            status: r.status,
            detail: ok
              ? "JSON-RPC javob berdi (avtorizatsiya talab qilinmoqda — to'g'ri)"
              : `Kutilmagan javob: HTTP ${r.status}, code=${code ?? "yo'q"}`,
          });
        } catch (e) {
          checks.push({ name: `rpc:${method}`, ok: false, detail: `So'rov bajarilmadi: ${e instanceof Error ? e.message : String(e)}` });
        }
      }

      for (const i of issues) checks.push({ name: `config:${i.level}`, ok: i.level !== "error", detail: i.message });

      return json({ ok: checks.every((c) => c.ok), environment, endpoint, checks, errors: checks.filter((c) => !c.ok).length });
    }

    if (action === "logs") {
      const [logs, payments, fiscal] = await Promise.all([
        admin.from("payme_webhook_log").select("*").order("created_at", { ascending: false }).limit(40),
        admin.from("platform_payments")
          .select("id,user_id,amount,status,purpose,created_at,paid_at,metadata")
          .eq("provider", "payme").order("created_at", { ascending: false }).limit(30),
        admin.from("payme_fiscal_items").select("*").order("purpose"),
      ]);
      const rows = payments.data ?? [];
      const stats = {
        total: rows.length,
        paid: rows.filter((p: any) => p.status === "paid" || p.status === "completed").length,
        pending: rows.filter((p: any) => p.status === "pending").length,
        cancelled: rows.filter((p: any) => p.status === "cancelled" || p.status === "canceled").length,
        revenue: rows.filter((p: any) => p.status === "paid" || p.status === "completed")
          .reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
      };
      return json({ ok: true, logs: logs.data ?? [], payments: rows, fiscal: fiscal.data ?? [], stats });
    }

    if (action === "test_order") {
      const amount = Number(body?.amount);
      if (!amount || amount <= 0) return json({ error: "Noto'g'ri summa" }, 400);
      const { data: payment, error } = await admin.from("platform_payments").insert({
        user_id: userId, provider: "payme", amount, purpose: "admin_test",
        status: "pending", metadata: { admin_test: true, environment },
      }).select().single();
      if (error) throw error;
      const amountTiyin = Math.round(amount * 100);
      const params = [
        `m=${merchantId}`,
        `ac.order_id=${payment.id}`,
        `a=${amountTiyin}`,
        `l=uz`,
        `c=https://med1.uz/payment/success?payment_id=${payment.id}&provider=payme`,
      ].join(";");
      return json({
        ok: true,
        environment,
        payment_id: payment.id,
        amount,
        amount_tiyin: amountTiyin,
        checkout_url: `${checkoutHost}/${btoa(params)}`,
      });
    }

    // Merchant API'ni haqiqiy Basic Auth bilan sinash (Paycom sandbox metodlari)
    if (action === "rpc") {
      const method = String(body?.method ?? "CheckPerformTransaction");
      const params = body?.params ?? {};
      const basic = btoa(`Paycom:${secretKey}`);
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${basic}` },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
      });
      const text = await r.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      return json({ ok: r.status === 200, status: r.status, method, response: parsed });
    }

    return json({ error: "Noma'lum action" }, 400);
  } catch (err) {
    console.error("payme-admin-diag error", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
