import type { SupportedLanguage } from "@/i18n/config";

import privacyUz from "@/data/legal/privacy-uz.md?raw";
import privacyRu from "@/data/legal/privacy-ru.md?raw";
import privacyEn from "@/data/legal/privacy-en.md?raw";
import termsUz from "@/data/legal/terms-uz.md?raw";
import termsRu from "@/data/legal/terms-ru.md?raw";
import termsEn from "@/data/legal/terms-en.md?raw";
import partnerUz from "@/data/legal/partner-uz.md?raw";
import partnerRu from "@/data/legal/partner-ru.md?raw";
import partnerEn from "@/data/legal/partner-en.md?raw";

import privacyPdfUz from "@/assets/legal/privacy-uz.pdf.asset.json";
import privacyPdfRu from "@/assets/legal/privacy-ru.pdf.asset.json";
import privacyPdfEn from "@/assets/legal/privacy-en.pdf.asset.json";
import termsPdfUz from "@/assets/legal/terms-uz.pdf.asset.json";
import termsPdfRu from "@/assets/legal/terms-ru.pdf.asset.json";
import termsPdfEn from "@/assets/legal/terms-en.pdf.asset.json";
import partnerPdfUz from "@/assets/legal/partner-uz.pdf.asset.json";
import partnerPdfRu from "@/assets/legal/partner-ru.pdf.asset.json";
import partnerPdfEn from "@/assets/legal/partner-en.pdf.asset.json";

export type LegalDocId = "privacy" | "terms" | "partner";

export interface LegalDocVersion {
  title: string;
  subtitle: string;
  edition: string;
  source: string;
  pdfUrl: string;
  pdfName: string;
}

type Registry = Record<LegalDocId, Record<SupportedLanguage, LegalDocVersion>>;

export const LEGAL_DOCS: Registry = {
  privacy: {
    uz: {
      title: "Maxfiylik siyosati",
      subtitle: "Shaxsiy ma'lumotlarni qayta ishlash siyosati · MED1.UZ raqamli tibbiyot platformasi",
      edition: "Tahrir 2.1 · 2026",
      source: privacyUz,
      pdfUrl: privacyPdfUz.url,
      pdfName: "MED1UZ-Maxfiylik-siyosati-UZ.pdf",
    },
    ru: {
      title: "Политика конфиденциальности",
      subtitle: "Политика обработки персональных данных · Цифровая медицинская платформа MED1.UZ",
      edition: "Редакция 2.1 · 2026",
      source: privacyRu,
      pdfUrl: privacyPdfRu.url,
      pdfName: "MED1UZ-Maxfiylik-siyosati-RU.pdf",
    },
    en: {
      title: "Privacy Policy",
      subtitle: "Personal data processing policy · MED1.UZ digital healthcare platform",
      edition: "Version 2.1 · 2026",
      source: privacyEn,
      pdfUrl: privacyPdfEn.url,
      pdfName: "MED1UZ-Privacy-Policy-EN.pdf",
    },
  },
  terms: {
    uz: {
      title: "Foydalanuvchi shartnomasi",
      subtitle: "Ommaviy oferta (qo'shilish shartnomasi) · MED1.UZ raqamli tibbiyot ekotizimi",
      edition: "Tahrir 2.1 · 2026",
      source: termsUz,
      pdfUrl: termsPdfUz.url,
      pdfName: "MED1UZ-Foydalanuvchi-shartnomasi-UZ.pdf",
    },
    ru: {
      title: "Пользовательское соглашение",
      subtitle: "Публичная оферта (договор присоединения) · Экосистема MED1.UZ",
      edition: "Редакция 2.1 · 2026",
      source: termsRu,
      pdfUrl: termsPdfRu.url,
      pdfName: "MED1UZ-Polzovatelskoe-soglashenie-RU.pdf",
    },
    en: {
      title: "User Agreement",
      subtitle: "Public offer (accession agreement) · MED1.UZ digital healthcare ecosystem",
      edition: "Version 2.1 · 2026",
      source: termsEn,
      pdfUrl: termsPdfEn.url,
      pdfName: "MED1UZ-User-Agreement-EN.pdf",
    },
  },
  partner: {
    uz: {
      title: "Hamkorlik shartnomasi",
      subtitle: "MED1.UZ ekotizimi hamkorlari uchun ramkaviy shartnoma (ommaviy oferta)",
      edition: "Tahrir 2.1 · 2026",
      source: partnerUz,
      pdfUrl: partnerPdfUz.url,
      pdfName: "MED1UZ-Hamkorlik-shartnomasi-UZ.pdf",
    },
    ru: {
      title: "Договор о партнёрстве",
      subtitle: "Рамочный договор (публичная оферта) для партнёров экосистемы MED1.UZ",
      edition: "Редакция 2.1 · 2026",
      source: partnerRu,
      pdfUrl: partnerPdfRu.url,
      pdfName: "MED1UZ-Dogovor-o-partnerstve-RU.pdf",
    },
    en: {
      title: "Partnership Agreement",
      subtitle: "Framework agreement (public offer) for MED1.UZ ecosystem partners",
      edition: "Version 2.1 · 2026",
      source: partnerEn,
      pdfUrl: partnerPdfEn.url,
      pdfName: "MED1UZ-Partnership-Agreement-EN.pdf",
    },
  },
};

export const getLegalDoc = (id: LegalDocId, lang: SupportedLanguage): LegalDocVersion =>
  LEGAL_DOCS[id][lang] ?? LEGAL_DOCS[id].uz;
