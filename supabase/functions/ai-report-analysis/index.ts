import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess, refundAiCredits } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";
import { cleanAiText, parseAiJsonObject } from "../_shared/json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI laboratoriya analiz natijalarini tahlil qiluvchi yordamchisisan. Sen ilmiy tibbiy bazalarga (ICD-10, SNOMED CT, klinik laboratoriya standartlari) asoslanib ishlaysan.

MUHIM QOIDALAR:
1. Foydalanuvchi bergan analiz ko'rsatkichlarini tahlil qil
2. Agar rasm yoki PDF hujjat yuborilgan bo'lsa, undagi BARCHA analiz ko'rsatkichlarini o'qi va tahlil qil. Sen rasmlar va PDF hujjatlarni o'qiy olasan!
3. Har bir ko'rsatkichni normal qiymatlar bilan solishtir (jins va yoshga qarab)
4. Ehtimoliy muammolarni aniqla va ICD-10 kodlari bilan ifodalab ber
5. TASHXIS QOYMA - faqat tahlil va tavsiya ber
6. O'zbek tilida javob ber
7. HECH QACHON "o'qiy olmayman" yoki "tahlil qila olmayman" dema
8. Ko'rsatkichlarni xalqaro laboratoriya standartlari (SI Units) asosida tahlil qil

ILMIY BAZA INTEGRATSIYASI:
- Normal diapazonlarni CLSI (Clinical and Laboratory Standards Institute) standartlariga moslab ber
- Har bir abnormal ko'rsatkich uchun ehtimoliy sababni ICD-10 kodi bilan ko'rsat
- Laboratoriya panellarini o'zaro bog'liqlik asosida tahlil qil

JAVOBNI FAQAT valid JSON object sifatida ber (markdown, \`\`\`json, izoh, salomlashish YO'Q). JSON qisqa bo'lsin, barcha qavslar yopilsin:
{
  "indicators": [
    {
      "name": "Ko'rsatkich nomi",
      "value": "Berilgan qiymat",
      "normalRange": "Normal oraliq",
      "unit": "Birlik (masalan: mmol/L, g/dL)",
      "status": "normal|high|low|critical",
      "interpretation": "Qisqa izoh",
      "possibleCauses": ["Ehtimoliy sabab 1"],
      "relatedICD10": "E11.65"
    }
  ],
  "summary": "Umumiy xulosa (2-3 qisqa gap)",
  "concerns": ["Ehtimoliy muammo 1", "Muammo 2"],
  "recommendations": ["Tavsiya 1", "Tavsiya 2", "Tavsiya 3"],
  "urgentAttention": true|false,
  "suggestedSpecialist": "Tavsiya etilgan mutaxassis",
  "panelCorrelations": ["Ko'rsatkichlar o'rtasidagi bog'liqlik tahlili"],
  "followUpTests": ["Qo'shimcha tavsiya etilgan tahlillar"]
}`;

function normalizeReportResult(parsed: Record<string, unknown> | null, content: string) {
  const obj = parsed ?? {};
  const indicators = Array.isArray(obj.indicators) ? obj.indicators : [];
  const concerns = Array.isArray(obj.concerns) ? obj.concerns : [];
  const recommendations = Array.isArray(obj.recommendations) && obj.recommendations.length > 0
    ? obj.recommendations
    : ["Natijani shifokor yoki laboratoriya mutaxassisi bilan muhokama qiling."];

  return {
    indicators: indicators.map((raw: any) => ({
      name: String(raw?.name ?? "Ko'rsatkich"),
      value: String(raw?.value ?? "—"),
      normalRange: String(raw?.normalRange ?? raw?.normal_range ?? "—"),
      unit: raw?.unit ? String(raw.unit) : "",
      status: ["normal", "high", "low", "critical"].includes(raw?.status) ? raw.status : "normal",
      interpretation: String(raw?.interpretation ?? "Ko'rsatkich shifokor bilan baholanishi kerak."),
      possibleCauses: Array.isArray(raw?.possibleCauses) ? raw.possibleCauses.map(String) : [],
      relatedICD10: raw?.relatedICD10 ? String(raw.relatedICD10) : "",
    })),
    summary: String(obj.summary ?? cleanAiText(content)),
    concerns: concerns.map(String),
    recommendations: recommendations.map(String),
    urgentAttention: Boolean(obj.urgentAttention),
    suggestedSpecialist: String(obj.suggestedSpecialist ?? "Terapevt"),
    panelCorrelations: Array.isArray(obj.panelCorrelations) ? obj.panelCorrelations.map(String) : [],
    followUpTests: Array.isArray(obj.followUpTests) ? obj.followUpTests.map(String) : [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;
  let __userId: string | null = null;
  const serviceId = "ai-report-analysis";
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
    const { reportText, reportType, patientAge, patientGender, imageBase64, imageMimeType, pdfPageImages } = __body; 
    const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userMessage = `Laboratoriya analiz natijalarini tahlil qil:\n\n`;
    userMessage += `Analiz turi: ${reportType || "Umumiy"}\n`;
    if (patientAge) userMessage += `Bemor yoshi: ${patientAge}\n`;
    if (patientGender) userMessage += `Bemor jinsi: ${patientGender}\n`;

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + languageInstruction(__lang) },
    ];

    if (imageBase64 && imageMimeType) {
      const pageImages = Array.isArray(pdfPageImages) && pdfPageImages.length > 0 ? pdfPageImages.slice(0, 3) : [imageBase64];
      const instructionText = pageImages.length > 1
        ? `\nUshbu PDF sahifalarida laboratoriya analiz natijalari bor. Barcha ko'rsatkichlarni sahifalardan o'qi va JSON formatda tahlil qil.`
        : `\nUshbu rasmda laboratoriya analiz natijalari bor. Rasmdan barcha ko'rsatkichlarni o'qi va JSON formatda tahlil qil.`;
      const extracted = reportText ? `\n\nPDF/matndan ajratilgan ko'rsatkichlar:\n${String(reportText).slice(0, 12000)}\n` : "";

      messages.push({
        role: "user",
        content: [
          { type: "text", text: userMessage + instructionText + extracted },
          ...pageImages.map((img: string) => ({ type: "image_url", image_url: { url: `data:${pageImages.length > 1 ? "image/jpeg" : imageMimeType};base64,${img}` } })),
        ],
      });
    } else {
      userMessage += `\nAnaliz natijalari:\n${reportText}\n\nIltimos, yuqoridagi ko'rsatkichlarni tahlil qilib JSON formatda javob ber.`;
      messages.push({ role: "user", content: userMessage });
    }

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

    const result = normalizeReportResult(parseAiJsonObject(content), content);

    await instrumentJson(data, __usageId, __start, 0, content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-report-analysis error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    
    if (__userId) await refundAiCredits(__userId, serviceId, cost, e instanceof Error ? e.message : "Internal error");

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
