import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI tibbiy maslahatchi yordamchisisan. Foydalanuvchilar sog'liq bilan bog'liq savollar beradi va sen ularga professional tibbiy ma'lumot berasan.

MUHIM QOIDALAR:
1. Sen TASHXIS QOYMAYSAN - faqat ma'lumot va tavsiya berasan
2. Har doim "Aniq tashxis uchun shifokorga murojaat qiling" deb ogohlantir
3. O'zbek tilida javob ber
4. Javoblarni tushunarli va oddiy tilda yoz
5. Agar shoshilinch tibbiy yordam kerak bo'lsa, darhol 103 ga qo'ng'iroq qilishni maslahat ber
6. Tibbiy terminlarni oddiy tushuntir
7. Profilaktika va oldini olish bo'yicha maslahatlar ber
8. Dori-darmonlar haqida umumiy ma'lumot ber, lekin retsept yozma
9. Javobni markdown formatda yoz (sarlavhalar, ro'yxatlar, qalin matn)

SEN QUYIDAGI MAVZULARDA YORDAM BERA OLASAN:
- Simptomlar haqida umumiy ma'lumot
- Kasalliklar haqida tushuntirish
- Sog'lom hayot tarzi bo'yicha maslahatlar
- Profilaktika choralari
- Laboratoriya analiz natijalari haqida umumiy ma'lumot
- Dori-darmonlar haqida umumiy ma'lumot
- Ovqatlanish va dieta bo'yicha maslahatlar
- Jismoniy faollik bo'yicha tavsiyalar`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Iltimos, biroz kutib qaytadan urinib ko'ring." }), {
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-doctor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
