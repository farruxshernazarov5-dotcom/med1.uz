import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderTransactionalSms, sendApprovedTransactionalSms, SMS_TEMPLATE_IDS, type SmsEvent } from "../../supabase/functions/_shared/transactional-sms";

beforeAll(() => {
  // jsdom lacks the Deno/native helper; provider requests are mocked here.
  if (!AbortSignal.timeout) Object.defineProperty(AbortSignal, "timeout", {
    configurable: true, value: () => new AbortController().signal,
  });
});

describe("approved transactional SMS", () => {
  it("fills all four approved appointment confirmation fields from screenshot 96929", () => {
    const originalText = "Med1.uz: Qabulga yozildingiz. Shifokor: %s, sana: %s, vaqt: %s. Manzil: %s.";
    const template = { id: "96929", status: "service", originalText, text: "Med1.uz: Qabulga yozildingiz. Shifokor: %w{1,4}, sana: %w, vaqt: %w. Manzil: %w{1,4}." };
    expect(renderTransactionalSms("appointment_confirmed", ["Ali Valiyev", "29.10.2026", "14:00", "Toshkent shahri"], [template]))
      .toBe("Med1.uz: Qabulga yozildingiz. Shifokor: Ali Valiyev, sana: 29.10.2026, vaqt: 14:00. Manzil: Toshkent shahri.");
    expect(() => renderTransactionalSms("appointment_confirmed", ["Ali Valiyev", "29.10.2026", "14:00"], [template])).toThrow("invalid_sms_arguments");
  });
  it("fills the approved AI ready destination from screenshot 96928", () => {
    const originalText = "Med1.uz: Siz so'ragan tibbiy AI tahlili tayyor. Natijani profilingizda ko'rishingiz mumkin: %s";
    expect(renderTransactionalSms("ai_analysis_ready", ["https://med1.uz/mobile-profile"], [{ id: "96928", status: "service", originalText, text: originalText.replace("%s", "%w") }]))
      .toBe("Med1.uz: Siz so'ragan tibbiy AI tahlili tayyor. Natijani profilingizda ko'rishingiz mumkin: https://med1.uz/mobile-profile");
  });
  const events = Object.keys(SMS_TEMPLATE_IDS) as SmsEvent[];
  for (const event of events) {
    it(`sends ${event} only after approved parameter substitution`, async () => {
      const template = { id: SMS_TEMPLATE_IDS[event], status: "service", text: "Med1.uz: %w", originalText: "Med1.uz: %s" };
      const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "waiting" })));
      await sendApprovedTransactionalSms("test-only", "+998901234567", event, ["2026-10-25"], [template], request);
      expect(request).toHaveBeenCalledTimes(1);
      expect((request.mock.calls[0][1].body as FormData).get("message")).toBe("Med1.uz: 2026-10-25");
      request.mockClear();
      await expect(sendApprovedTransactionalSms("test-only", "+998901234567", event, ["%s"], [template], request))
        .rejects.toThrow("invalid_sms_arguments");
      expect(request).not.toHaveBeenCalled();
    });
    it(`maps ${event} to its separate approved provider template`, () => {
      const template = { id: SMS_TEMPLATE_IDS[event], status: "service", text: "Med1.uz: %w", originalText: "Med1.uz: %s" };
      expect(renderTransactionalSms(event, ["2026-10-25"], [template])).toBe("Med1.uz: 2026-10-25");
      expect(() => renderTransactionalSms(event, ["2026-10-25"], [{ ...template, status: "rejected" }])).toThrow("sms_template_not_approved");
    });
  }
  it("never emits provider matching placeholders or adds punctuation", () => {
    const template = { id: "96931", status: "service", text: "Med1.uz: Eslatma! Bugun soat %w da shifokor %w{1,4} qabuliga yozilgansiz.", originalText: "Med1.uz: Eslatma! Bugun soat %s da shifokor %s qabuliga yozilgansiz." };
    expect(renderTransactionalSms("appointment_today_reminder", ["14:00", "Ali Valiyev"], [template])).toBe("Med1.uz: Eslatma! Bugun soat 14:00 da shifokor Ali Valiyev qabuliga yozilgansiz.");
    expect(() => renderTransactionalSms("appointment_today_reminder", ["14:00", "bir ikki uch tort besh"], [template])).toThrow("sms_pattern_mismatch");
  });
  it("requires every reminder parameter and rejects extra, blank or unresolved values", () => {
    const template = { id: "96931", status: "service", text: "Med1.uz: Bugun %w, shifokor %w{1,4}.", originalText: "Med1.uz: Bugun %s, shifokor %s." };
    for (const values of [["14:00"], ["14:00", "Ali", "extra"], ["14:00", " "], ["14:00", "%s"]]) {
      expect(() => renderTransactionalSms("appointment_today_reminder", values, [template])).toThrow("invalid_sms_arguments");
    }
  });
});