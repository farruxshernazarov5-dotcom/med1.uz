import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { detectLangFromText, resolveResponseLang, languageInstruction } from "./lang.ts";

Deno.test("detects Russian Cyrillic user message", () => {
  assertEquals(detectLangFromText("У меня болит голова"), "ru");
});

Deno.test("last Russian message overrides Uzbek fallback", () => {
  assertEquals(resolveResponseLang([{ role: "user", content: "У меня болит голова" }], "uz"), "ru");
});

Deno.test("Russian instruction contains strict no-Uzbek guard", () => {
  const instruction = languageInstruction("ru");
  assertEquals(instruction.includes("TARGET_REPLY_LANGUAGE: Russian / русский"), true);
  assertEquals(instruction.includes("Не отвечай на узбекском"), true);
});
