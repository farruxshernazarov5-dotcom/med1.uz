import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "npm:blueimp-md5@2.19.0";
import { clickCors, clickEnv, mask, validateClickConfig, checkoutUrl } from "../_shared/click.ts";

// Super Admin Click diagnostikasi: konfiguratsiya, test to'lov, callback loglari
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: clickCors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...clickCors, "Content-Type": "application/json" } });

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

    const env = clickEnv();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = String(body?.action ?? "config");

    const base = `${supabaseUrl}/functions/v1`;

    if (action === "config") {
      return json({
        ok: true,
        config: {
          service_id: env.serviceId || null,
          merchant_id: env.merchantId || null,
          merchant_user_id: env.merchantUserId || null,
          secret_key_masked: mask(env.secretKey),
          secret_key_length: env.secretKey.length,
        },
        issues: validateClickConfig(env),
        endpoints: {
          prepare_url: `${base}/click-prepare`,
          complete_url: `${base}/click-complete`,
          return_url: "https://med1.uz/payment/success",
        },
      });
    }

    if (action === "logs") {
      const [logs, payments, fiscal] = await Promise.all([
        admin.from("click_webhook_log").select("*").order("created_at", { ascending: false }).limit(30),
        admin.from("platform_payments").select("id,amount,status,purpose,created_at,paid_at,provider_transaction_id")
          .eq("provider", "click").order("created_at", { ascending: false }).limit(20),
        admin.from("click_fiscal_receipts").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      return json({ ok: true, logs: logs.data ?? [], payments: payments.data ?? [], fiscal: fiscal.data ?? [] });
    }

    if (action === "checkout") {
      const amount = Number(body?.amount);
      if (!amount || amount <= 0) return json({ error: "Noto'g'ri summa" }, 400);
      const issues = validateClickConfig(env).filter((i) => i.level === "error");
      if (issues.length) return json({ error: issues.map((i) => i.message).join("; ") }, 400);

      const { data: payment, error } = await admin.from("platform_payments").insert({
        user_id: userId, provider: "click", amount, purpose: "admin_test",
        status: "pending", metadata: { admin_test: true },
      }).select().single();
      if (error) throw error;

      return json({
        ok: true,
        payment_id: payment.id,
        checkout_url: checkoutUrl({
          serviceId: env.serviceId, merchantId: env.merchantId, amount,
          transactionParam: payment.id,
          returnUrl: `https://med1.uz/payment/success?payment_id=${payment.id}&provider=click`,
        }),
      });
    }

    // Callback simulyatsiyasi — Click imzosi bilan prepare + complete
    if (action === "simulate") {
      const paymentId = String(body?.payment_id ?? "");
      if (!paymentId) return json({ error: "payment_id kerak" }, 400);
      const { data: payment } = await admin.from("platform_payments").select("*").eq("id", paymentId).maybeSingle();
      if (!payment) return json({ error: "To'lov topilmadi" }, 404);

      const clickTransId = String(Date.now());
      const amount = String(payment.amount);
      const now = new Date(Date.now() + 5 * 3600_000).toISOString().replace("T", " ").slice(0, 19);

      const post = async (action: "0" | "1", prepareId = "") => {
        const sign = action === "1"
          ? md5(`${clickTransId}${env.serviceId}${env.secretKey}${paymentId}${prepareId}${amount}${action}${now}`)
          : md5(`${clickTransId}${env.serviceId}${env.secretKey}${paymentId}${amount}${action}${now}`);
        const endpoint = action === "0" ? "click-prepare" : "click-complete";
        const resp = await fetch(`${base}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            click_trans_id: clickTransId, service_id: env.serviceId, merchant_trans_id: paymentId,
            merchant_prepare_id: prepareId, amount, action, sign_time: now, sign_string: sign,
            error: "0", error_note: "Success",
          }),
        });
        return await resp.json().catch(() => ({}));
      };

      const prepare = await post("0");
      const complete = await post("1", String(prepare?.merchant_prepare_id ?? ""));
      return json({ ok: true, prepare, complete });
    }

    return json({ error: "Noma'lum action" }, 400);
  } catch (err) {
    console.error("click-admin-diag error", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
