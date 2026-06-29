import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess, refundAiCredits } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstructionDetailed, detectLangFromText, normalizeLang } from "../_shared/lang.ts";
import { cleanAiText, parseAiJsonObject } from "../_shared/json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI tibbiy yordamchisisan. Sen ilmiy tibbiy bazalarga (ICD-10/ICD-11, SNOMED CT, PubMed, MedlinePlus, WHO) asoslangan erta diagnostika tizimisan.

MUHIM QOIDALAR:
1. Sen TASHXIS QOYMAYSAN - faqat ehtimoliy kasalliklar ro'yxatini va differensial diagnostikani berasan
2. Har doim "Shifokorga murojaat qiling" deb ogohlantir
3. Javobni FAQAT valid JSON object sifatida ber, boshqa hech narsa yozma. Markdown/\`\`\`json ishlatma, barcha qavslarni yop
4. Foydalanuvchining so'nggi xabari tilida javob ber
5. Har bir kasallik uchun ICD-10 kodini ko'rsat

JSON FORMAT:
{
  "diseases": [
    {
      "name": "Kasallik nomi",
      "probability": 85,
      "description": "Qisqa tavsif",
      "matchingSymptoms": ["simptom1"],
      "riskLevel": "high|medium|low",
      "icd10Code": "G43.0"
    }
  ],
  "riskLevel": "high|medium|low",
  "recommendations": ["Tavsiya 1"],
  "urgentAction": true|false,
  "followUpQuestions": ["Savol 1"]
}`;

function normalizeSymptomResult(parsed: Record<string, unknown> | null, content: string) {
  const obj = parsed ?? {};
  return {
    diseases: Array.isArray(obj.diseases) ? obj.diseases.map((raw: any) => ({
      name: String(raw?.name ?? "Aniqlashtirish kerak"),
      probability: Number(raw?.probability ?? 0),
      description: String(raw?.description ?? cleanAiText(content)),
      matchingSymptoms: Array.isArray(raw?.matchingSymptoms) ? raw.matchingSymptoms.map(String) : [],
      riskLevel: ["high", "medium", "low"].includes(raw?.riskLevel) ? raw.riskLevel : "low",
      specialist: String(raw?.specialist ?? "Terapevt"),
      icd10Code: raw?.icd10Code ? String(raw.icd10Code) : "",
    })) : [],
    riskLevel: ["high", "medium", "low"].includes(String(obj.riskLevel)) ? obj.riskLevel : "low",
    recommendations: Array.isArray(obj.recommendations) && obj.recommendations.length > 0 ? obj.recommendations.map(String) : [cleanAiText(content), "Shifokorga murojaat qiling."],
    urgentAction: Boolean(obj.urgentAction),
    followUpQuestions: Array.isArray(obj.followUpQuestions) ? obj.followUpQuestions.map(String) : [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;
  let __userId: string | null = null;
  const serviceId = "symptom-checker";
  const cost = 5;

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
    const { symptoms, age, gender, duration, painLevel, existingConditions, allergies, followUpAnswers } = __body; 
    const __lang = detectLangFromText(Array.isArray(symptoms) ? symptoms.join(" ") : symptoms) ?? normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userMessage = `Bemor ma'lumotlari:
- Yosh: ${age || "noma'lum"}
- Jins: ${gender || "noma'lum"}
- Simptomlar: ${Array.isArray(symptoms) ? symptoms.join(", ") : symptoms}
- Davomiyligi: ${duration || "noma'lum"}
- Og'riq darajasi (1-10): ${painLevel || "noma'lum"}`;

    if (existingConditions) userMessage += `\n- Mavjud kasalliklar: ${existingConditions}`;
    if (allergies) userMessage += `\n- Allergiyalar: ${allergies}`;
    if (followUpAnswers?.length > 0) {
      userMessage += `\n\nQo'shimcha javoblar:\n${followUpAnswers.map((a: any) => `S: ${a.question}\nJ: ${a.answer}`).join("\n")}`;
    }

    userMessage += `\n\nJSON formatda tahlil ber.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: access.model || "google/gemini-2.5-flash",
        max_completion_tokens: access.maxTokens || 2048,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + languageInstructionDetailed(__lang) },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (__userId) await refundAiCredits(__userId, serviceId, cost, `AI Gateway error ${status}`);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const result = normalizeSymptomResult(parseAiJsonObject(content), content);

    await instrumentJson(data, __usageId, __start, 0, content);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    if (__userId) await refundAiCredits(__userId, serviceId, cost, e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
