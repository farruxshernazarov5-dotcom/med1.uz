import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI radiologiya yordamchisisan. Sen rentgen, MRT va KT tasvirlarini tahlil qilish bo'yicha ixtisoslashgangan. Sen ilmiy tibbiy bazalarga (ICD-10, SNOMED CT, radiologiya standartlari) asoslanib ishlaysan.

MUHIM QOIDALAR:
1. Foydalanuvchi yuborgan rentgen tasvirini batafsil tahlil qil
2. Anatomik strukturalarni aniqla (o'pka, yurak, qovurg'alar, suyaklar va h.k.)
3. Patologik o'zgarishlarni aniqla (infiltratsiya, sinish, shish, suyuqlik va h.k.)
4. Har bir topilmani ICD-10 kodi bilan ifodalab ber
5. YAKUNIY TASHXIS QOYMA - faqat tahlil va tavsiya ber
6. O'zbek tilida javob ber
7. HECH QACHON "o'qiy olmayman" yoki "tahlil qila olmayman" dema
8. Professional radiologiya terminologiyasidan foydalan

TAHLIL MEZONLARI:
Ko'krak qafasi rentgeni uchun:
- O'pka maydonlari: infiltratsiya, atelektaz, pnevmotoraks, plevra suyuqligi
- Yurak: kattalashish (kardiomegaliya), konturlar
- Mediastinum: kengayish, limfa tugunlari
- Qovurg'alar va suyaklar: sinish, deformatsiya
- Diafragma: holati, tekisligi

Suyak rentgeni uchun:
- Sinish chiziqlari
- Suyak strukturasi: osteoporoz, osteoskleroz
- Bo'g'im oralig'i
- Yumshoq to'qima o'zgarishlari

JAVOBNI FAQAT quyidagi JSON formatda ber (boshqa hech narsa yozma):
{
  "imageType": "chest_xray|bone_xray|spine_xray|other",
  "imageQuality": "good|moderate|poor",
  "anatomicalStructures": [
    {
      "name": "Struktura nomi",
      "status": "normal|abnormal",
      "description": "Tavsif"
    }
  ],
  "findings": [
    {
      "location": "Joylashuv (masalan: o'ng o'pka yuqori qismi)",
      "description": "Topilma tavsifi",
      "severity": "normal|mild|moderate|severe",
      "possibleDiagnoses": [
        {
          "name": "Kasallik nomi",
          "probability": "yuqori|o'rtacha|past",
          "icd10": "ICD-10 kodi"
        }
      ]
    }
  ],
  "overallAssessment": {
    "riskLevel": "normal|attention|critical",
    "summary": "Umumiy xulosa",
    "keyFindings": ["Asosiy topilma 1", "Topilma 2"]
  },
  "recommendations": ["Tavsiya 1", "Tavsiya 2"],
  "suggestedSpecialist": "Tavsiya etilgan mutaxassis",
  "followUpStudies": ["Qo'shimcha tekshiruv 1"],
  "urgentAttention": true|false,
  "disclaimer": "Bu AI tahlili yakuniy tashxis emas. Radiolog yoki shifokor ko'rigidan o'tish zarur."
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, imageMimeType, bodyPart, patientAge, patientGender, clinicalInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64 || !imageMimeType) {
      return new Response(JSON.stringify({ error: "Rentgen tasviri yuklanmadi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userText = `Ushbu rentgen tasvirini batafsil tahlil qil.\n\n`;
    if (bodyPart) userText += `Tana qismi: ${bodyPart}\n`;
    if (patientAge) userText += `Bemor yoshi: ${patientAge}\n`;
    if (patientGender) userText += `Bemor jinsi: ${patientGender}\n`;
    if (clinicalInfo) userText += `Klinik ma'lumot: ${clinicalInfo}\n`;
    userText += `\nTasvirni diqqat bilan o'rgab, barcha anatomik strukturalar va patologik o'zgarishlarni aniqla. JSON formatda javob ber.`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          {
            type: "image_url",
            image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
          },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/gemini-2.5-pro", messages }),
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
        imageType: "other",
        imageQuality: "moderate",
        anatomicalStructures: [],
        findings: [],
        overallAssessment: { riskLevel: "attention", summary: content, keyFindings: [] },
        recommendations: ["Radiologga murojaat qiling"],
        suggestedSpecialist: "Radiolog",
        followUpStudies: [],
        urgentAttention: false,
        disclaimer: "Bu AI tahlili yakuniy tashxis emas.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-radiology error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
