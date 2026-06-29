import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/config";
import { detectLangFromText, responseLangForText } from "@/lib/aiLang";

describe("AI language detection", () => {
  it("detects Russian Cyrillic questions so AI replies in Russian", () => {
    expect(detectLangFromText("У меня болит голова, что делать?")).toBe("ru");
  });

  it("detects Uzbek latin questions", () => {
    expect(detectLangFromText("Boshim og'riyapti, nima qilish kerak?")).toBe("uz");
  });

  it("falls back to current UI language when text is ambiguous", async () => {
    await i18n.changeLanguage("ru");
    expect(responseLangForText("12345")).toBe("ru");
  });

  it("does not confuse Russian Cyrillic with Uzbek UI fallback", async () => {
    await i18n.changeLanguage("uz");
    expect(responseLangForText("У меня болит голова")).toBe("ru");
  });
});