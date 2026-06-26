import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstructionDetailed, normalizeLang } from "../_shared/lang.ts";
import { cleanAiText, parseAiJsonObject } from "../_shared/json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI Predictive Diagnostics tizimisan. Foydalanuvchining barcha sog'liq ma'lumotlarini chuqur tahlil qilib, kasallik xavfi prognozini berasan.

MUHIM QOIDALAR:
1. TASHXIS QOYMA — faqat xavf baholash va profilaktika tavsiya qil
2. O'zbek tilida javob ber
3. Ilmiy dalillarga asoslan (WHO, AHA, NICE guidelines)
4. Har bir kasallik xavfiga ICD-10 kodi qo'sh
5. Risk score 0-100 oralig'ida bo'lsin
6. Kasallik kategoriyalari: yurak-qon tomir, metabolik, onkologik, nevrologik, nafas yo'llari, hazm tizimi
7. Har bir xavf omili uchun ilmiy asos ko'rsat
8. Profilaktik skrining tavsiyalarini batafsil ber
9. Foydalanuvchining yoshi, jinsi, BMI, oilaviy tarix, hayot tarzi — barchasini hisobga ol
10. Sog'liq indeksini hisoblashda 5 ta parametrni baholash: yurak, metabolik, nevrologik, jismoniy, umumiy

JAVOBNI FAQAT valid JSON object sifatida ber (markdown, \`\`\`json, izoh, salomlashish YO'Q). JSON qisqa bo'lsin, barcha qavslar yopilsin:
{
  "risks": [
    {
      "disease": "Kasallik nomi",
      "category": "cardiovascular|metabolic|oncologic|neurologic|respiratory|digestive",
      "riskPercent": 25,
      "riskLevel": "high|medium|low",
      "riskScore": 35,
      "factors": ["Xavf omili 1", "Omil 2"],
      "prevention": ["Oldini olish chorasi 1"],
      "icd10Code": "I25",
      "clinicalBasis": "Ilmiy asos va WHO/AHA mezonlariga ko'ra...",
      "suggestedSpecialist": "Kardiolog",
      "timeframe": "5 yil ichida",
      "modifiable": true
    }
  ],
  "overallHealth": "good|moderate|concerning",
  "overallRiskScore": 42,
  "bmi": { "value": 24.5, "category": "Normal", "interpretation": "BMI normal chegarada" },
  "healthIndex": {
    "cardiovascular": 75,
    "metabolic": 80,
    "neurologic": 90,
    "physical": 65,
    "overall": 77
  },
  "recommendations": ["Umumiy tavsiya 1", "Tavsiya 2"],
  "lifestyleScore": 72,
  "lifestyleBreakdown": {
    "nutrition": 60,
    "exercise": 70,
    "sleep": 80,
    "stress": 50,
    "habits": 75
  },
  "suggestedCheckups": ["Tekshiruv 1", "Tekshiruv 2"],
  "riskFactorAnalysis": "Umumiy xavf omillari tahlili matni",
  "preventiveScreening": [
    {"test": "Tekshiruv nomi", "frequency": "Yiliga 1 marta", "reason": "Sababi", "priority": "high|medium|low"}
  ],
  "dietaryAdvice": ["Ovqatlanish tavsiyasi 1"],
  "exerciseAdvice": ["Jismoniy mashq tavsiyasi 1"],
  "warningSignsToWatch": ["Shoshilinch holat belgisi 1"]
}`;

function normalizeHealthRiskResult(parsed: Record<string, unknown> | null, content: string) {
  const obj = parsed ?? {};
  const bmi = (obj.bmi && typeof obj.bmi === "object") ? obj.bmi as any : {};
  const healthIndex = (obj.healthIndex && typeof obj.healthIndex === "object") ? obj.healthIndex as any : {};
  const lifestyleBreakdown = (obj.lifestyleBreakdown && typeof obj.lifestyleBreakdown === "object") ? obj.lifestyleBreakdown as any : {};

  return {
    risks: Array.isArray(obj.risks) ? obj.risks.map((raw: any) => ({
      disease: String(raw?.disease ?? "Aniqlashtirish kerak"),
      category: String(raw?.category ?? "metabolic"),
      riskPercent: Number(raw?.riskPercent ?? raw?.riskScore ?? 50),
      riskLevel: ["high", "medium", "low"].includes(raw?.riskLevel) ? raw.riskLevel : "medium",
      riskScore: Number(raw?.riskScore ?? raw?.riskPercent ?? 50),
      factors: Array.isArray(raw?.factors) ? raw.factors.map(String) : [],
      prevention: Array.isArray(raw?.prevention) ? raw.prevention.map(String) : [],
      icd10Code: raw?.icd10Code ? String(raw.icd10Code) : "",
      clinicalBasis: raw?.clinicalBasis ? String(raw.clinicalBasis) : "",
      suggestedSpecialist: raw?.suggestedSpecialist ? String(raw.suggestedSpecialist) : "Terapevt",
      timeframe: raw?.timeframe ? String(raw.timeframe) : "",
      modifiable: Boolean(raw?.modifiable),
    })) : [],
    overallHealth: ["good", "moderate", "concerning"].includes(String(obj.overallHealth)) ? obj.overallHealth : "moderate",
    overallRiskScore: Number(obj.overallRiskScore ?? 50),
    bmi: {
      value: Number(bmi.value ?? 0),
      category: String(bmi.category ?? "Noma'lum"),
      interpretation: String(bmi.interpretation ?? ""),
    },
    healthIndex: {
      cardiovascular: Number(healthIndex.cardiovascular ?? 50),
      metabolic: Number(healthIndex.metabolic ?? 50),
      neurologic: Number(healthIndex.neurologic ?? 50),
      physical: Number(healthIndex.physical ?? 50),
      overall: Number(healthIndex.overall ?? 50),
    },
    recommendations: Array.isArray(obj.recommendations) && obj.recommendations.length > 0 ? obj.recommendations.map(String) : [cleanAiText(content), "Shifokorga murojaat qiling."],
    lifestyleScore: Number(obj.lifestyleScore ?? 50),
    lifestyleBreakdown: {
      nutrition: Number(lifestyleBreakdown.nutrition ?? 50),
      exercise: Number(lifestyleBreakdown.exercise ?? 50),
      sleep: Number(lifestyleBreakdown.sleep ?? 50),
      stress: Number(lifestyleBreakdown.stress ?? 50),
      habits: Number(lifestyleBreakdown.habits ?? 50),
    },
    suggestedCheckups: Array.isArray(obj.suggestedCheckups) ? obj.suggestedCheckups.map(String) : [],
    riskFactorAnalysis: String(obj.riskFactorAnalysis ?? cleanAiText(content)),
    preventiveScreening: Array.isArray(obj.preventiveScreening) ? obj.preventiveScreening : [],
    dietaryAdvice: Array.isArray(obj.dietaryAdvice) ? obj.dietaryAdvice.map(String) : [],
    exerciseAdvice: Array.isArray(obj.exerciseAdvice) ? obj.exerciseAdvice.map(String) : [],
    warningSignsToWatch: Array.isArray(obj.warningSignsToWatch) ? obj.warningSignsToWatch.map(String) : [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-health-risk");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;


    const body = await req.json(); const __lang = normalizeLang((body as any)?.lang);
    const { age, gender, weight, height, bloodPressure, smoking, alcohol, exercise,
      existingConditions, familyHistory, diet, sleepHours, stressLevel,
      medications, labResults, symptoms } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userMessage = `Foydalanuvchi sog'liq ma'lumotlari:\n`;
    userMessage += `- Yosh: ${age || "noma'lum"}\n`;
    userMessage += `- Jins: ${gender || "noma'lum"}\n`;
    userMessage += `- Vazn: ${weight || "noma'lum"} kg\n`;
    userMessage += `- Bo'y: ${height || "noma'lum"} cm\n`;
    userMessage += `- Qon bosimi: ${bloodPressure || "noma'lum"}\n`;
    userMessage += `- Chekish: ${smoking || "noma'lum"}\n`;
    userMessage += `- Alkogol: ${alcohol || "noma'lum"}\n`;
    userMessage += `- Jismoniy faollik: ${exercise || "noma'lum"}\n`;
    userMessage += `- Uyqu: ${sleepHours ? sleepHours + " soat" : "noma'lum"}\n`;
    userMessage += `- Stress darajasi: ${stressLevel || "noma'lum"}\n`;
    userMessage += `- Mavjud kasalliklar: ${existingConditions || "yo'q"}\n`;
    userMessage += `- Oilaviy tarix: ${familyHistory || "noma'lum"}\n`;
    userMessage += `- Ovqatlanish: ${diet || "noma'lum"}\n`;
    userMessage += `- Qabul qilayotgan dorilar: ${medications || "yo'q"}\n`;
    userMessage += `- Oxirgi analiz natijalari: ${labResults || "noma'lum"}\n`;
    userMessage += `- Hozirgi simptomlar: ${symptoms || "yo'q"}\n`;
    userMessage += `\nIltimos, yuqoridagi barcha ma'lumotlar asosida batafsil kasallik xavfi prognozini JSON formatda ber. Kamida 4-6 ta kasallik xavfini baholash kerak.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: access.model || "google/gemini-3-flash-preview",
        max_completion_tokens: access.maxTokens ?? 1200,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + languageInstructionDetailed(__lang) },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Keyinroq urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const result = normalizeHealthRiskResult(parseAiJsonObject(content), content);

    await instrumentJson(data, __usageId, __start, 0, content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-health-risk error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
