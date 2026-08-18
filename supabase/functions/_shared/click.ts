// Click (click.uz) merchant API — umumiy protokol moduli.
// Rasmiy Click Merchant API v2 (SHOP API) protokoli asosida:
//   action=0 → Prepare, action=1 → Complete
//   Prepare  sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
//   Complete sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "npm:blueimp-md5@2.19.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const SIGN_TIME_MAX_AGE_SEC = 300;
export const RATE_LIMIT_PER_MIN = 120;

/** Click rasmiy error kodlari */
export const ClickError = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  FAILED_TO_UPDATE_USER: -7,
  ERROR_IN_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
} as const;

export interface ClickParams {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id: string;
  merchant_trans_id: string;
  merchant_prepare_id: string;
  amount: string;
  action: string;
  error: string;
  error_note: string;
  sign_time: string;
  sign_string: string;
  raw: Record<string, string>;
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

export async function parseClickRequest(req: Request): Promise<ClickParams> {
  const ct = req.headers.get("content-type") || "";
  let raw: Record<string, string> = {};
  if (ct.includes("application/json")) {
    const j = await req.json();
    for (const [k, v] of Object.entries(j ?? {})) raw[k] = String(v ?? "");
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    for (const [k, v] of new URLSearchParams(text).entries()) raw[k] = v;
  } else {
    try {
      const form = await req.formData();
      for (const [k, v] of form.entries()) raw[k] = String(v);
    } catch {
      raw = {};
    }
  }
  // query string ham qo'llab-quvvatlanadi
  const url = new URL(req.url);
  for (const [k, v] of url.searchParams.entries()) if (!(k in raw)) raw[k] = v;

  const g = (k: string) => String(raw[k] ?? "");
  return {
    click_trans_id: g("click_trans_id"),
    service_id: g("service_id"),
    click_paydoc_id: g("click_paydoc_id"),
    merchant_trans_id: g("merchant_trans_id"),
    merchant_prepare_id: g("merchant_prepare_id"),
    amount: g("amount"),
    action: g("action"),
    error: g("error"),
    error_note: g("error_note"),
    sign_time: g("sign_time"),
    sign_string: g("sign_string"),
    raw,
  };
}

export function buildSignString(p: ClickParams, secretKey: string): string {
  if (p.action === "1") {
    return md5(
      `${p.click_trans_id}${p.service_id}${secretKey}${p.merchant_trans_id}${p.merchant_prepare_id}${p.amount}${p.action}${p.sign_time}`,
    );
  }
  return md5(
    `${p.click_trans_id}${p.service_id}${secretKey}${p.merchant_trans_id}${p.amount}${p.action}${p.sign_time}`,
  );
}

/** Click sign_time formati: "YYYY-MM-DD HH:mm:ss" (Asia/Tashkent, UTC+5) */
export function parseSignTime(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h - 5, +mi, +se));
}

export function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function writeCallbackLog(
  admin: SupabaseClient,
  entry: Record<string, unknown>,
) {
  try {
    await admin.from("click_webhook_log").insert(entry);
  } catch (e) {
    console.error("click_webhook_log insert failed:", e);
  }
}

export interface GuardResult {
  ok: boolean;
  response?: Response;
  payment?: Record<string, unknown>;
}

/**
 * Umumiy tekshiruvlar: rate limit → imzo → sign_time → service_id → payment → summa.
 * Har qanday muvaffaqiyatsizlikda Click formatidagi javob qaytariladi va log yoziladi.
 */
export async function guardClickRequest(
  admin: SupabaseClient,
  p: ClickParams,
  ip: string,
  expectedAction: "0" | "1",
): Promise<GuardResult> {
  const secretKey = Deno.env.get("CLICK_SECRET_KEY") ?? "";
  const serviceId = Deno.env.get("CLICK_SERVICE_ID") ?? "";

  const base = {
    click_trans_id: p.click_trans_id,
    action: p.action,
    merchant_trans_id: p.merchant_trans_id,
    sign_string: p.sign_string,
    sign_time: p.sign_time,
    request_ip: ip,
    request_body: p.raw,
  };

  const fail = async (error: number, note: string, status: string, extra: Record<string, unknown> = {}) => {
    const body = {
      click_trans_id: p.click_trans_id,
      merchant_trans_id: p.merchant_trans_id,
      ...extra,
      error,
      error_note: note,
    };
    await writeCallbackLog(admin, { ...base, status, error_note: note, response_body: body });
    return { ok: false as const, response: jsonResponse(body) };
  };

  if (!secretKey || !serviceId) {
    return await fail(ClickError.ERROR_IN_REQUEST, "Merchant credentials not configured", "error");
  }

  if (p.action !== expectedAction) {
    return await fail(ClickError.ACTION_NOT_FOUND, "Action not found", "error");
  }

  // 1) Rate limit
  const sinceMin = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from("click_webhook_log")
    .select("id", { count: "exact", head: true })
    .eq("request_ip", ip)
    .gte("created_at", sinceMin);
  if ((count ?? 0) > RATE_LIMIT_PER_MIN) {
    return await fail(ClickError.ERROR_IN_REQUEST, "Rate limit exceeded", "rejected_ratelimit");
  }

  // 2) Imzo
  if (!p.sign_string || p.sign_string.toLowerCase() !== buildSignString(p, secretKey).toLowerCase()) {
    return await fail(ClickError.SIGN_CHECK_FAILED, "SIGN CHECK FAILED", "rejected_signature");
  }

  // 3) sign_time freshness (replay window)
  const signDate = parseSignTime(p.sign_time);
  if (!signDate) {
    return await fail(ClickError.ERROR_IN_REQUEST, "Invalid sign_time format", "rejected_expired");
  }
  const ageSec = Math.abs((Date.now() - signDate.getTime()) / 1000);
  if (ageSec > SIGN_TIME_MAX_AGE_SEC) {
    return await fail(ClickError.ERROR_IN_REQUEST, "sign_time expired", "rejected_expired");
  }

  // 4) service_id
  if (p.service_id !== serviceId) {
    return await fail(ClickError.ACTION_NOT_FOUND, "Action not found", "error");
  }

  // 5) merchant_trans_id → payment (UUID)
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(p.merchant_trans_id)) {
    return await fail(ClickError.TRANSACTION_NOT_FOUND, "Transaction does not exist", "error");
  }
  const { data: payment } = await admin
    .from("platform_payments")
    .select("*")
    .eq("id", p.merchant_trans_id)
    .maybeSingle();
  if (!payment) {
    return await fail(ClickError.TRANSACTION_NOT_FOUND, "Transaction does not exist", "error");
  }
  if (payment.status === "cancelled" || payment.status === "failed") {
    return await fail(ClickError.TRANSACTION_CANCELLED, "Transaction cancelled", "error");
  }

  // 6) Summa — server tomonidagi qiymat bilan solishtiriladi (fraud himoyasi)
  if (Math.abs(Number(payment.amount) - Number(p.amount)) > 0.01) {
    return await fail(ClickError.INCORRECT_AMOUNT, "Incorrect parameter amount", "error");
  }

  return { ok: true, payment };
}

/** Click callback'da error < 0 bo'lsa — to'lov bekor qilingan */
export function isClickCancelled(p: ClickParams): boolean {
  const e = Number(p.error || 0);
  return Number.isFinite(e) && e < 0;
}
