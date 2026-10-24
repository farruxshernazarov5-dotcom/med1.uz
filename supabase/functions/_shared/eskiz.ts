/** Provider-only delivery; OTP creation and verification remain in Cloud Auth. */
export type EskizConfig = { email: string; password: string; template: string };

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
  const sample = t.match(/(?<!\d)\d{4,8}(?!\d)/);
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

export async function sendEskizMessage(token: string, phone: string, message: string, request: typeof fetch = fetch): Promise<void> {
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
  const sms = buildSms(phone, otp, config.template);
  const token = await eskizToken(config, request);
  try {
    await sendEskizMessage(token, sms.phone, sms.message, request);
  } catch (error) {
    if (error instanceof Error && error.message === "eskiz_template_not_approved") {
      try {
        const templates = await eskizTemplates(token, request);
        // Provider-approved public wording only: no pending text, credentials, phone or OTP.
        console.log("eskiz approved templates", JSON.stringify(templates.filter(t => t.status === "service")));
      } catch { /* Provider diagnostics must not replace the original failure. */ }
    }
    throw error;
  }
}