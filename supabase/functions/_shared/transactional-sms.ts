import { assertFinalSmsText, sendEskizMessage, type EskizTemplate } from "./eskiz.ts";

// These are provider template IDs, not credentials. No free-form SMS text is accepted.
export const SMS_TEMPLATE_IDS = {
  ai_analysis_ready: "96928",
  appointment_confirmed: "96929",
  appointment_today_reminder: "96931",
  ai_subscription_paid_and_active: "96930",
  ai_subscription_expired: "96933",
  ai_subscription_payment_failed: "96934",
  ai_subscription_expiring: "96935",
} as const;
export type SmsEvent = keyof typeof SMS_TEMPLATE_IDS;

/** Only call after the dispatcher has verified event, consent and deduplication.
 * All seven events use the same approved rendering and final-text send guard. */
export async function sendApprovedTransactionalSms(
  token: string, phone: string, event: SmsEvent, values: string[],
  templates: EskizTemplate[], request: typeof fetch = fetch,
): Promise<void> {
  const message = renderTransactionalSms(event, values, templates);
  await sendEskizMessage(token, phone, message, request);
}

/** Render original provider wording, then validate against the approved pattern.
 * Sending requires separate server-side event/consent checks; this does not send. */
export function renderTransactionalSms(event: SmsEvent, values: string[], templates: EskizTemplate[]): string {
  const template = templates.find(t => t.id === SMS_TEMPLATE_IDS[event] && t.status === "service");
  if (!template?.originalText || !template.text) throw new Error("sms_template_not_approved");
  const parameterCount = (template.originalText.match(/%s/g) ?? []).length;
  if (!Array.isArray(values) || !parameterCount || parameterCount !== values.length ||
    values.some(v => typeof v !== "string" || !v.trim() || v.length > 255 || /[\r\n]|%[swd]/i.test(v))) {
    throw new Error("invalid_sms_arguments");
  }
  let index = 0;
  const message = template.originalText.replace(/%s/g, () => values[index++] ?? "");
  if (index !== values.length || !index || /%[sw]/.test(message) || message.length > 1000) throw new Error("invalid_sms_arguments");
  // %w is one word; %w{1,4} allows an approved 1–4-word field.
  const marker = /%w(?:\{(\d+),(\d+)\})?/g;
  let pattern = "", start = 0;
  for (const match of template.text.matchAll(marker)) {
    const at = match.index ?? 0;
    pattern += template.text.slice(start, at).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const min = Number(match[1] ?? 1), max = Number(match[2] ?? 1);
    if (min < 1 || max < min || max > 10) throw new Error("invalid_sms_pattern");
    pattern += `\\S+(?: \\S+){${min - 1},${max - 1}}`;
    start = at + match[0].length;
  }
  pattern += template.text.slice(start).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`^${pattern}$`, "u").test(message)) throw new Error("sms_pattern_mismatch");
  assertFinalSmsText(message);
  return message;
}