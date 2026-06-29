import i18n from "@/i18n/config";

/** Current UI language (uz/ru/en). Use to inject into edge function bodies so AI replies in the same language. */
export function currentLang(): "uz" | "ru" | "en" {
  const v = (i18n.language || "uz").toLowerCase().slice(0, 2);
  return v === "ru" ? "ru" : v === "en" ? "en" : "uz";
}

export function detectLangFromText(input: unknown): "uz" | "ru" | "en" | null {
  const text = typeof input === "string" ? input.trim() : "";
  if (!text) return null;
  if (/[а-яё]/i.test(text)) return "ru";
  const lower = text.toLowerCase();
  const enHits = (lower.match(/\b(the|and|with|what|why|how|doctor|pain|please|can|should|health)\b/g) || []).length;
  const uzHits = (lower.match(/\b(men|menga|nima|qanday|nega|og['‘’`]?riq|bosh|dori|shifokor|iltimos|bor|yo['‘’`]?q)\b/g) || []).length;
  if (enHits > uzHits && enHits >= 2) return "en";
  if (uzHits > 0) return "uz";
  return null;
}

export function responseLangForText(input: unknown): "uz" | "ru" | "en" {
  return detectLangFromText(input) ?? currentLang();
}

/** Merge current language into a request body for AI edge functions. */
export function withLang<T extends Record<string, unknown>>(body: T): T & { lang: string } {
  return { ...body, lang: currentLang() };
}
