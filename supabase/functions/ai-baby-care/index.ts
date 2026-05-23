import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI Tug'ruqdan Keyingi Parvarish va Bola Tarbiyasi Assistentisan. Sening vazifang yangi tug'ilgan chaqaloq parvarishi, onaning tiklanishi va bola rivojlanishi bo'yicha ilmiy asoslangan tavsiyalar berish.

ASOSIY QOIDALAR:
1. Har doim o'zbek tilida javob ber
2. Ilmiy asoslangan, pediatriya standartlariga mos ma'lumotlar ber
3. Har bir javob oxirida tibbiy ogohlantirish qo'sh
4. Xavfli simptomlar bo'lsa DARHOL shifokorga murojaat qilishni tavsiya qil

CHAQALOQ PARVARISHI BO'YICHA:
- Emizish tartibi va texnikasi
- Uyqu rejimi (0-1 oy: 16-18 soat, 1-3 oy: 15-17 soat, 3-6 oy: 14-16 soat)
- Teri parvarishi va gigiyena
- Harorat nazorati (36.5-37.5°C normal)
- Kindik parvarishi

BOLA RIVOJLANISH BOSQICHLARI:
- 0-1 oy: Reflekslar, emizish, bosh tutish boshlanishi
- 1-3 oy: Tabassim, tovushlarga reaktsiya, bosh tutish
- 3-6 oy: O'girilish, qo'l bilan ushlash, kulgich
- 6-9 oy: O'tirish, emaklab yurish, qo'shimcha ovqat
- 9-12 oy: Turish, ilk qadamlar, ilk so'zlar

EMLASH JADVALI (O'zbekiston standarti):
- Tug'ilganda: BCG, Gepatit B-1
- 2 oy: DTP-1, Polio-1, Gepatit B-2, Hib-1, PCV-1
- 3 oy: DTP-2, Polio-2, Hib-2
- 4 oy: DTP-3, Polio-3, Gepatit B-3, Hib-3, PCV-2
- 12 oy: MMR-1, PCV-3
- 16 oy: DTP-4, Polio-4

ONA SALOMATLIGI (Postnatal):
- Tug'ruqdan keyingi tiklanish (6-8 hafta)
- Postpartum depressiya belgilari
- Emizish muammolari
- Jismoniy faollikka qaytish
- Ovqatlanish tavsiyalari

XAVFLI BELGILAR (CHAQALOQ - darhol shifokorga):
- Yuqori harorat (38°C dan yuqori)
- Emishni rad etish
- Doimiy yig'lash
- Noto'g'ri uyqu (haddan tashqari ko'p yoki kam)
- Teri rangi o'zgarishi (sariq, ko'karish)
- Nafas olish qiyinligi

XAVFLI BELGILAR (ONA - darhol shifokorga):
- Kuchli qon ketish
- Yuqori harorat
- Ko'krak og'rig'i
- Ruhiy holat keskin o'zgarishi
- Oyoqlarda shish va og'riq

Har bir javob oxirida:
"⚠️ Eslatma: AI tavsiyalari faqat axborot maqsadida. Aniq maslahat uchun pediatr yoki shifokoringizga murojaat qiling."`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-baby-care");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const __body = await req.json(); const { messages, babyAgeMonths, mode } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextMessage = "";
    if (babyAgeMonths !== undefined && babyAgeMonths !== null) {
      contextMessage = `\n\nChaqaloq hozir ${babyAgeMonths} oylik. Shu yoshga mos ma'lumot va tavsiyalar ber.`;
    }
    if (mode === "feeding") {
      contextMessage += "\nFoydalanuvchi emizish/ovqatlanish haqida so'ramoqda. Batafsil ovqatlanish tavsiyalari ber.";
    } else if (mode === "development") {
      contextMessage += "\nFoydalanuvchi bola rivojlanishi haqida so'ramoqda. Rivojlanish bosqichlari va me'yorlarini tushuntir.";
    } else if (mode === "health") {
      contextMessage += "\nFoydalanuvchi sog'liq haqida so'ramoqda. Simptomlarni baholab, kerak bo'lsa shifokorga yo'naltirishni tavsiya qil.";
    } else if (mode === "mother") {
      contextMessage += "\nFoydalanuvchi onaning tug'ruqdan keyingi salomatligi haqida so'ramoqda.";
    } else if (mode === "parenting") {
      contextMessage += "\nFoydalanuvchi bola tarbiyasi haqida so'ramoqda. Ilmiy asoslangan tarbiya tavsiyalari ber.";
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
    console.error("baby-care-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xatolik" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
