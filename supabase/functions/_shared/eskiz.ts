/** Provider-only delivery; OTP creation and verification remain in Cloud Auth. */
export type EskizConfig = { email: string; password: string; template: string };
export const OTP_TEMPLATE_ID = "96927";

export function buildSms(phone: string, otp: string, template: string) {
  if (!/^\+?998\d{9}$/.test(phone) || !/^\d{6,8}$/.test(otp)) {
    throw new Error("invalid_sms_payload");
  }
  // Accept common placeholder spellings used when saving the approved Eskiz text.
  const t = template;
  if (!t.trim() || t.length > 1000) throw new Error("invalid_sms_template");
  const ph = t.match(/\{\{\s*(code|otp|kod)\s*\}\}|\{\s*(code|otp|kod)\s*\}|%(code|otp|kod)%|\[(code|otp|kod)\]|<(code|otp|kod)>|%s|%d|%w|#{4,8}|X{4,8}/i);
  if (ph) return { phone: phone.replace(/^\+/, ""), message: t.split(ph[0]).join(otp) };
  // Eskiz-approved texts are often saved exactly as approved, with a sample code
  // (e.g. "Kod: 1234"). Swap that single 4-8 digit sample for the real OTP.
  const samples = [...t.matchAll(/(?<!\d)\d{4,8}(?!\d)/g)];
  if (samples.length !== 1) throw new Error("invalid_sms_template");
  const sample = samples[0];
  if (!sample || sample.index === undefined) throw new Error("invalid_sms_template");
  const message = t.slice(0, sample.index) + otp + t.slice(sample.index + sample[0].length);
  return { phone: phone.replace(/^\+/, ""), message };
}

export async function eskizToken(config: Pick<EskizConfig, "email" | "password">, request: typeof fetch = fetch): Promise<string> {
  if (!config.email || !config.password) throw new Error("eskiz_not_configured");
  const credentials = new FormData();
  credentials.set("email", config.email);
  credentials.set("password", config.password);
  const login = await request("https://notify.eskiz.uz/api/auth/login", {
    method: "POST", body: credentials, signal: AbortSignal.timeout(5000),
  });
  // Never propagate provider bodies: they may contain credentials or OTP content.
  if (!login.ok) throw new Error("eskiz_login_failed");
  const auth = await login.json();
  const token = auth?.data?.token;
  if (typeof token !== "string" || !token) throw new Error("eskiz_login_failed");
  return token;
}

export type EskizTemplate = { id: string; status: string; text: string; originalText: string };
/** Match the final message against Eskiz's approved word-field pattern, not a local guess. */
export function assertApprovedSmsPattern(message: string, approvedPattern: string): void {
  if (!approvedPattern || approvedPattern.length > 2000) throw new Error("invalid_sms_pattern");
  const marker = /%w(?:\{(\d+),(\d+)\})?/g;
  let pattern = "", start = 0;
  for (const match of approvedPattern.matchAll(marker)) {
    const at = match.index ?? 0;
    pattern += approvedPattern.slice(start, at).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const min = Number(match[1] ?? 1), max = Number(match[2] ?? 1);
    if (min < 1 || max < min || max > 10) throw new Error("invalid_sms_pattern");
    pattern += `\\S+(?: \\S+){${min - 1},${max - 1}}`;
    start = at + match[0].length;
  }
  pattern += approvedPattern.slice(start).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`^${pattern}$`, "u").test(message)) throw new Error("sms_pattern_mismatch");
  assertFinalSmsText(message);
}

export function buildApprovedOtpSms(phone: string, otp: string, templates: EskizTemplate[]) {
  const approved = templates.find(t => t.id === OTP_TEMPLATE_ID && t.status === "service");
  if (!approved?.originalText || !approved.text) throw new Error("eskiz_template_not_approved");
  const sms = buildSms(phone, otp, approved.originalText);
  assertApprovedSmsPattern(sms.message, approved.text);
  return sms;
}
export async function eskizTemplates(token: string, request: typeof fetch = fetch): Promise<EskizTemplate[]> {
  const response = await request("https://notify.eskiz.uz/api/user/templates", {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("eskiz_templates_failed");
  const j = await response.json();
  const list = j?.result ?? j?.data;
  if (!Array.isArray(list)) throw new Error("eskiz_templates_failed");
  return list.map((x) => ({ id: String(x.id ?? ""), status: String(x.status ?? ""), text: String(x.template ?? x.text ?? ""), originalText: String(x.original_text ?? "") }));
}

/** Fail closed before contacting Eskiz; provider placeholders are never SMS content. */
export function assertFinalSmsText(message: string): void {
  if (typeof message !== "string" || !message.trim() || message.length > 1000) throw new Error("invalid_sms_payload");
  if (/%[swd]/i.test(message) || /\{\{?\s*(?:code|otp|kod)\s*\}\}?/i.test(message)) {
    throw new Error("sms_unresolved_placeholder");
  }
}

export async function sendEskizMessage(token: string, phone: string, message: string, request: typeof fetch = fetch): Promise<void> {
  assertFinalSmsText(message);
  if (!/^\+?998\d{9}$/.test(phone) || !message || message.length > 1000) throw new Error("invalid_sms_payload");
  const body = new FormData();
  body.set("mobile_phone", phone.replace(/^\+/, ""));
  body.set("message", message);
  body.set("from", "4546");
  const sent = await request("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
    body, signal: AbortSignal.timeout(5000),
  });
  const result = await sent.json().catch(() => null);
  if (!sent.ok || (result?.status !== "waiting" && result?.status !== "success")) {
    // Provider reason with every digit masked, so the OTP and phone never reach logs.
    const reason = String(result?.message ?? result?.status ?? "")
      .replace(/\d/g, "•").slice(0, 160);
    if (/модерац/i.test(reason)) throw new Error("eskiz_template_not_approved");
    throw new Error(`eskiz_send_failed (${sent.status}) ${reason}`.trim());
  }
}

export async function sendEskizSms(config: EskizConfig, phone: string, otp: string, request: typeof fetch = fetch): Promise<void> {
  if (!/^\+?998\d{9}$/.test(phone) || !/^\d{6,8}$/.test(otp)) throw new Error("invalid_sms_payload");
  const token = await eskizToken(config, request);
  const sms = buildApprovedOtpSms(phone, otp, await eskizTemplates(token, request));
  await sendEskizMessage(token, sms.phone, sms.message, request);
}