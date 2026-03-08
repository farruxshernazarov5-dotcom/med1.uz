import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI laboratoriya analiz natijalarini tahlil qiluvchi yordamchisisan.

MUHIM QOIDALAR:
1. Foydalanuvchi bergan analiz ko'rsatkichlarini tahlil qil
2. Har bir ko'rsatkichni normal qiymatlar bilan solishtir
3. Ehtimoliy muammolarni aniqla
4. TASHXIS QOYMA - faqat tahlil va tavsiya ber
5. O'zbek tilida javob ber

JAVOBNI FAQAT quyidagi JSON formatda ber:
{
  "indicators": [
    {
      "name": "Ko'rsatkich nomi",
      "value": "Berilgan qiymat",
      "normalRange": "Normal oraliq",
      "status": "normal|high|low|critical",
      "interpretation": "Qisqa izoh"
    }
  ],
  "summary": "Umumiy xulosa",
  "concerns": ["Ehtimoliy muammo 1", "Muammo 2"],
  "recommendations": ["Tavsiya 1", "Tavsiya 2"],
  "urgentAttention": true|false,
  "suggestedSpecialist": "Tavsiya etilgan mutaxassis"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reportText, reportType, patientAge, patientGender } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userMessage = `Laboratoriya analiz natijalarini tahlil qil:\n\n`;
    userMessage += `Analiz turi: ${reportType || "Umumiy"}\n`;
    if (patientAge) userMessage += `Bemor yoshi: ${patientAge}\n`;
    if (patientGender) userMessage += `Bemor jinsi: ${patientGender}\n`;
    userMessage += `\nAnaliz natijalari:\n${reportText}\n\nIltimos, yuqoridagi ko'rsatkichlarni tahlil qilib JSON formatda javob ber.`;

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
