import { normalizeRadiologyAnalysis, parseAiJsonObject } from "./aiJson";

const cell = (value: string) => value.replace(/\|/g, "/").replace(/\n/g, " ");
const table = (head: string[], rows: string[][]) => [head.map(cell).join(" | "), head.map(() => "---").join(" | "), ...rows.map(row => row.map(cell).join(" | "))].map(row => `| ${row} |`).join("\n");

/** Only actual structured radiology results become tables; prose stays prose. */
export function radiologyReportMarkdown(raw: unknown): string | null {
  const parsed = parseAiJsonObject(raw);
  if (!parsed || !("findings" in parsed || "anatomicalStructures" in parsed || "overallAssessment" in parsed)) return null;
  const a = normalizeRadiologyAnalysis(parsed);
  const severity: Record<string, string> = { normal: "Me'yorda", mild: "Yengil", moderate: "O'rtacha", severe: "Jiddiy" };
  const diagnoses = a.findings.flatMap(f => f.possibleDiagnoses.map(d => [f.location, d.name, `${d.probability} / ${d.icd10 || "ko'rsatilmagan"}`]));
  return [
    "## Umumiy xulosa", a.overallAssessment.summary,
    "## Tekshiruv va tasvir sifati", table(["Tekshiruv", "Tasvir", "Sifat"], [[a.scanModality.toUpperCase(), a.imageType, a.imageQuality]]),
    ...(a.anatomicalStructures.length ? ["## Anatomik strukturalar", table(["Struktura", "Holat", "Tavsif"], a.anatomicalStructures.map(s => [s.name, s.status === "abnormal" ? "O'zgarish" : "Me'yorda", s.description]))] : []),
    ...(a.findings.length ? ["## Topilmalar", table(["Joylashuv", "Tavsif", "Daraja"], a.findings.map(f => [f.location, f.description, severity[f.severity]]))] : []),
    ...(diagnoses.length ? ["## Ehtimoliy sabablar", table(["Topilma", "Ehtimoliy sabab", "Ehtimol / ICD-10"], diagnoses)] : []),
    "## Tavsiyalar", ...a.recommendations.map(r => `- ${r}`),
    ...(a.followUpStudies.length ? ["## Keyingi tekshiruvlar", ...a.followUpStudies.map(r => `- ${r}`)] : []),
    "## Tavsiya etilgan mutaxassis", a.suggestedSpecialist,
    "## Cheklovlar", a.disclaimer,
  ].join("\n\n");
}

export function radiologyClinicalContext(clinicalInfo: string, scanType: string): string {
  return `${clinicalInfo}\n\nTasvir bo'yicha ikkinchi fikr: faqat ko'rinadigan belgilarni tasvirlang. Xira foto, artefakt yoki to'liq bo'lmagan kesimlarda aniqlab bo'lmaydigan joylarni ochiq ayting, kasallik yoki o'lchamni o'ylab topmang. Foto to'liq DICOM seriyasi emas. ${scanType === "mri" ? "MRT: faqat ko'rinadigan T1/T2/FLAIR/DWI ketma-ketliklarini baholang; mavjud bo'lmagan ketma-ketlikdan xulosa qilmang." : scanType === "ct" ? "KT: kontrast fazasi, kesim va oynani faqat ko'rinsa ko'rsating; bitta kesimdan to'liq tekshiruv xulosasi chiqarmang." : "Rentgen: proyeksiya, tomon, ekspozitsiya va rotatsiyani baholang; suratdagi artefaktni patologiyadan ajrating."} Zarur qayta tasvir, keyingi tekshiruv va mos mutaxassisni ayting; yakuniy tashxis qo'ymang.`;
}