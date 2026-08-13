import doc01 from "@/data/partner-docs/01-onboarding.md?raw";
import doc02 from "@/data/partner-docs/02-authentication.md?raw";
import doc03 from "@/data/partner-docs/03-endpoints.md?raw";
import doc04 from "@/data/partner-docs/04-webhooks.md?raw";
import doc05 from "@/data/partner-docs/05-errors-limits.md?raw";
import doc06 from "@/data/partner-docs/06-sandbox-testing.md?raw";
import doc07 from "@/data/partner-docs/07-security-compliance.md?raw";
import doc08 from "@/data/partner-docs/08-legal-requirements.md?raw";
import doc09 from "@/data/partner-docs/09-sla-support.md?raw";
import doc10 from "@/data/partner-docs/10-golive-checklist.md?raw";

export interface PartnerDocSection {
  id: string;
  title: string;
  summary: string;
  source: string;
}

export const PARTNER_DOCS: PartnerDocSection[] = [
  { id: "onboarding", title: "1. Boshlash va Onboarding", summary: "Base URL, kanallar, 8 bosqichli onboarding, birinchi so'rov, SDK'lar", source: doc01 },
  { id: "authentication", title: "2. Autentifikatsiya", summary: "API kalitlar, JWT, HMAC-SHA256, domen/IP whitelist, scope'lar", source: doc02 },
  { id: "endpoints", title: "3. Endpoint spravochnigi", summary: "Tizim, auth, katalog, qabullar, EMR, 25+ AI xizmat, to'lov, pagination", source: doc03 },
  { id: "webhooks", title: "4. Webhook'lar", summary: "Hodisalar ro'yxati, payload, imzo tekshiruvi, retry va idempotentlik", source: doc04 },
  { id: "errors", title: "5. Xatolar va limitlar", summary: "Xato kodlari, rate limit, idempotentlik, timeout va retry siyosati", source: doc05 },
  { id: "sandbox", title: "6. Sandbox va testlash", summary: "Mock ma'lumot, test rekvizitlari, Postman, 10 ta majburiy ssenariy", source: doc06 },
  { id: "security", title: "7. Xavfsizlik va ma'lumot himoyasi", summary: "TLS, kalit saqlash, PHI, saqlash muddatlari, incident response", source: doc07 },
  { id: "legal", title: "8. Yuridik hujjatlar", summary: "Talab qilinadigan hujjatlar, imzolanadigan shartnomalar, e-imzo", source: doc08 },
  { id: "sla", title: "9. SLA va qo'llab-quvvatlash", summary: "Uptime, P1–P4 darajalar, versiyalash, changelog, monitoring", source: doc09 },
  { id: "golive", title: "10. Go-Live checklist", summary: "Yuridik, texnik, UX va monitoring bo'yicha yakuniy nazorat ro'yxati", source: doc10 },
];

export const getPartnerDoc = (id: string) =>
  PARTNER_DOCS.find((d) => d.id === id) ?? PARTNER_DOCS[0];
