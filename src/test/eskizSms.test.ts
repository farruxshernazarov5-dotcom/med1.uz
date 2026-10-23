import { describe, expect, it, vi } from "vitest";
import { buildSms, sendEskizSms } from "../../supabase/functions/eskiz-sms-hook/eskiz";

describe("Eskiz SMS delivery", () => {
  it("uses the approved text with the exact supplied OTP and Uzbekistan phone", () => {
    expect(buildSms("+998901234567", "123456", "Med1.uz: {code}"))
      .toEqual({ phone: "998901234567", message: "Med1.uz: 123456" });
  });
  it("rejects numbers outside +998 and invalid OTPs", () => {
    expect(() => buildSms("+1901234567", "123456", "{code}")).toThrow();
    expect(() => buildSms("+998901234567", "12x456", "{code}")).toThrow();
  });
  it("does not invent text when the template lacks its code placeholder", () => {
    expect(() => buildSms("+998901234567", "123456", "Med1.uz")).toThrow("invalid_sms_template");
  });
  it("reads provider credentials only for login and sends the supplied message", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { token: "test-only-token" } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "waiting" })));
    await sendEskizSms({ email: "test@example.invalid", password: "test-only", template: "Kod: {code}" },
      "+998901234567", "123456", request);
    expect(request).toHaveBeenCalledTimes(2);
    const loginBody = request.mock.calls[0][1].body as FormData;
    expect(loginBody.get("email")).toBe("test@example.invalid");
    expect(loginBody.get("password")).toBe("test-only");
    const smsBody = request.mock.calls[1][1].body as FormData;
    expect(smsBody.get("message")).toBe("Kod: 123456");
    expect(smsBody.has("password")).toBe(false);
  });
  it("does not report provider rejection as successful delivery", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { token: "test-only-token" } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "error" })));
    await expect(sendEskizSms({ email: "test@example.invalid", password: "test-only", template: "{code}" },
      "+998901234567", "123456", request)).rejects.toThrow("eskiz_send_failed");
  });
});