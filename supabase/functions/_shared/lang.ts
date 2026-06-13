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

export function languageInstruction(lang: SupportedLang): string {
  switch (lang) {
    case "ru":
      return `\n\n=== ВАЖНО — ЯЗЫК ОТВЕТА ===
Отвечай ИСКЛЮЧИТЕЛЬНО на русском языке. Все заголовки, объяснения и рекомендации — на русском. Сохраняй медицинские термины (ICD-10, латинские названия) в стандартной форме. Эмодзи и markdown-формат сохраняются.
Дисклеймер в конце каждого ответа: "⚠️ Рекомендации AI не заменяют профессиональную медицинскую консультацию."`;
    case "en":
      return `\n\n=== IMPORTANT — RESPONSE LANGUAGE ===
Respond EXCLUSIVELY in English. All headings, explanations and recommendations must be in English. Keep medical terminology (ICD-10, Latin names) in standard form. Preserve emoji and markdown formatting.
Always end with: "⚠️ AI recommendations do not replace professional medical consultation."`;
    case "uz":
    default:
      return `\n\n=== MUHIM — JAVOB TILI ===
Faqat o'zbek tilida javob ber. Barcha sarlavhalar, izohlar va tavsiyalar o'zbekcha bo'lsin. Tibbiy terminlarni (ICD-10, lotincha nomlar) standart shaklda qoldir. Emoji va markdown formatini saqla.
Har bir javob oxirida: "⚠️ AI tavsiyalari professional tibbiy maslahat o'rnini bosmaydi."`;
  }
}
