import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI kalit topilmadi");

    const systemPrompt = mode === "treatment"
      ? `Sen professional stomatolog AI yordamchisan. Davolash rejalari, materiallar tanlash va risk baholash bo'yicha maslahat berasan. Javoblaringni o'zbek tilida, aniq va professional tarzda ber. Har doim ogohlantirishlarni qo'sh: "Bu AI tavsiyasi - yakuniy qaror shifokor tomonidan qabul qilinishi kerak."`
      : mode === "diagnosis"
      ? `Sen dental rentgen tahlilchi AI san. Tish rentgen tasviri tavsifi asosida mumkin bo'lgan muammolarni aniqla: kariyes, periodontit, suyak yo'qolishi, kista, impaksiya va h.k. Natijalarni tish raqami bilan ko'rsat (FDI tizimi). Har doim ogohlantirishlarni qo'sh.`
      : `Sen stomatologiya bo'yicha AI yordamchisan. Tish davolash, dori tavsiyalari, bemor savollari va klinik qarorlar bo'yicha professional maslahat berasan. Javoblaringni o'zbek tilida ber. Har doim: "Bu AI tavsiyasi" degan ogohlantirishni qo'sh.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "AI xatolik");

    const reply = data.choices?.[0]?.message?.content || "Javob olinmadi";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Xatolik" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
