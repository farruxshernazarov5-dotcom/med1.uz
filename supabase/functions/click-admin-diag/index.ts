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
    const environment = String(body?.environment ?? "production") === "sandbox" ? "sandbox" : "production";

    const base = `${supabaseUrl}/functions/v1`;
    const siteBase = environment === "sandbox"
      ? "https://id-preview--89a5c0ff-a25e-4201-b8e8-56f5f02a2027.lovable.app"
      : "https://med1.uz";
    const callbackBase = environment === "sandbox" ? base : "https://pay.med1.uz/click";
    const endpoints = {
      prepare_url: environment === "sandbox" ? `${callbackBase}/click-prepare` : `${callbackBase}/prepare`,
      complete_url: environment === "sandbox" ? `${callbackBase}/click-complete` : `${callbackBase}/complete`,
      return_url: `${siteBase}/payment/success`,
    };

    if (action === "config") {
      return json({
        ok: true,
        environment,
        site_base: siteBase,
        config: {
          service_id: env.serviceId || null,
          merchant_id: env.merchantId || null,
          merchant_user_id: env.merchantUserId || null,
          secret_key_masked: mask(env.secretKey),
          secret_key_length: env.secretKey.length,
        },
        issues: validateClickConfig(env),
        endpoints,
        proxy: environment === "production" ? {
          domain: "pay.med1.uz",
          static_ip: "89.39.95.5",
          network: "TAS-IX",
        } : null,
      });
    }

    // Domen / callback URL avtomatik tekshiruvi
    if (action === "healthcheck") {
      const checks: { name: string; ok: boolean; status?: number; detail: string }[] = [];

      for (const [name, url] of Object.entries(endpoints)) {
        if (!/^https:\/\//.test(url)) {
          checks.push({ name, ok: false, detail: "URL HTTPS bo'lishi shart" });
          continue;
        }
        try {
          const r = await fetch(url, { method: "GET" });
          const txt = (await r.text()).slice(0, 200);
          const proxyHeader = r.headers.get("x-med1-tasix-proxy");
          const isCallback = name === "prepare_url" || name === "complete_url";
          const proxyOk = environment !== "production" || !isCallback || proxyHeader === "89.39.95.5";
          const ok = (name === "return_url" ? r.status < 400 : r.status === 200) && proxyOk;
          checks.push({
            name, ok, status: r.status,
            detail: ok
              ? `Javob berdi (${r.status})${proxyHeader ? `, TAS-IX proxy ${proxyHeader}` : ""}`
              : proxyOk ? `Kutilmagan javob (${r.status}): ${txt}` : "Javob TAS-IX proxy orqali kelmadi",
          });
        } catch (e) {
          checks.push({ name, ok: false, detail: `So'rov muvaffaqiyatsiz: ${e instanceof Error ? e.message : String(e)}` });
        }
      }

      // Domen whitelist tekshiruvi
      for (const domain of environment === "sandbox" ? [siteBase] : ["https://med1.uz", "https://www.med1.uz"]) {
        try {
          const r = await fetch(domain, { method: "GET", redirect: "follow" });
          checks.push({
            name: `domain:${domain}`, ok: r.status < 400, status: r.status,
            detail: r.status < 400 ? "Domen HTTPS orqali ochilmoqda" : `Domen ${r.status} qaytardi`,
          });
        } catch (e) {
          checks.push({ name: `domain:${domain}`, ok: false, detail: `Domen ochilmadi: ${e instanceof Error ? e.message : String(e)}` });
        }
      }

      const cfgIssues = validateClickConfig(env);
      for (const i of cfgIssues) {
        checks.push({ name: `config:${i.level}`, ok: i.level !== "error", detail: i.message });
      }

      if (environment === "production") {
        checks.push({
          name: "network:tas-ix",
          ok: checks.some((c) => (c.name === "prepare_url" || c.name === "complete_url") && c.ok),
          detail: "CLICK callback kirish nuqtasi: pay.med1.uz, statik IP: 89.39.95.5",
        });
      }

      return json({
        ok: checks.every((c) => c.ok),
        environment,
        endpoints,
        checks,
        errors: checks.filter((c) => !c.ok).length,
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
        status: "pending", metadata: { admin_test: true, environment },
      }).select().single();
      if (error) throw error;

      return json({
        ok: true,
        environment,
        payment_id: payment.id,
        checkout_url: checkoutUrl({
          serviceId: env.serviceId, merchantId: env.merchantId, amount,
          transactionParam: payment.id,
          returnUrl: `${siteBase}/payment/success?payment_id=${payment.id}&provider=click`,
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
        const endpoint = action === "0" ? endpoints.prepare_url : endpoints.complete_url;
        const resp = await fetch(endpoint, {
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
