import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI tibbiy yordamchisisan. Foydalanuvchi kiritgan simptomlar asosida ehtimoliy kasalliklarni tahlil qilasan.

MUHIM QOIDALAR:
1. Sen TASHXIS QOYMAYSAN - faqat ehtimoliy kasalliklar ro'yxatini berasan
2. Har doim "Shifokorga murojaat qiling" deb ogohlantir
3. Javobni FAQAT quyidagi JSON formatda ber, boshqa hech narsa yozma
4. O'zbek tilida javob ber
5. Har bir kasallik uchun ehtimollik foizini mos ravishda belgilab ber
6. Xavf darajasini real baholab ber

JSON FORMAT (faqat shu formatda javob ber):
{
  "diseases": [
    {
      "name": "Kasallik nomi",
      "probability": 85,
      "description": "Qisqa tavsif",
      "matchingSymptoms": ["simptom1", "simptom2"],
      "riskLevel": "high|medium|low",
      "specialist": "Mutaxassis nomi (masalan: Kardiolog, Nevropatolog)"
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
  ]
}

SIMPTOMLAR TAHLIL QOIDALARI:
- Agar yuqori xavfli simptomlar (ko'krak og'rig'i, nafas qisilishi, hushdan ketish) bo'lsa - urgentAction: true va riskLevel: "high" qo'y
- 3 tagacha eng ehtimoliy kasallikni ko'rsat
- Har bir kasallik uchun qaysi mutaxassisga murojaat qilish kerakligini yoz
- Tavsiyalar amaliy va tushunarli bo'lsin`;

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

    userMessage += `\n\nIltimos, yuqoridagi simptomlarni tahlil qilib, JSON formatda javob ber.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from possible markdown code blocks
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
