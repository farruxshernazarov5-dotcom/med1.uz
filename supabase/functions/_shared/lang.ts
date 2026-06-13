// Shared language helper for AI edge functions.
// Reads a language code from a request body (uz/ru/en) and returns
// a system-prompt suffix instructing the model to respond in that language.

export type SupportedLang = "uz" | "ru" | "en";

export function normalizeLang(input: unknown): SupportedLang {
  const v = typeof input === "string" ? input.toLowerCase().slice(0, 2) : "";
  if (v === "ru") return "ru";
  if (v === "en") return "en";
  return "uz";
}

function textFromMessages(messages: unknown): string {
  try {
    if (Array.isArray(messages)) {
      const lastUser = [...messages].reverse().find((m: any) => m?.role === "user") as any;
      const c = lastUser?.content;
      if (typeof c === "string") return c;
      if (Array.isArray(c)) return c.map((p: any) => p?.text || "").join(" ");
    }
  } catch { /* noop */ }
  return typeof messages === "string" ? messages : "";
}

/** Prefer explicit UI lang, but auto-correct when the actual question is clearly RU/EN. */
export function resolveResponseLang(explicitLang: unknown, messagesOrText: unknown): SupportedLang {
  const text = textFromMessages(messagesOrText);
  if (/[а-яё]/i.test(text)) return "ru";
  const latin = text.toLowerCase();
  if (/\b(the|what|why|how|please|doctor|health|pain|symptom)\b/.test(latin)) return "en";
  return normalizeLang(explicitLang);
}

export function languageInstruction(lang: SupportedLang): string {
  switch (lang) {
    case "ru":
      return `\n\n=== ВАЖНО — ЯЗЫК ОТВЕТА ===
Отвечай ИСКЛЮЧИТЕЛЬНО на русском языке, даже если базовая инструкция написана на другом языке. Дисклеймер: "⚠️ Обратитесь к врачу."`;
    case "en":
      return `\n\n=== IMPORTANT — RESPONSE LANGUAGE ===
Respond EXCLUSIVELY in English, even if the base prompt is written in another language. Disclaimer: "⚠️ Consult a doctor."`;
    case "uz":
    default:
      return `\n\n=== MUHIM — JAVOB TILI ===
Faqat o'zbek tilida javob ber, bazaviy prompt boshqa tilda bo'lsa ham. Ogohlantirish: "⚠️ Shifokorga murojaat qiling."`;
  }
}
