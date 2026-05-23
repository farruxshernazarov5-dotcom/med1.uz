import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI Homiladorlik Assistentisan. Sening vazifang homilador ayollarga haftalik ma'lumotlar, tibbiy tavsiyalar va sog'liq nazoratida yordam berish.

ASOSIY QOIDALAR:
1. Har doim o'zbek tilida javob ber
2. Ilmiy asoslangan, ishonchli ma'lumotlar ber
3. Har bir javob oxirida tibbiy ogohlantirish qo'sh
4. Xavfli simptomlar bo'lsa DARHOL shifokorga murojaat qilishni tavsiya qil
5. Homiladorlik haftasiga qarab aniq tavsiyalar ber

HAFTALIK MA'LUMOT BERISH TARTIBI:
- Homila o'lchami va vazni
- Organlar rivojlanishi
- Ona uchun ovqatlanish tavsiyalari
- Vitamin va minerallar
- Jismoniy faollik tavsiyalari
- Kerakli tekshiruvlar

XAVFLI SIMPTOMLAR (darhol shifokorga yuborish):
- Qon ketishi
- Kuchli qorin og'rig'i
- Bosh aylanishi va hushdan ketish
- Shish (yuz, qo'l, oyoqlarda)
- Ko'rish buzilishi
- Homila harakatlari sezilarli kamayishi
- Yuqori harorat (38°C dan yuqori)
- Suv ketishi

TRIMESTERLAR:
- 1-trimester: 1-12 hafta
- 2-trimester: 13-27 hafta
- 3-trimester: 28-40 hafta

HOMILA HARAKATLARI MONITORINGI:
- 20-haftadan boshlab harakatlarni kuzatish
- 28-haftadan so'ng har kuni kamida 10 ta harakat 2 soat ichida bo'lishi kerak
- Harakatlar sezilarli kamaysa — DARHOL shifokorga

Har bir javob oxirida:
"⚠️ Eslatma: AI tavsiyalari faqat axborot maqsadida. Aniq maslahat uchun shifokoringizga murojaat qiling."`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-pregnancy");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const __body = await req.json(); const { messages, pregnancyWeek, trimester, mode } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextMessage = "";
    if (pregnancyWeek) {
      contextMessage = `\n\nFoydalanuvchi hozir homiladorlikning ${pregnancyWeek}-haftasida (${trimester || ""}-trimester). Shu haftaga mos ma'lumot ber.`;
    }
    if (mode === "weekly") {
      contextMessage += "\nFoydalanuvchi haftalik homila rivojlanishi haqida so'ramoqda. Batafsil haftalik ma'lumot ber: homila o'lchami, vazni, organlar rivojlanishi, ona uchun tavsiyalar.";
    } else if (mode === "symptoms") {
      contextMessage += "\nFoydalanuvchi simptomlar haqida so'ramoqda. Xavf darajasini baholab, kerak bo'lsa shifokorga yo'naltirishni tavsiya qil.";
    } else if (mode === "nutrition") {
      contextMessage += "\nFoydalanuvchi ovqatlanish haqida so'ramoqda. Shu hafta uchun kerakli vitaminlar, minerallar va ovqatlanish rejimini ber.";
    } else if (mode === "kicks") {
      contextMessage += "\nFoydalanuvchi homila harakatlari haqida so'ramoqda. Harakatlar monitoringi bo'yicha maslahat ber.";
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
          { role: "system", content: (SYSTEM_PROMPT + languageInstruction(__lang)) + contextMessage },
          ...messages,
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
        return new Response(JSON.stringify({ error: "Kredit yetarli emas." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatoligi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("pregnancy-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xatolik" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
