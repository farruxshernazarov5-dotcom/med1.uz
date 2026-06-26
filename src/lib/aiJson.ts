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