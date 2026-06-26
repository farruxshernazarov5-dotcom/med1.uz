type JsonObject = Record<string, unknown>;

export function stripJsonFences(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/^```(?:json|JSON)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function sanitizeJsonText(input: string): string {
  return stripJsonFences(input)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function firstBalancedObject(input: string): string | null {
  const text = sanitizeJsonText(input);
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function repairTruncatedObject(input: string): string | null {
  let text = sanitizeJsonText(input);
  const start = text.indexOf("{");
  if (start < 0) return null;
  text = text.slice(start).replace(/```[\s\S]*$/i, "").trim();

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastStringStart = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      lastStringStart = i;
    } else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if ((ch === "}" || ch === "]") && stack[stack.length - 1] === ch) stack.pop();
  }

  if (inString) {
    const before = text.slice(Math.max(0, lastStringStart - 12));
    if (/[:,\[]\s*"[^"\\]*(?:\\.[^"\\]*)*$/s.test(before)) text += '"';
    else text = text.slice(0, Math.max(0, lastStringStart)).trim();
  }

  text = text
    .replace(/,?\s*"[^"\\]*(?:\\.[^"\\]*)*"\s*:\s*$/s, "")
    .replace(/,?\s*"[^"\\]*(?:\\.[^"\\]*)*"\s*$/s, "")
    .replace(/,\s*$/s, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

  return text + stack.reverse().join("");
}

export function parseAiJsonObject<T extends JsonObject = JsonObject>(content: unknown): T | null {
  if (content && typeof content === "object" && !Array.isArray(content)) return content as T;
  const text = String(content ?? "");
  const candidates = [firstBalancedObject(text), repairTruncatedObject(text), sanitizeJsonText(text)].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(sanitizeJsonText(candidate));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as T;
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : [];
}

function cleanSummary(value: unknown, fallback: string): string {
  const text = stripJsonFences(value);
  if (!text) return fallback;
  const parsed = parseAiJsonObject(text);
  if (parsed?.summary) return String(parsed.summary);
  if (/^\s*\{[\s\S]*"(?:indicators|findings|risks|diseases)"/i.test(text)) return fallback;
  return text;
}

export function normalizeReportAnalysis(raw: unknown) {
  const obj = parseAiJsonObject(raw) ?? {};
  const fromSummary = parseAiJsonObject(obj.summary) ?? {};
  const src = Object.keys(fromSummary).length > 0 ? { ...obj, ...fromSummary } : obj;
  const indicators = Array.isArray(src.indicators) ? src.indicators : [];

  return {
    indicators: indicators.map((item: any) => ({
      name: String(item?.name ?? "Ko'rsatkich"),
      value: String(item?.value ?? "—"),
      normalRange: String(item?.normalRange ?? item?.normal_range ?? "—"),
      unit: item?.unit ? String(item.unit) : "",
      status: ["normal", "high", "low", "critical"].includes(String(item?.status)) ? item.status : "normal",
      interpretation: String(item?.interpretation ?? "Ko'rsatkichni shifokor bilan baholang."),
      possibleCauses: asStringArray(item?.possibleCauses),
      relatedICD10: item?.relatedICD10 ? String(item.relatedICD10) : "",
    })),
    summary: cleanSummary(src.summary, "Analiz tahlili yakunlandi. Natijani shifokor yoki laboratoriya mutaxassisi bilan muhokama qiling."),
    concerns: asStringArray(src.concerns),
    recommendations: asStringArray(src.recommendations).length ? asStringArray(src.recommendations) : ["Natijani shifokor bilan muhokama qiling."],
    urgentAttention: Boolean(src.urgentAttention),
    suggestedSpecialist: String(src.suggestedSpecialist ?? "Terapevt"),
    panelCorrelations: asStringArray(src.panelCorrelations),
    followUpTests: asStringArray(src.followUpTests),
  };
}

export function normalizeRadiologyAnalysis(raw: unknown, scanType = "xray") {
  const obj = parseAiJsonObject(raw) ?? {};
  const nested = parseAiJsonObject((obj.overallAssessment as any)?.summary) ?? parseAiJsonObject(obj.summary) ?? {};
  const src = Object.keys(nested).length > 0 ? { ...obj, ...nested } : obj;
  const assessment = src.overallAssessment && typeof src.overallAssessment === "object" ? (src.overallAssessment as any) : {};

  return {
    imageType: String(src.imageType ?? "other"),
    scanModality: String(src.scanModality ?? scanType),
    imageQuality: ["good", "moderate", "poor"].includes(String(src.imageQuality)) ? String(src.imageQuality) : "moderate",
    anatomicalStructures: Array.isArray(src.anatomicalStructures) ? src.anatomicalStructures.map((item: any) => ({
      name: String(item?.name ?? "Anatomik struktura"),
      status: item?.status === "abnormal" ? "abnormal" : "normal",
      description: String(item?.description ?? "Ko'rib chiqildi."),
    })) : [],
    findings: Array.isArray(src.findings) ? src.findings.map((item: any) => ({
      location: String(item?.location ?? "Ko'rsatilmagan"),
      description: String(item?.description ?? "Topilma tavsifi mavjud emas."),
      severity: ["normal", "mild", "moderate", "severe"].includes(String(item?.severity)) ? item.severity : "normal",
      possibleDiagnoses: Array.isArray(item?.possibleDiagnoses) ? item.possibleDiagnoses.map((d: any) => ({
        name: String(d?.name ?? "Aniqlashtirish kerak"),
        probability: String(d?.probability ?? "past"),
        icd10: String(d?.icd10 ?? ""),
      })) : [],
    })) : [],
    overallAssessment: {
      riskLevel: ["normal", "attention", "critical"].includes(String(assessment.riskLevel)) ? assessment.riskLevel : "attention",
      summary: cleanSummary(assessment.summary ?? src.summary, "Radiologiya tahlili yakunlandi. Natijani radiolog yoki shifokor bilan muhokama qiling."),
      keyFindings: asStringArray(assessment.keyFindings),
    },
    recommendations: asStringArray(src.recommendations).length ? asStringArray(src.recommendations) : ["Radiolog yoki shifokorga murojaat qiling."],
    suggestedSpecialist: String(src.suggestedSpecialist ?? "Radiolog"),
    followUpStudies: asStringArray(src.followUpStudies),
    urgentAttention: Boolean(src.urgentAttention),
    disclaimer: String(src.disclaimer ?? "Bu AI tahlili yakuniy tashxis emas."),
  };
}

function numberInRange(value: unknown, fallback = 50): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function normalizeHealthRiskAnalysis(raw: unknown) {
  const obj = parseAiJsonObject(raw) ?? {};
  const healthIndex = obj.healthIndex && typeof obj.healthIndex === "object" ? obj.healthIndex as any : {};
  const lifestyleBreakdown = obj.lifestyleBreakdown && typeof obj.lifestyleBreakdown === "object" ? obj.lifestyleBreakdown as any : {};
  const bmi = obj.bmi && typeof obj.bmi === "object" ? obj.bmi as any : {};

  return {
    risks: Array.isArray(obj.risks) ? obj.risks.map((raw: any) => ({
      disease: String(raw?.disease ?? "Aniqlashtirish kerak"),
      category: String(raw?.category ?? "metabolic"),
      riskPercent: numberInRange(raw?.riskPercent ?? raw?.riskScore),
      riskLevel: ["high", "medium", "low"].includes(String(raw?.riskLevel)) ? raw.riskLevel : "medium",
      riskScore: numberInRange(raw?.riskScore ?? raw?.riskPercent),
      factors: asStringArray(raw?.factors),
      prevention: asStringArray(raw?.prevention),
      icd10Code: raw?.icd10Code ? String(raw.icd10Code) : "",
      clinicalBasis: raw?.clinicalBasis ? String(raw.clinicalBasis) : "",
      suggestedSpecialist: raw?.suggestedSpecialist ? String(raw.suggestedSpecialist) : "Terapevt",
      timeframe: raw?.timeframe ? String(raw.timeframe) : "",
      modifiable: Boolean(raw?.modifiable),
    })) : [],
    overallHealth: ["good", "moderate", "concerning"].includes(String(obj.overallHealth)) ? obj.overallHealth : "moderate",
    overallRiskScore: numberInRange(obj.overallRiskScore),
    bmi: {
      value: Number.isFinite(Number(bmi.value)) ? Number(bmi.value) : 0,
      category: String(bmi.category ?? "Noma'lum"),
      interpretation: String(bmi.interpretation ?? ""),
    },
    healthIndex: {
      cardiovascular: numberInRange(healthIndex.cardiovascular),
      metabolic: numberInRange(healthIndex.metabolic),
      neurologic: numberInRange(healthIndex.neurologic),
      physical: numberInRange(healthIndex.physical),
      overall: numberInRange(healthIndex.overall),
    },
    recommendations: asStringArray(obj.recommendations).length ? asStringArray(obj.recommendations) : ["Shifokor bilan profilaktik ko'rikdan o'ting."],
    lifestyleScore: numberInRange(obj.lifestyleScore),
    lifestyleBreakdown: {
      nutrition: numberInRange(lifestyleBreakdown.nutrition),
      exercise: numberInRange(lifestyleBreakdown.exercise),
      sleep: numberInRange(lifestyleBreakdown.sleep),
      stress: numberInRange(lifestyleBreakdown.stress),
      habits: numberInRange(lifestyleBreakdown.habits),
    },
    suggestedCheckups: asStringArray(obj.suggestedCheckups),
    riskFactorAnalysis: cleanSummary(obj.riskFactorAnalysis, "Xavf omillari baholandi. Natijani shifokor bilan muhokama qiling."),
    preventiveScreening: Array.isArray(obj.preventiveScreening) ? obj.preventiveScreening.map((raw: any) => ({
      test: String(raw?.test ?? "Profilaktik tekshiruv"),
      frequency: String(raw?.frequency ?? "Shifokor tavsiyasiga ko'ra"),
      reason: String(raw?.reason ?? "Xavfni aniqlashtirish uchun"),
      priority: raw?.priority ? String(raw.priority) : "medium",
    })) : [],
    dietaryAdvice: asStringArray(obj.dietaryAdvice),
    exerciseAdvice: asStringArray(obj.exerciseAdvice),
    warningSignsToWatch: asStringArray(obj.warningSignsToWatch),
  };
}

export function normalizeSymptomAnalysis(raw: unknown) {
  const obj = parseAiJsonObject(raw) ?? {};
  return {
    diseases: Array.isArray(obj.diseases) ? obj.diseases.map((raw: any) => ({
      name: String(raw?.name ?? "Aniqlashtirish kerak"),
      probability: numberInRange(raw?.probability, 0),
      description: cleanSummary(raw?.description, "Simptom shifokor tomonidan baholanishi kerak."),
      matchingSymptoms: asStringArray(raw?.matchingSymptoms),
      nonMatchingSymptoms: asStringArray(raw?.nonMatchingSymptoms),
      riskLevel: ["high", "medium", "low"].includes(String(raw?.riskLevel)) ? raw.riskLevel : "low",
      specialist: String(raw?.specialist ?? "Terapevt"),
      icd10Code: raw?.icd10Code ? String(raw.icd10Code) : "",
      icd11Code: raw?.icd11Code ? String(raw.icd11Code) : "",
      snomedCode: raw?.snomedCode ? String(raw.snomedCode) : "",
      differentialNotes: raw?.differentialNotes ? String(raw.differentialNotes) : "",
      suggestedTests: asStringArray(raw?.suggestedTests),
      clinicalEvidence: raw?.clinicalEvidence ? String(raw.clinicalEvidence) : "",
    })) : [],
    riskLevel: ["high", "medium", "low"].includes(String(obj.riskLevel)) ? obj.riskLevel : "low",
    recommendations: asStringArray(obj.recommendations).length ? asStringArray(obj.recommendations) : ["Shifokorga murojaat qiling."],
    urgentAction: Boolean(obj.urgentAction),
    followUpQuestions: asStringArray(obj.followUpQuestions),
    differentialDiagnosis: obj.differentialDiagnosis,
    suggestedLabTests: Array.isArray(obj.suggestedLabTests) ? obj.suggestedLabTests : [],
    suggestedImaging: Array.isArray(obj.suggestedImaging) ? obj.suggestedImaging : [],
    medicalReferences: Array.isArray(obj.medicalReferences) ? obj.medicalReferences : [],
  };
}