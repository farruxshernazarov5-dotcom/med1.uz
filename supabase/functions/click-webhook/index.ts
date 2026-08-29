import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// MD5 — Web Crypto API'da yo'q, shuning uchun npm:blueimp-md5 ishlatamiz
import md5 from "npm:blueimp-md5@2.19.0";

// Click webhook — public endpoint
// Himoya qatlamlari:
//   1) MD5 imzo tekshiruvi (Click protokoli)
//   2) sign_time freshness (5 daqiqadan eski emas) — replay window
//   3) Idempotency: (click_trans_id, action) bo'yicha unique log
//   4) IP rate-limit (1 daqiqada 60 ta so'rov)
//   5) Audit log: har bir so'rov (qabul qilingan/rad etilgan)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const SIGN_TIME_MAX_AGE_SEC = 300; // 5 daqiqa
const RATE_LIMIT_PER_MIN = 60;

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

function parseSignTime(s: string): Date | null {
  // Click format: "YYYY-MM-DD HH:mm:ss" (Asia/Tashkent, UTC+5)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  // UTC+5 dan UTC ga
  const ts = Date.UTC(+y, +mo - 1, +d, +h - 5, +mi, +se);
  return new Date(ts);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const ip = getClientIp(req);

  const writeLog = async (entry: Record<string, unknown>) => {
    try {
      await admin.from("click_webhook_log").insert(entry);
    } catch (e) {
      console.error("log insert failed", e);
    }
  };

  try {
    const secretKey = Deno.env.get("CLICK_SECRET_KEY")!;
    const serviceId = Deno.env.get("CLICK_SERVICE_ID")!;

    // ---- Body parse ----
    const contentType = req.headers.get("content-type") || "";
    let params: Record<string, string> = {};
    if (contentType.includes("application/json")) {
      params = await req.json();
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) params[k] = String(v);
    }

    const action = String(params.action ?? "");
    const click_trans_id = String(params.click_trans_id ?? "");
    const service_id = String(params.service_id ?? "");
    const merchant_trans_id = String(params.merchant_trans_id ?? "");
    const amount = String(params.amount ?? "");
    const sign_time = String(params.sign_time ?? "");
    const sign_string = String(params.sign_string ?? "");
    const merchant_prepare_id = String(params.merchant_prepare_id ?? "");
    const expectedAction = req.headers.get("x-click-expected-action");

    const reply = (error: number, error_note: string, extra: Record<string, unknown> = {}) => {
      const body = { click_trans_id, merchant_trans_id, ...extra, error, error_note };
      return new Response(JSON.stringify(body), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    // Prepare va Complete kabinet URL'lari almashib qolgan bo'lsa, xatoni
    // yashirmasdan CLICK protokoli bo'yicha aniq javob qaytaramiz.
    if (expectedAction && action !== expectedAction) {
      const resp = reply(-3, "Action not found");
      await writeLog({
        click_trans_id, action, merchant_trans_id, request_ip: ip,
        request_body: params, status: "error",
        error_note: `callback route expects action=${expectedAction}, received action=${action}`,
      });
      return resp;
    }

    // ---- 1) Rate limit ----
    const sinceMin = new Date(Date.now() - 60_000).toISOString();
    const { count: ipCount } = await admin
      .from("click_webhook_log")
      .select("id", { count: "exact", head: true })
      .eq("request_ip", ip)
      .gte("created_at", sinceMin);

    if ((ipCount ?? 0) > RATE_LIMIT_PER_MIN) {
      const resp = reply(-8, "Rate limit exceeded");
      await writeLog({
        click_trans_id, action, merchant_trans_id, request_ip: ip,
        request_body: params, status: "rejected_ratelimit",
        error_note: `IP ${ip} exceeded ${RATE_LIMIT_PER_MIN}/min`,
      });
      return resp;
    }

    // ---- 2) Signature verify ----
    const expected = action === "1"
      ? md5(`${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`)
      : md5(`${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`);

    if (sign_string !== expected) {
      const resp = reply(-1, "SIGN CHECK FAILED");
      await writeLog({
        click_trans_id, action, merchant_trans_id, sign_string, sign_time,
        request_ip: ip, request_body: params, status: "rejected_signature",
        error_note: "MD5 mismatch",
      });
      return resp;
    }

    // ---- 3) Timestamp freshness (replay window) ----
    const signDate = parseSignTime(sign_time);
    if (!signDate) {
      const resp = reply(-8, "Invalid sign_time format");
      await writeLog({
        click_trans_id, action, merchant_trans_id, sign_time, request_ip: ip,
        request_body: params, status: "rejected_expired", error_note: "bad sign_time",
      });
      return resp;
    }
    const ageSec = Math.abs((Date.now() - signDate.getTime()) / 1000);
    if (ageSec > SIGN_TIME_MAX_AGE_SEC) {
      const resp = reply(-8, "sign_time expired");
      await writeLog({
        click_trans_id, action, merchant_trans_id, sign_time, request_ip: ip,
        request_body: params, status: "rejected_expired",
        error_note: `age ${Math.round(ageSec)}s > ${SIGN_TIME_MAX_AGE_SEC}s`,
      });
      return resp;
    }

    // ---- 4) Service ID ----
    if (service_id !== serviceId) {
      const resp = reply(-3, "Action not found");
      await writeLog({
        click_trans_id, action, merchant_trans_id, request_ip: ip,
        request_body: params, status: "error", error_note: "wrong service_id",
      });
      return resp;
    }

    // ---- 5) Replay protection: bu (click_trans_id, action) avval qayta ishlanganmi? ----
    const { data: prev } = await admin
      .from("click_webhook_log")
      .select("id, response_body")
      .eq("click_trans_id", click_trans_id)
      .eq("action", action)
      .eq("status", "processed")
      .maybeSingle();

    if (prev) {
      // Idempotent javob — Click qoidasiga ko'ra avvalgi muvaffaqiyatli javobni qaytaramiz
      console.log("Replay detected, returning cached response", click_trans_id);
      await writeLog({
        click_trans_id, action, merchant_trans_id, request_ip: ip,
        request_body: params, status: "rejected_replay",
        error_note: `duplicate of log ${prev.id}`,
      });
      return new Response(JSON.stringify(prev.response_body ?? { error: 0, error_note: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- 6) Payment topish ----
    const { data: payment, error: pErr } = await admin
      .from("platform_payments")
      .select("*")
      .eq("id", merchant_trans_id)
      .maybeSingle();

    if (pErr || !payment) {
      const resp = reply(-5, "User does not exist");
      await writeLog({
        click_trans_id, action, merchant_trans_id, request_ip: ip,
        request_body: params, status: "error", error_note: "payment not found",
      });
      return resp;
    }
    const paymentAmount = Number(payment.amount);
    const clickAmount = Number(amount);
    if (!Number.isFinite(clickAmount) || paymentAmount.toFixed(2) !== clickAmount.toFixed(2)) {
      const resp = reply(-2, "Incorrect parameter amount");
      await writeLog({
        click_trans_id, action, merchant_trans_id, payment_id: payment.id,
        request_ip: ip, request_body: params, status: "error",
        error_note: `amount mismatch: expected=${payment.amount}, received=${amount}`,
      });
      return resp;
    }
    if (payment.status === "paid" && action === "1") {
      const resp = reply(-4, "Already paid");
      await writeLog({
        click_trans_id, action, merchant_trans_id, payment_id: payment.id,
        request_ip: ip, request_body: params, status: "rejected_replay",
        error_note: "payment already paid",
      });
      return resp;
    }
    if (payment.status === "cancelled") {
      const resp = reply(-9, "Transaction cancelled");
      await writeLog({
        click_trans_id, action, merchant_trans_id, payment_id: payment.id,
        request_ip: ip, request_body: params, status: "error", error_note: "cancelled",
      });
      return resp;
    }

    // CLICK Merchant API expects merchant_prepare_id to be a numeric identifier.
    // Keep it stable across Prepare/Complete by storing CLICK's own numeric
    // transaction id instead of returning our UUID payment id.
    const numericPrepareId = Number(click_trans_id);
    if (!Number.isSafeInteger(numericPrepareId) || numericPrepareId <= 0) {
      const resp = reply(-8, "Invalid click_trans_id");
      await writeLog({
        click_trans_id, action, merchant_trans_id, payment_id: payment.id,
        request_ip: ip, request_body: params, status: "error",
        error_note: "click_trans_id is not a safe positive integer",
      });
      return resp;
    }

    // ---- 7) Asosiy logika ----
    let response: Record<string, unknown>;

    if (action === "0") {
      // Prepare
      await admin.from("platform_payments").update({
        provider_transaction_id: click_trans_id,
        prepare_id: numericPrepareId,
        metadata: { ...(payment.metadata ?? {}), prepare_at: new Date().toISOString(), prepare_ip: ip },
      }).eq("id", payment.id);

      response = {
        click_trans_id, merchant_trans_id,
        merchant_prepare_id: numericPrepareId,
        error: 0, error_note: "Success",
      };
    } else if (action === "1") {
      if (!merchant_prepare_id || String(payment.prepare_id ?? "") !== merchant_prepare_id) {
        const resp = reply(-6, "Transaction does not exist");
        await writeLog({
          click_trans_id, action, merchant_trans_id, payment_id: payment.id,
          request_ip: ip, request_body: params, status: "error",
          error_note: "merchant_prepare_id mismatch",
        });
        return resp;
      }

      // Complete — atomic guard: faqat pending bo'lsa update bo'ladi
      const { data: updated, error: uErr } = await admin
        .from("platform_payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          provider_payment_id: click_trans_id,
        })
        .eq("id", payment.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (uErr || !updated) {
        const resp = reply(-4, "Already paid");
        await writeLog({
          click_trans_id, action, merchant_trans_id, payment_id: payment.id,
          request_ip: ip, request_body: params, status: "rejected_replay",
          error_note: "concurrent paid",
        });
        return resp;
      }

      response = {
        click_trans_id, merchant_trans_id,
        // CLICK expects a numeric merchant transaction identifier here too.
        // Reuse the persisted Prepare identifier instead of exposing our UUID.
        merchant_confirm_id: Number(payment.prepare_id),
        error: 0, error_note: "Success",
      };
    } else {
      const resp = reply(-3, "Action not found");
      await writeLog({
        click_trans_id, action, merchant_trans_id, payment_id: payment.id,
        request_ip: ip, request_body: params, status: "error", error_note: "unknown action",
      });
      return resp;
    }

    // Muvaffaqiyatli — log + javob (unique index replay'ni bloklaydi)
    await writeLog({
      click_trans_id, action, merchant_trans_id, payment_id: payment.id,
      sign_string, sign_time, request_ip: ip,
      request_body: params, response_body: response, status: "processed",
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("click-webhook error:", err);
    await writeLog({
      click_trans_id: "unknown", action: "unknown", request_ip: ip,
      status: "error", error_note: String(err),
    });
    return new Response(JSON.stringify({ error: -7, error_note: "Server error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
