import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CONCISE_DIRECTIVE, compactAiSystemPrompt, enforceAiAccess } from "../_shared/ai-access.ts";
import { languageInstruction, resolveResponseLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

JAVOBNI FAQAT quyidagi JSON formatda ber (boshqa hech narsa yozma):
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
  "summary": "Umumiy xulosa",
  "concerns": ["Ehtimoliy muammo 1", "Muammo 2"],
  "recommendations": ["Tavsiya 1", "Tavsiya 2"],
  "urgentAttention": true|false,
  "suggestedSpecialist": "Tavsiya etilgan mutaxassis",
  "panelCorrelations": ["Ko'rsatkichlar o'rtasidagi bog'liqlik tahlili"],
  "followUpTests": ["Qo'shimcha tavsiya etilgan tahlillar"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-report-analysis");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const __body = await req.json(); const { reportText, reportType, patientAge, patientGender, imageBase64, imageMimeType } = __body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userMessage = `Laboratoriya analiz natijalarini tahlil qil:\n\n`;
    userMessage += `Analiz turi: ${reportType || "Umumiy"}\n`;
    if (patientAge) userMessage += `Bemor yoshi: ${patientAge}\n`;
    if (patientGender) userMessage += `Bemor jinsi: ${patientGender}\n`;
    const __lang = resolveResponseLang(__body?.lang, reportText || userMessage);

    // Build messages array
    const messages: any[] = [
      { role: "system", content: compactAiSystemPrompt("Laboratoriya tahlili") + languageInstruction(__lang) + CONCISE_DIRECTIVE + `\nJSON: {"indicators":[{"name":"","status":"normal|high|low|critical","interpretation":""}],"summary":"","recommendations":[""]}` },
    ];

    if (imageBase64 && imageMimeType) {
      // Vision/document request - send file for OCR
      const isPdf = imageMimeType === "application/pdf";
      const instructionText = isPdf
        ? `\nUshbu PDF hujjatda laboratoriya analiz natijalari bor. Hujjatdan barcha ko'rsatkichlarni o'qi va JSON formatda tahlil qil.`
        : `\nUshbu rasmda laboratoriya analiz natijalari bor. Rasmdan barcha ko'rsatkichlarni o'qi va JSON formatda tahlil qil.`;
      
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: userMessage + instructionText,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageMimeType};base64,${imageBase64}`,
            },
          },
        ],
      });
    } else {
      // Text-only request
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
        model: "google/gemini-2.5-pro",
        messages,
        max_completion_tokens: access.maxTokens,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Biroz kutib qayta urinib ko'ring." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      result = {
        indicators: [],
        summary: content,
        concerns: [],
        recommendations: ["Shifokorga murojaat qiling"],
        urgentAttention: false,
        suggestedSpecialist: "Terapevt",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-report-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
