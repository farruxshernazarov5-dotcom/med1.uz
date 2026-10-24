import { describe, expect, it } from "vitest";
import { renderTransactionalSms, SMS_TEMPLATE_IDS, type SmsEvent } from "../../supabase/functions/_shared/transactional-sms";

describe("approved transactional SMS", () => {
  const events = Object.keys(SMS_TEMPLATE_IDS) as SmsEvent[];
  for (const event of events) {
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