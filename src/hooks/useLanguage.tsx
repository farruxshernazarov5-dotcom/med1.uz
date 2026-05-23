import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";

export const LANGUAGE_LABELS: Record<SupportedLanguage, { code: string; label: string; flag: string }> = {
  uz: { code: "UZ", label: "O'zbekcha", flag: "🇺🇿" },
  ru: { code: "RU", label: "Русский", flag: "🇷🇺" },
  en: { code: "EN", label: "English", flag: "🇬🇧" },
};

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as SupportedLanguage)
    : "uz";

  const setLanguage = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem("med1-lang", lng);
    } catch {}
  };

  return { lang: current, setLanguage, t, languages: SUPPORTED_LANGUAGES };
}
