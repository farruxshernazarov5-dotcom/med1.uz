import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { uz } from "./locales/uz";
import { ru } from "./locales/ru";
import { en } from "./locales/en";

export const SUPPORTED_LANGUAGES = ["uz", "ru", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    fallbackLng: "uz",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "med1-lang",
      caches: ["localStorage"],
    },
  });

// Keep <html lang="..."> in sync for SEO & a11y
const applyHtmlLang = (lng: string) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng;
};
applyHtmlLang(i18n.language);
i18n.on("languageChanged", applyHtmlLang);

export default i18n;
