// Heuristic formatter for legacy/seed knowledge articles that are stored
// as one giant blob without newlines. Splits content into paragraphs and
// detects common medical section headings (UZ + EN).

const SECTION_HEADINGS_UZ = [
  "Sabablari", "Sabablar", "Belgilari", "Simptomlari", "Simptomlar",
  "Ko'rik va Tekshiruvlar", "Korik va Tekshiruvlar", "Tekshiruvlar",
  "Tashxis", "Tashxislash", "Diagnostika",
  "Davolash", "Davolanish", "Davolash usullari",
  "Profilaktika", "Oldini olish",
  "Asoratlar", "Asorati",
  "Prognoz", "Prognoz (Natija)", "Natija",
  "Tibbiy Mutaxassisga Qachon Murojaat Qilish Kerak",
  "Qachon shifokorga murojaat qilish kerak",
  "Muqobil Nomlar", "Boshqa nomlari",
  "Rasmlar", "Suratlar",
  "Ma'lumotnomalar", "Manbalar", "Adabiyotlar",
  "Bog'liq mavzular", "Aloqador mavzular",
  "Patogenez", "Etiologiya", "Klinik manzara",
  "Laboratoriya tekshiruvlari", "Laboratoriya testlari",
  "Diferensial diagnostika",
];

const SECTION_HEADINGS_EN = [
  "Causes", "Symptoms", "Signs and Symptoms",
  "Exams and Tests", "Tests", "Diagnosis",
  "Treatment", "Management",
  "Prevention", "Outlook", "Prognosis",
  "Possible Complications", "Complications",
  "When to Contact a Medical Professional", "When to see a doctor",
  "Alternative Names", "References", "Related Topics",
  "Patient Information", "Pathophysiology", "Epidemiology",
];

const ALL_HEADINGS = [...SECTION_HEADINGS_UZ, ...SECTION_HEADINGS_EN]
  .sort((a, b) => b.length - a.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * If content already contains line breaks, return as-is.
 * Otherwise: split into headed sections + paragraph chunks of ~3 sentences.
 */
export function formatArticleContent(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // Strip leading "Matn:" / "Text:"
  text = text.replace(/^\s*(Matn|Text|Маtn)\s*:\s*/i, "");

  // If already multi-paragraph, just return
  if (text.includes("\n\n") || (text.match(/\n/g) || []).length > 5) {
    return text;
  }

  // Insert markdown headings before known section names
  // Match: " Heading " (preceded by sentence boundary or start, followed by capital letter / space)
  const headingPattern = new RegExp(
    `(^|[\\.\\?!]\\s+)(${ALL_HEADINGS.map(escapeRe).join("|")})(\\s+)(?=[A-ZА-ЯЁЎҚҒҲ"'(])`,
    "g"
  );
  text = text.replace(headingPattern, (_m, pre, heading, post) => {
    return `${pre}\n\n## ${heading}\n\n`;
  });

  // Split into blocks by the headings we just inserted
  const blocks = text.split(/\n\n/).map(b => b.trim()).filter(Boolean);

  const out: string[] = [];
  for (const block of blocks) {
    if (block.startsWith("## ")) {
      out.push(block);
      continue;
    }
    // Split into sentences and chunk by ~3 sentences per paragraph
    const sentences = block.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [block];
    const cleaned = sentences.map(s => s.trim()).filter(Boolean);
    const CHUNK = 3;
    for (let i = 0; i < cleaned.length; i += CHUNK) {
      out.push(cleaned.slice(i, i + CHUNK).join(" "));
    }
  }

  return out.join("\n\n");
}
