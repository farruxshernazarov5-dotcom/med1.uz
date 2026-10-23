/** Provider-only delivery; OTP creation and verification remain in Cloud Auth. */
export type EskizConfig = { email: string; password: string; template: string };

export function buildSms(phone: string, otp: string, template: string) {
  if (!/^\+?998\d{9}$/.test(phone) || !/^\d{6,8}$/.test(otp)) {
    throw new Error("invalid_sms_payload");
  }
  // Accept common placeholder spellings used when saving the approved Eskiz text.
  const t = template.trim();
  const ph = t.match(/\{\{\s*(code|otp|kod)\s*\}\}|\{\s*(code|otp|kod)\s*\}|%(code|otp|kod)%|\[(code|otp|kod)\]|<(code|otp|kod)>|%s|%d|#{4,8}|X{4,8}/i);
  if (!ph || t.length > 1000) throw new Error("invalid_sms_template");
  return { phone: phone.replace(/^\+/, ""), message: t.split(ph[0]).join(otp) };
}

export async function sendEskizSms(
  config: EskizConfig, phone: string, otp: string,
  request: typeof fetch = fetch,
): Promise<void> {
  const sms = buildSms(phone, otp, config.template);
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
  const body = new FormData();
  body.set("mobile_phone", sms.phone);
  body.set("message", sms.message);
  body.set("from", "4546");
  const sent = await request("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
    body, signal: AbortSignal.timeout(5000),
  });
  if (!sent.ok) throw new Error("eskiz_send_failed");
  const result = await sent.json();
  if (result?.status !== "waiting" && result?.status !== "success") {
    throw new Error("eskiz_send_failed");
  }
}