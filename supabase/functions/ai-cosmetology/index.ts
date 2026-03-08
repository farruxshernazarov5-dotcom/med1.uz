import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, skinType, age, concerns, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = `Sen Med1.uz platformasining professional AI kosmetologiya assistentisan.
Sen o'zbek tilida javob berasan. Foydalanuvchilarga teri parvarishi, kosmetologik muolajalar va dermatologiya bo'yicha ilmiy asoslangan maslahatlar berasan.

MUHIM QOIDALAR:
1. Har bir javobda tibbiy ogohlantirish qo'sh: "⚠️ AI tahlillari faqat axborot maqsadida taqdim etiladi va tibbiy tashxis o'rnini bosa olmaydi. Aniq maslahat uchun malakali dermatolog yoki kosmetolog bilan murojaat qiling."
2. Javoblarni aniq, tushunarli va ilmiy asoslangan tarzda yoz
3. Teri muammolarini jiddiy holatlar bo'lsa shifokorda ko'rinishni tavsiya qil
4. Har bir muolaja uchun foyda va xavflarni ko'rsat`;

    if (mode === "skin-analysis") {
      systemPrompt += `\n\nFoydalanuvchi teri tahlili so'ramoqda.
Teri turi: ${skinType || "noma'lum"}
Yoshi: ${age || "noma'lum"}
Muammolar: ${concerns || "ko'rsatilmagan"}

Quyidagilarni tahlil qil va tavsiya ber:
- Teri holati umumiy bahosi (1-10 ball)
- Namligi (past/o'rta/yuqori)
- Elastiklik (past/o'rta/yuqori)
- Aniqlangan muammolar ro'yxati
- Har bir muammo uchun muolaja tavsiyasi
- Kundalik parvarish rejasi (ertalab va kechqurun)
- Haftalik parvarish (maska, peeling)
- SPF himoya tavsiyasi
Javobni markdown formatida, strukturali va ko'rgazmali tarzda ber.`;
    } else if (mode === "treatment") {
      systemPrompt += `\n\nFoydalanuvchi kosmetologik muolajalar haqida so'ramoqda.
Har bir muolaja uchun tushuntir:
- Muolaja nomi va tavsifi
- Kimga mos keladi
- O'tkazish jarayoni
- Kutilgan natija
- Xavflar va yon ta'sirlar
- Narx oralig'i (so'mda)
- Necha seans kerak
Mashhur muolajalar: kimyoviy peeling, lazer terapiyasi, mezoterapiya, biorevitalizatsiya, botoks, filler, mikroneedling, karboksiterapiya.`;
    } else if (mode === "care-plan") {
      systemPrompt += `\n\nFoydalanuvchiga shaxsiy teri parvarish rejasi yarat.
Teri turi: ${skinType || "noma'lum"}
Yoshi: ${age || "noma'lum"}
Muammolar: ${concerns || "ko'rsatilmagan"}

Reja tarkibi:
- Ertalabki parvarish (cleanser, toner, serum, moisturizer, SPF)
- Kechki parvarish (makeup remover, cleanser, toner, treatment, moisturizer)
- Haftalik parvarish (exfoliant, maska)
- Oylik kosmetolog ko'rigi tavsiyasi
- Mahsulot turlari tavsiyasi (yosh va teri turiga mos)
Har bir bosqich uchun nima uchun kerakligini tushuntir.`;
    }

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
          ...(messages || []),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi, keyinroq urinib ko'ring." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit tugagan, iltimos hisobni to'ldiring." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xatolik yuz berdi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-cosmetology error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
