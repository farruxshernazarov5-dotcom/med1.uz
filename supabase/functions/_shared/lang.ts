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

export function detectLangFromText(input: unknown): SupportedLang | null {
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

export function resolveResponseLang(messages: unknown, fallback?: unknown): SupportedLang {
  if (Array.isArray(messages)) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as any;
      if (msg?.role === "user") {
        const detected = detectLangFromText(msg.content);
        if (detected) return detected;
      }
    }
  }
  return normalizeLang(fallback);
}

const COMMON_RULES = `
=== RESPONSE STYLE (HARD RULES) ===
1) LANGUAGE MIRROR: Detect the language of the user's LAST message and reply ONLY in that language. Ignore the UI default if the user wrote in another language. Supported: o'zbek, русский, English, qoraqalpoq, тоҷикӣ, türkçe, qozoq.
   CRITICAL: If TARGET_REPLY_LANGUAGE is Russian / русский, EVERY heading, bullet, disclaimer and sentence MUST be Russian. Do not output Uzbek words like "bosh", "og'riq", "aniq", "shifokor", "murojaat", "tavsiya" unless quoted from the user. If any template below is Uzbek, translate it before answering.
   CRITICAL: If TARGET_REPLY_LANGUAGE is English, EVERY heading, bullet, disclaimer and sentence MUST be English. If any template below is Uzbek/Russian, translate it before answering.
   CRITICAL: Uzbek is allowed ONLY when TARGET_REPLY_LANGUAGE is Uzbek / o'zbek or the user's last message is Uzbek.
2) NO PREAMBLE: Never start with greetings, self-introductions or filler like "Assalomu alaykum", "Men Med1.uz yordamchisiman", "Здравствуйте, я ассистент", "Hello, I am an assistant", "Savolingizga javob beraman". Start DIRECTLY with the answer.
3) COMPLETE BUT BOUNDED: Keep the full answer within ~150–280 tokens. Prefer 2–4 short bullets + 1 closing line. If space is tight, drop bullets — NEVER leave a sentence unfinished. The last sentence MUST end with proper punctuation.
4) NO REPETITION: Do not repeat the user's question. Do not restate the same point twice.
5) Keep ICD-10 / Latin / drug names in their standard form regardless of reply language.
`;

const TARGET_LANGUAGE_GUARD: Record<SupportedLang, string> = {
  uz: `YAKUNIY TIL NAZORATI: Javob faqat o'zbek tilida bo'lsin. Ruscha yoki inglizcha sarlavha/shablonlarni o'zbekchaga tarjima qil.`,
  ru: `ФИНАЛЬНЫЙ КОНТРОЛЬ ЯЗЫКА: отвечай строго на русском языке. Все узбекские шаблоны, заголовки, предупреждения и пункты переведи на русский до отправки. Не отвечай на узбекском, если последний вопрос пользователя написан на русском.`,
  en: `FINAL LANGUAGE CHECK: answer strictly in English. Translate all Uzbek/Russian templates, headings, disclaimers and bullets into English before sending. Do not answer in Uzbek unless the user's last message is Uzbek.`,
};

const DISCLAIMER: Record<SupportedLang, string> = {
  uz: `⚠️ AI tavsiyasi — aniq tashxis uchun shifokorga murojaat qiling.`,
  ru: `⚠️ Рекомендация ИИ — для точного диагноза обратитесь к врачу.`,
  en: `⚠️ AI guidance — consult a doctor for a definitive diagnosis.`,
};

const SOURCES_LABEL: Record<SupportedLang, string> = {
  uz: "Manbalar",
  ru: "Источники",
  en: "Sources",
};

/**
 * Evidence-based sourcing rules — appended to EVERY AI service prompt so that
 * answers are grounded in recognised medical literature/guidelines instead of
 * free-form model text.
 */
export function evidenceInstruction(lang: SupportedLang): string {
  return `
=== EVIDENCE / SCIENTIFIC SOURCING (MANDATORY) ===
A) Ground every clinical claim in recognised evidence: WHO, ICD-10/ICD-11, PubMed/Cochrane systematic reviews, NICE / ESC / ADA / AHA / NCCN / Fleischner / BI-RADS / Lung-RADS / LI-RADS guidelines, UpToDate, MedlinePlus, CDC, EMA/FDA drug labels.
B) After the answer add a compact section titled "${SOURCES_LABEL[lang]}:" with 1–3 concrete references. Each reference: organisation/guideline name + year (and PMID or guideline code when you are certain of it). Example format: "WHO, Hypertension guideline (2023)", "PubMed PMID: 34567890", "ADA Standards of Care (2024)".
C) NEVER invent a PMID, DOI, URL or study title. If you are not certain of an identifier, cite only the organisation/guideline name and year.
D) When evidence is weak, conflicting or absent, say so explicitly in one short clause instead of guessing.
E) The sources section is short (max 3 lines) and must not push the answer over the token budget — shorten the body instead of dropping the sources.`;
}


export function languageInstruction(lang: SupportedLang): string {
  const langName = lang === "ru" ? "Russian / русский" : lang === "en" ? "English" : "Uzbek / o'zbek";
  return `\n\n${COMMON_RULES}\n${evidenceInstruction(lang)}\nTARGET_REPLY_LANGUAGE: ${langName}. This is mandatory and overrides ALL earlier prompts. If any previous instruction, template, disclaimer, section title or context is in another language, translate it and answer only in ${langName}.\n${TARGET_LANGUAGE_GUARD[lang]}\nEnd with the "${SOURCES_LABEL[lang]}:" section, then one short disclaimer line in the SAME language as your reply. Example (only if reply is in that language) — ${DISCLAIMER[lang]}`;
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
  const langName = lang === "ru" ? "Russian / русский" : lang === "en" ? "English" : "Uzbek / o'zbek";
  return `\n\n${DETAILED_RULES}\n${evidenceInstruction(lang)}\nFor structured JSON output put the references into a "sources" array of short strings (e.g. ["WHO ICD-11 (2024)", "PubMed PMID: 33333333"]) — add the field even if the schema above does not mention it.\nTARGET_REPLY_LANGUAGE: ${langName}. This is mandatory and overrides ALL earlier prompts. Translate all templates, labels and disclaimers to ${langName}; do not output Uzbek unless the user's last message is Uzbek.\n${TARGET_LANGUAGE_GUARD[lang]}\nInclude a brief disclaimer string in the appropriate field (e.g. "disclaimer") in the SAME language as the rest of the JSON. Example — ${DISCLAIMER[lang]}`;
}

