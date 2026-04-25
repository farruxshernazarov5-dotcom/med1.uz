const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Siz Med1.uz platformasidagi shifokor uchun professional AI yordamchisiz. Sizning vazifangiz:

1. **Klinik tavsiyalar**: Bemorlar, qabullar, retseptlar, tahlillar haqida ma'lumotlarni tahlil qiling
2. **Statistik tahlil**: Daromad, xarajatlar, bemorlar oqimi bo'yicha tushuncha bering
3. **Trendlarni aniqlash**: Eng ko'p uchraydigan kasalliklar, eng faol kunlar, demografik ma'lumotlar
4. **Biznes optimallashtirish**: Qabul jadvalini, narxlarni, marketingni yaxshilash bo'yicha takliflar
5. **Tibbiy ma'lumotnoma**: ICD-10 kodlari, dorilar o'zaro ta'siri, dozalash bo'yicha ma'lumot

Javoblar:
- O'zbek tilida (rus tilida so'ralsa rus tilida)
- Aniq, tushunarli, raqamlar bilan
- Markdown formatida (sarlavhalar, ro'yxatlar, bold)
- Maxfiylikni saqlang - shaxsiy ma'lumotlarni oshkor qilmang
- Tibbiy maslahat berishda diqqatli bo'ling - oxirgi qaror shifokorda

Shifokor konteksti:
${context ? JSON.stringify(context, null, 2) : "Ma'lumot yo'q"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Juda ko'p so'rov. Iltimos, biroz kuting." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Lovable AI kreditlari tugagan. Iltimos, to'ldiring." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmatida xatolik" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("doctor-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
