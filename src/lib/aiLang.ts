import i18n from "@/i18n/config";

/** Current UI language (uz/ru/en). Use to inject into edge function bodies so AI replies in the same language. */
export function currentLang(): "uz" | "ru" | "en" {
  const v = (i18n.language || "uz").toLowerCase().slice(0, 2);
  return v === "ru" ? "ru" : v === "en" ? "en" : "uz";
}

/** Merge current language into a request body for AI edge functions. */
export function withLang<T extends Record<string, unknown>>(body: T): T & { lang: string } {
  return { ...body, lang: currentLang() };
}
