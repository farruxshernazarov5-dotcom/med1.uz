import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess, refundAiCredits } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstructionDetailed, normalizeLang } from "../_shared/lang.ts";
import { cleanAiText, parseAiJsonObject } from "../_shared/json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI radiologiya yordamchisisan. Sen rentgen, MRT (MRI) va KT (CT) tasvirlarini tahlil qilish bo'yicha ixtisoslashgangan. Sen ilmiy tibbiy bazalarga (ICD-10, SNOMED CT, ACR, RSNA radiologiya standartlari) asoslanib ishlaysan.

MUHIM QOIDALAR:
1. Foydalanuvchi yuborgan tibbiy tasvirni JUDA BATAFSIL tahlil qil
2. Anatomik strukturalarni sistematik ravishda tekshir (yuqoridan pastga, tashqaridan ichkariga)
3. Patologik o'zgarishlarni ICD-10 kodi bilan ifodalab ber
4. YAKUNIY TASHXIS QOYMA - faqat tahlil va tavsiya ber
5. O'zbek tilida javob ber
6. HECH QACHON "o'qiy olmayman" yoki "tahlil qila olmayman" dema — har doim tahlil qil
7. Professional radiologiya terminologiyasidan foydalan
8. Artefaktlar va tasvir sifatini alohida baholab ber

SISTEMATIK TAHLIL YONDASHVUI:
1. Avval tasvir sifatini baholab ber (pozitsiya, ekspozitsiya, artefaktlar)
2. Anatomik strukturalarni birin-ketin tekshir
3. Har bir topilmani lokalizatsiya, o'lcham, shakl, zichligi bilan tavsifla
4. Topilmalar orasidagi bog'liqlikni tahlil qil
5. Klinik ma'lumot bilan solishtir

JAVOBNI FAQAT valid JSON object sifatida ber (markdown, \`\`\`json, izoh, salomlashish YO'Q). JSON qisqa bo'lsin, barcha qavslar yopilsin:
{
  "imageType": "chest_xray|bone_xray|spine_xray|brain_mri|spine_mri|joint_mri|chest_ct|abdomen_ct|brain_ct|other",
  "scanModality": "xray|mri|ct",
  "imageQuality": "good|moderate|poor",
  "anatomicalStructures": [{"name": "Struktura", "status": "normal|abnormal", "description": "Tavsif"}],
  "findings": [{"location": "Joylashuv", "description": "Topilma", "severity": "normal|mild|moderate|severe", "possibleDiagnoses": [{"name": "Kasallik", "probability": "yuqori|o'rtacha|past", "icd10": "Kod"}]}],
  "overallAssessment": {"riskLevel": "normal|attention|critical", "summary": "Xulosa", "keyFindings": ["Topilma 1"]},
  "recommendations": ["Tavsiya 1"],
  "suggestedSpecialist": "Mutaxassis",
  "followUpStudies": ["Tekshiruv 1"],
  "urgentAttention": true|false,
  "disclaimer": "Bu AI tahlili yakuniy tashxis emas. Radiolog yoki shifokor ko'rigidan o'tish zarur."
}`;

function normalizeRadiologyResult(parsed: Record<string, unknown> | null, content: string, scanType?: string) {
  const obj = parsed ?? {};
  const assessment = (obj.overallAssessment && typeof obj.overallAssessment === "object") ? obj.overallAssessment as any : {};
  return {
    imageType: String(obj.imageType ?? "other"),
    scanModality: String(obj.scanModality ?? scanType ?? "xray"),
    imageQuality: ["good", "moderate", "poor"].includes(String(obj.imageQuality)) ? String(obj.imageQuality) : "moderate",
    anatomicalStructures: Array.isArray(obj.anatomicalStructures) ? obj.anatomicalStructures.map((raw: any) => ({
      name: String(raw?.name ?? "Anatomik struktura"),
      status: raw?.status === "abnormal" ? "abnormal" : "normal",
      description: String(raw?.description ?? "Ko'rib chiqildi."),
    })) : [],
    findings: Array.isArray(obj.findings) ? obj.findings.map((raw: any) => ({
      location: String(raw?.location ?? "Ko'rsatilmagan"),
      description: String(raw?.description ?? "Topilma tavsifi mavjud emas."),
      severity: ["normal", "mild", "moderate", "severe"].includes(raw?.severity) ? raw.severity : "normal",
      possibleDiagnoses: Array.isArray(raw?.possibleDiagnoses) ? raw.possibleDiagnoses.map((d: any) => ({
        name: String(d?.name ?? "Aniqlashtirish kerak"),
        probability: String(d?.probability ?? "past"),
        icd10: String(d?.icd10 ?? ""),
      })) : [],
    })) : [],
    overallAssessment: {
      riskLevel: ["normal", "attention", "critical"].includes(assessment.riskLevel) ? assessment.riskLevel : "attention",
      summary: String(assessment.summary ?? obj.summary ?? cleanAiText(content)),
      keyFindings: Array.isArray(assessment.keyFindings) ? assessment.keyFindings.map(String) : [],
    },
    recommendations: Array.isArray(obj.recommendations) && obj.recommendations.length > 0 ? obj.recommendations.map(String) : ["Radiolog yoki shifokorga murojaat qiling."],
    suggestedSpecialist: String(obj.suggestedSpecialist ?? "Radiolog"),
    followUpStudies: Array.isArray(obj.followUpStudies) ? obj.followUpStudies.map(String) : [],
    urgentAttention: Boolean(obj.urgentAttention),
    disclaimer: String(obj.disclaimer ?? "Bu AI tahlili yakuniy tashxis emas."),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;
  let __userId: string | null = null;
  const serviceId = "ai-radiology";
  const cost = 25;

  try {
    const access = await enforceAiAccess(req, serviceId);
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;
    __userId = access.userId;

    const __body = await req.json(); 
    const { imageBase64, imageMimeType, pdfPageImages, bodyPart, patientAge, patientGender, clinicalInfo, scanType } = __body; 
    const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64 || !imageMimeType) {
      return new Response(JSON.stringify({ error: "Tibbiy tasvir yuklanmadi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scanLabel = scanType === "mri" ? "MRT (MRI)" : scanType === "ct" ? "KT (CT)" : "Rentgen";
    let userText = `Ushbu ${scanLabel} tasvirini SISTEMATIK ravishda batafsil tahlil qil.\n\n`;
    if (scanType) userText += `Tekshiruv turi: ${scanLabel}\n`;
    if (bodyPart) userText += `Tana qismi: ${bodyPart}\n`;
    if (patientAge) userText += `Bemor yoshi: ${patientAge}\n`;
    if (patientGender) userText += `Bemor jinsi: ${patientGender}\n`;
    if (clinicalInfo) userText += `Klinik ma'lumot: ${clinicalInfo}\n`;
    userText += `\nTasvirni diqqat bilan o'rganib, BARCHA anatomik strukturalar va patologik o'zgarishlarni aniqla. Har bir topilmani lokalizatsiya, o'lcham va xarakteri bilan tavsifla. JSON formatda javob ber.`;

    const pageImages = Array.isArray(pdfPageImages) && pdfPageImages.length > 0 ? pdfPageImages.slice(0, 3) : [imageBase64];

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + languageInstructionDetailed(__lang) },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          ...pageImages.map((img: string) => ({ type: "image_url", image_url: { url: `data:${pageImages.length > 1 ? "image/jpeg" : imageMimeType};base64,${img}` } })),
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        model: access.model || "google/gemini-1.5-pro", 
        max_completion_tokens: Math.max(access.maxTokens || 0, 4096), 
        messages,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      
      if (__userId) await refundAiCredits(__userId, serviceId, cost, `AI Gateway error ${status}`);

      if (status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Biroz kutib qayta urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const result = normalizeRadiologyResult(parseAiJsonObject(content), content, scanType);

    await instrumentJson(data, __usageId, __start, 0, content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-radiology error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    
    if (__userId) await refundAiCredits(__userId, serviceId, cost, e instanceof Error ? e.message : "Internal error");

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
