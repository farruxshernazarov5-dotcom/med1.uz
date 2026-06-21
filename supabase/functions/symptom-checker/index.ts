import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

KLINIK MUHOKAMA ALGORITMI:
1. Simptomlar kombinatsiyasini tahlil qil — qaysi kasalliklar bu to'plamga mos keladi
2. Bayesian ehtimollik yondashuvini qo'lla — har bir simptom qo'shilganda ehtimollikni qayta hisoblash
3. "Red flags" (xavfli belgilar) ni birinchi tekshir:
   - Ko'krak og'rig'i + nafas qisilishi → MI, PE, pnevmotoraks
   - Kuchli bosh og'rig'i + bo'yin qotishi → meningit, SAH
   - Qorin og'rig'i + qon ketish → ichki qon ketish
   - Hushdan ketish → kardiogen, nevrologik, metabolik sabablar
4. Epidemiologik kontekstni hisobga ol (O'zbekiston uchun: tuberkulyoz, brutselloz, gepatitlar, ichburug')
5. Yosh va jinsga xos kasalliklarni filtrla

XAVF DARAJASI MEZONLARI (WHO asosida):
- HIGH: Hayotga xavf, shoshilinch tibbiy yordam (0-2 soat)
- MEDIUM: 24-72 soat ichida shifokorga murojaat
- LOW: Rejalashtirilgan ko'rik (1-2 hafta ichida)

DIFFERENSIAL DIAGNOSTIKA SIFAT NAZORATI:
- Kamida 3, ko'pi bilan 5 ta ehtimoliy kasallik
- Eng xavfli kasallik birinchi o'rinda bo'lsin (even if less probable)
- Har bir kasallik uchun "mos" va "mos kelmaydigan" simptomlar ko'rsatilsin
- Ehtimollik foizi klinik dalillarga asoslansin (tanaffur qilma)

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
  "recommendations": ["Tavsiya 1", "Tavsiya 2"],
  "urgentAction": true|false,
  "followUpQuestions": ["Qo'shimcha savol 1?", "Qo'shimcha savol 2?"],
  "differentialDiagnosis": {
    "primarySuspect": "Eng ehtimoliy kasallik",
    "ruledOut": ["Istisno qilingan kasalliklar"],
    "needsMoreInfo": ["Qo'shimcha ma'lumot talab qiladigan kasalliklar"],
    "clinicalReasoning": "Differensial diagnostika mantiqiy asosi"
  },
  "suggestedLabTests": [{"testName": "Tahlil nomi", "purpose": "Maqsadi", "urgency": "urgent|routine"}],
  "suggestedImaging": [{"type": "MRT|KT|UZI|Rentgen", "bodyPart": "A'zo", "purpose": "Maqsadi"}],
  "medicalReferences": [{"source": "PubMed|WHO|MedlinePlus", "title": "Manba", "relevance": "Aloqasi"}]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "symptom-checker");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;


    const __body = await req.json(); const { symptoms, age, gender, duration, painLevel, existingConditions, allergies, followUpAnswers } = __body; const __lang = normalizeLang(__body?.lang);
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
      userMessage += `\n\nQo'shimcha javoblar:\n${followUpAnswers.map((a: { question: string; answer: string }) => `S: ${a.question}\nJ: ${a.answer}`).join("\n")}`;
    }

    userMessage += `\n\nYuqoridagi simptomlarni ICD-10, SNOMED CT va ilmiy tibbiy bazalar asosida tahlil qilib, differensial diagnostika bilan birga JSON formatda javob ber. FAQAT JSON qaytar, boshqa hech narsa yozma.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + languageInstruction(__lang) },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Biroz kutib qaytadan urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    await instrumentJson(data, __usageId, __start, 0, content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("symptom-checker error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
