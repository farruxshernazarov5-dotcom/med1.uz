import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI Tug'ruqdan Keyingi Parvarish va Bola Tarbiyasi Assistentisan. Sening vazifang yangi tug'ilgan chaqaloq parvarishi, onaning tiklanishi va bola rivojlanishi bo'yicha ilmiy asoslangan tavsiyalar berish.

ASOSIY QOIDALAR:
1. Har doim o'zbek tilida javob ber
2. Ilmiy asoslangan, pediatriya standartlariga mos ma'lumotlar ber
3. Har bir javob oxirida tibbiy ogohlantirish qo'sh
4. Xavfli simptomlar bo'lsa DARHOL shifokorga murojaat qilishni tavsiya qil

XAVFLI BELGILAR (CHAQALOQ - darhol shifokorga):
- Yuqori harorat (38°C dan yuqori)
- Emishni rad etish
- Doimiy yig'lash
- Teri rangi o'zgarishi (sariq, ko'karish)
- Nafas olish qiyinligi

Har bir javob oxirida:
"⚠️ Eslatma: AI tavsiyalari faqat axborot maqsadida. Aniq maslahat uchun pediatr yoki shifokoringizga murojaat qiling."`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-baby-care");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;

    const __body = await req.json(); const { messages, babyAgeMonths, mode } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextMessage = "";
    if (babyAgeMonths !== undefined && babyAgeMonths !== null) {
      contextMessage = `\n\nChaqaloq hozir ${babyAgeMonths} oylik.`;
    }
    if (mode) contextMessage += `\nReja rejimi: ${mode}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [{ role: "system", content: (SYSTEM_PROMPT + languageInstruction(__lang)) + contextMessage }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi, keyinroq urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Kredit yetarli emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatoligi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(instrumentStream(response.body!, __usageId, __start, 0), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("baby-care-ai error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xatolik" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
