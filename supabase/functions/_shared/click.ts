// Click integratsiyasi uchun umumiy yordamchilar
export const clickCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function clickEnv() {
  const serviceId = (Deno.env.get("CLICK_SERVICE_ID") ?? "").trim();
  const merchantId = (Deno.env.get("CLICK_MERCHANT_ID") ?? "").trim();
  const merchantUserId = (Deno.env.get("CLICK_MERCHANT_USER_ID") ?? "").trim();
  const secretKey = (Deno.env.get("CLICK_SECRET_KEY") ?? "").trim();
  return { serviceId, merchantId, merchantUserId, secretKey };
}

export function mask(v: string) {
  if (!v) return "";
  if (v.length <= 6) return "*".repeat(v.length);
  return `${v.slice(0, 3)}${"*".repeat(Math.max(4, v.length - 6))}${v.slice(-3)}`;
}

/** Click Merchant API v2 auth: sha1(timestamp + secret_key) */
export async function clickAuthHeader(merchantUserId: string, secretKey: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const bytes = new TextEncoder().encode(`${timestamp}${secretKey}`);
  const buf = await crypto.subtle.digest("SHA-1", bytes);
  const digest = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${merchantUserId}:${digest}:${timestamp}`;
}

export function checkoutUrl(opts: {
  serviceId: string;
  merchantId: string;
  amount: number;
  transactionParam: string;
  returnUrl: string;
}) {
  const p = new URLSearchParams({
    service_id: opts.serviceId,
    merchant_id: opts.merchantId,
    amount: String(opts.amount),
    transaction_param: opts.transactionParam,
    return_url: opts.returnUrl,
  });
  return `https://my.click.uz/services/pay?${p.toString()}`;
}

/** Konfiguratsiya sog'lig'ini tekshirish — "yetkazib beruvchi ma'lumoti yetarli emas" xatosining sabablari */
export function validateClickConfig(env: ReturnType<typeof clickEnv>) {
  const issues: { level: "error" | "warn"; message: string }[] = [];
  if (!env.serviceId) issues.push({ level: "error", message: "CLICK_SERVICE_ID topilmadi" });
  else if (!/^\d+$/.test(env.serviceId)) issues.push({ level: "error", message: "CLICK_SERVICE_ID faqat raqamlardan iborat bo'lishi kerak" });
  if (!env.merchantId) issues.push({ level: "error", message: "CLICK_MERCHANT_ID topilmadi" });
  else if (!/^\d+$/.test(env.merchantId)) issues.push({ level: "error", message: "CLICK_MERCHANT_ID faqat raqamlardan iborat bo'lishi kerak" });
  if (!env.merchantUserId) issues.push({ level: "warn", message: "CLICK_MERCHANT_USER_ID yo'q — fiskalizatsiya (chek) ishlamaydi" });
  if (!env.secretKey) issues.push({ level: "error", message: "CLICK_SECRET_KEY topilmadi" });
  else if (env.secretKey.length < 8) issues.push({ level: "warn", message: "CLICK_SECRET_KEY juda qisqa — noto'g'ri nusxalangan bo'lishi mumkin" });
  return issues;
}
