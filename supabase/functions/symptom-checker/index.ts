import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI tibbiy yordamchisisan. Sen ilmiy tibbiy bazalarga (ICD-10/ICD-11, SNOMED CT, PubMed, MedlinePlus, WHO) asoslangan erta diagnostika tizimisan.

MUHIM QOIDALAR:
1. Sen TASHXIS QOYMAYSAN - faqat ehtimoliy kasalliklar ro'yxatini va differensial diagnostikani berasan
2. Har doim "Shifokorga murojaat qiling" deb ogohlantir
3. Javobni FAQAT quyidagi JSON formatda ber, boshqa hech narsa yozma
4. O'zbek tilida javob ber
5. Har bir kasallik uchun ICD-10 kodini ko'rsat
6. SNOMED CT terminologiyasiga amal qil
7. Differensial diagnostika tamoyiliga asosan kasalliklarni solishtir
8. Xavf darajasini WHO mezonlariga mos ravishda baholab ber

ILMIY TIBBIY BAZA INTEGRATSIYASI:
- ICD-10: Har bir kasallik uchun xalqaro klassifikatsiya kodini ber (masalan: G43 - Migren, E11 - 2-tip diabet)
- ICD-11: Imkoni bo'lsa ICD-11 kodini ham qo'sh
- SNOMED CT: Simptomlarni standart tibbiy terminologiya bilan ifodalab ber
- Klinik dalillarga asoslanib ehtimollik foizini mos ravishda belgilab ber

DIFFERENSIAL DIAGNOSTIKA ALGORITMI:
1. Kiritilgan simptomlar kombinatsiyasini tahlil qil
2. Simptomlar davomiyligi va og'riq darajasini hisobga ol
3. Bemor yoshi va jinsiga mos kasalliklarni filtrla
4. Tibbiy tarixni inobatga ol
5. Eng ehtimoliy kasalliklarni klinik dalillar asosida tartiblash
6. Har bir kasallik uchun mos va mos kelmaydigan simptomlarni ko'rsat

XAVF DARAJASI MEZONLARI (WHO asosida):
- HIGH (Yuqori): Hayotga xavf soladigan holat, shoshilinch tibbiy yordam talab qiladi
- MEDIUM (O'rtacha): Kechiktirib bo'lmaydigan, 24-72 soat ichida shifokorga murojaat kerak
- LOW (Past): Rejalashtirilgan ko'rik tavsiya etiladi

JSON FORMAT:
{
  "diseases": [
    {
      "name": "Kasallik nomi",
      "probability": 85,
      "description": "Qisqa tavsif - klinik belgilari, kelib chiqishi",
      "matchingSymptoms": ["simptom1", "simptom2"],
      "nonMatchingSymptoms": ["bu kasallikka mos kelmaydigan simptomlar"],
      "riskLevel": "high|medium|low",
      "specialist": "Mutaxassis nomi",
      "icd10Code": "G43.0",
      "icd11Code": "8A80.1",
      "snomedCode": "37796009",
      "differentialNotes": "Nima uchun bu tashxis boshqalardan farq qiladi",
      "suggestedTests": ["MRT", "Qon tahlili"],
      "clinicalEvidence": "Ilmiy asos va dalillar"
    }
  ],
  "riskLevel": "high|medium|low",
  "recommendations": [
    "Tavsiya 1",
    "Tavsiya 2"
  ],
  "urgentAction": true|false,
  "followUpQuestions": [
    "Qo'shimcha savol 1?",
    "Qo'shimcha savol 2?"
  ],
  "differentialDiagnosis": {
    "primarySuspect": "Eng ehtimoliy kasallik nomi",
    "ruledOut": ["Istisno qilingan kasalliklar"],
    "needsMoreInfo": ["Qo'shimcha ma'lumot talab qiladigan kasalliklar"],
    "clinicalReasoning": "Differensial diagnostika mantiqiy asosi"
  },
  "suggestedLabTests": [
    {
      "testName": "Tahlil nomi",
      "purpose": "Maqsadi",
      "urgency": "urgent|routine"
    }
  ],
  "suggestedImaging": [
    {
      "type": "MRT|KT|UZI|Rentgen",
      "bodyPart": "Tekshiriladigan a'zo",
      "purpose": "Maqsadi"
    }
  ],
  "medicalReferences": [
    {
      "source": "PubMed|WHO|MedlinePlus",
      "title": "Manbaa sarlavhasi",
      "relevance": "Qanday aloqasi bor"
    }
  ]
}

SIMPTOMLAR TAHLIL QOIDALARI:
- Agar yuqori xavfli simptomlar (ko'krak og'rig'i, nafas qisilishi, hushdan ketish, kuchli qon ketish) bo'lsa - urgentAction: true va riskLevel: "high" qo'y
- 3-5 tagacha eng ehtimoliy kasallikni ko'rsat
- Har bir kasallik uchun ICD-10 kodi ALBATTA bo'lishi kerak
- Differensial diagnostika mantiqiy izohini ber
- Tavsiya etilgan laboratoriya va tasviriy diagnostika usullarini ko'rsat`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, age, gender, duration, painLevel, existingConditions, allergies, followUpAnswers } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userMessage = `Bemor ma'lumotlari:
- Yosh: ${age || "noma'lum"}
- Jins: ${gender || "noma'lum"}
- Simptomlar: ${Array.isArray(symptoms) ? symptoms.join(", ") : symptoms}
- Davomiyligi: ${duration || "noma'lum"}
- Og'riq darajasi (1-10): ${painLevel || "noma'lum"}`;

    if (existingConditions) {
      userMessage += `\n- Mavjud kasalliklar: ${existingConditions}`;
    }
    if (allergies) {
      userMessage += `\n- Allergiyalar: ${allergies}`;
    }
    if (followUpAnswers && followUpAnswers.length > 0) {
      userMessage += `\n\nQo'shimcha javoblar:\n${followUpAnswers.map((a: { question: string; answer: string }) => `S: ${a.question}\nJ: ${a.answer}`).join("\n")}`;
    }

    userMessage += `\n\nIltimos, yuqoridagi simptomlarni ICD-10, SNOMED CT va ilmiy tibbiy bazalar asosida tahlil qilib, differensial diagnostika bilan birga JSON formatda javob ber.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Iltimos, biroz kutib qaytadan urinib ko'ring." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      result = {
        diseases: [],
        riskLevel: "low",
        recommendations: ["Shifokorga murojaat qiling"],
        urgentAction: false,
        followUpQuestions: [],
        differentialDiagnosis: null,
        suggestedLabTests: [],
        suggestedImaging: [],
        medicalReferences: [],
        rawResponse: content,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("symptom-checker error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
