import { HMS_SAAS_UZ, HMS_SAAS_RU, HMS_SAAS_EN } from "./hmsSaas";
import { DIAGNOSTICS_PARTNERSHIP_UZ } from "./diagnosticsPartnership";

export interface OfficialContractDoc {
  title_uz: string;
  title_ru?: string;
  title_en?: string;
  body_uz: string;
  body_ru?: string;
  body_en?: string;
  /** Rasmiy PDF hujjat (agar mavjud bo'lsa) */
  version: string;
}

/** Slug (contract_templates.slug) -> rasmiy hujjat matni */
export const OFFICIAL_CONTRACTS: Record<string, OfficialContractDoc> = {
  "clinic-hms-agreement": {
    title_uz: "MED1 HMS SaaS foydalanish shartlari",
    title_ru: "Условия использования MED1 HMS SaaS",
    title_en: "MED1 HMS SaaS Terms of Use",
    body_uz: HMS_SAAS_UZ,
    body_ru: HMS_SAAS_RU,
    body_en: HMS_SAAS_EN,
    version: "2.1",
  },
  "saas-subscription-agreement": {
    title_uz: "MED1 HMS SaaS foydalanish shartlari",
    title_ru: "Условия использования MED1 HMS SaaS",
    title_en: "MED1 HMS SaaS Terms of Use",
    body_uz: HMS_SAAS_UZ,
    body_ru: HMS_SAAS_RU,
    body_en: HMS_SAAS_EN,
    version: "2.1",
  },
  "dental-hms-agreement": {
    title_uz: "MED1 HMS SaaS foydalanish shartlari (stomatologiya)",
    body_uz: HMS_SAAS_UZ,
    body_ru: HMS_SAAS_RU,
    body_en: HMS_SAAS_EN,
    version: "2.1",
  },
  "maternity-hms-agreement": {
    title_uz: "MED1 HMS SaaS foydalanish shartlari (tug'ruqxona)",
    body_uz: HMS_SAAS_UZ,
    body_ru: HMS_SAAS_RU,
    body_en: HMS_SAAS_EN,
    version: "2.1",
  },
  "diagnostics-lis-agreement": {
    title_uz: "Diagnostika hamkorlik shartnomasi",
    body_uz: DIAGNOSTICS_PARTNERSHIP_UZ,
    version: "1.0",
  },
};

export function officialContractFor(slug: string): OfficialContractDoc | null {
  return OFFICIAL_CONTRACTS[slug] || null;
}
