import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI sog'liq xavfi prognoz tizimisan. Foydalanuvchining sog'liq ma'lumotlari asosida kelajakdagi kasallik xavflarini baholaysan.

MUHIM QOIDALAR:
1. Foydalanuvchi ma'lumotlari asosida xavf prognozini ber
2. TASHXIS QOYMA - faqat xavf baholash va tavsiya ber
3. O'zbek tilida javob ber
4. Profilaktika choralari tavsiya qil

JAVOBNI FAQAT quyidagi JSON formatda ber:
{
  "risks": [
    {
      "disease": "Kasallik nomi",
      "riskPercent": 25,
      "riskLevel": "high|medium|low",
      "factors": ["Xavf omili 1", "Omil 2"],
      "prevention": ["Oldini olish chorasi 1"]
    }
  ],
  "overallHealth": "good|moderate|concerning",
  "bmi": { "value": 24.5, "category": "Normal" },
  "recommendations": ["Umumiy tavsiya 1", "Tavsiya 2"],
  "lifestyleScore": 72,
  "suggestedCheckups": ["Tekshiruv 1", "Tekshiruv 2"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { age, gender, weight, height, bloodPressure, smoking, alcohol, exercise, existingConditions, familyHistory, diet } = await req.json();
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
    userMessage += `- Mavjud kasalliklar: ${existingConditions || "yo'q"}\n`;
    userMessage += `- Oilaviy tarix: ${familyHistory || "noma'lum"}\n`;
    userMessage += `- Ovqatlanish: ${diet || "noma'lum"}\n`;
    userMessage += `\nIltimos, yuqoridagi ma'lumotlar asosida sog'liq xavfi prognozini JSON formatda ber.`;

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
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi." }), {
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
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else throw new Error("No JSON");
    } catch {
      result = {
        risks: [],
        overallHealth: "moderate",
        bmi: { value: 0, category: "Noma'lum" },
        recommendations: ["Shifokorga murojaat qiling"],
        lifestyleScore: 50,
        suggestedCheckups: [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-health-risk error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
