// Shared language + style helper for AI edge functions.
// - Mirrors the user's input language (not just UI lang) so that whatever
//   language the user writes in, the assistant replies in the same language.
// - Strips greetings / preambles ("Assalomu alaykum, men Med1.uz...") so
//   tokens are spent on the answer itself.
// - Forces a complete but bounded answer (~150–280 tokens) so responses are
//   never cut mid-sentence even when streaming hits the token cap.

export type SupportedLang = "uz" | "ru" | "en";

export function normalizeLang(input: unknown): SupportedLang {
  const v = typeof input === "string" ? input.toLowerCase().slice(0, 2) : "";
  if (v === "ru") return "ru";
  if (v === "en") return "en";
  return "uz";
}

const COMMON_RULES = `
=== RESPONSE STYLE (HARD RULES) ===
1) LANGUAGE MIRROR: Detect the language of the user's LAST message and reply ONLY in that language. Ignore the UI default if the user wrote in another language. Supported: o'zbek, русский, English, qoraqalpoq, тоҷикӣ, türkçe, qozoq.
2) NO PREAMBLE: Never start with greetings, self-introductions or filler like "Assalomu alaykum", "Men Med1.uz yordamchisiman", "Здравствуйте, я ассистент", "Hello, I am an assistant", "Savolingizga javob beraman". Start DIRECTLY with the answer.
3) COMPLETE BUT BOUNDED: Keep the full answer within ~150–280 tokens. Prefer 2–4 short bullets + 1 closing line. If space is tight, drop bullets — NEVER leave a sentence unfinished. The last sentence MUST end with proper punctuation.
4) NO REPETITION: Do not repeat the user's question. Do not restate the same point twice.
5) Keep ICD-10 / Latin / drug names in their standard form regardless of reply language.
`;

const DISCLAIMER: Record<SupportedLang, string> = {
  uz: `⚠️ AI tavsiyasi — aniq tashxis uchun shifokorga murojaat qiling.`,
  ru: `⚠️ Рекомендация ИИ — для точного диагноза обратитесь к врачу.`,
  en: `⚠️ AI guidance — consult a doctor for a definitive diagnosis.`,
};

export function languageInstruction(lang: SupportedLang): string {
  return `\n\n${COMMON_RULES}\nEnd with one short disclaimer line in the SAME language as your reply. Example (only if reply is in that language) — ${DISCLAIMER[lang]}`;
}

// Detailed variant for structured JSON analyses (radiology, lab reports,
// health-risk, symptom checker, etc.). KEEPS language mirroring and "no
// greeting preamble" rules, but REMOVES the 150–280 token cap and the
// "2–4 short bullets" guidance — those would force the model to emit an
// almost empty JSON for rich clinical analyses.
const DETAILED_RULES = `
=== RESPONSE STYLE (STRUCTURED ANALYSIS) ===
1) LANGUAGE MIRROR: Detect the language of the user's LAST message / clinical context and write ALL string fields of the JSON in that language. Supported: o'zbek, русский, English, qoraqalpoq, тоҷикӣ, türkçe, qozoq.
2) NO PREAMBLE: Do NOT add greetings, self-introductions or filler text. Return ONLY the JSON object requested by the system prompt — no markdown fences, no commentary before or after.
3) BE THOROUGH: Fill every relevant field with concrete, clinically useful detail. Do NOT collapse the analysis into a single generic "consult a doctor" line. Include all findings, indicators, anatomical structures, possible diagnoses and recommendations you can reasonably derive.
4) COMPLETE JSON: Make sure the JSON object is syntactically complete — every bracket and quote closed. Prefer slightly shorter sentences inside fields rather than truncating the structure.
5) Keep ICD-10 codes, Latin anatomical / drug names in their standard form regardless of reply language.
`;

export function languageInstructionDetailed(lang: SupportedLang): string {
  return `\n\n${DETAILED_RULES}\nInclude a brief disclaimer string in the appropriate field (e.g. "disclaimer") in the SAME language as the rest of the JSON. Example — ${DISCLAIMER[lang]}`;
}
