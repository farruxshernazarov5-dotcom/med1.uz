import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen tajribali klinik farmatsevt va farmakologsan. O'zbek tilida ishlaysan.

ASOSIY VAZIFALAR:
1. Dorilar o'zaro ta'sirini tekshirish (Drug-Drug Interaction)
2. Dori analoglarini topish (INN asosida)
3. Dozalash qoidalari va rejimi
4. Nojo'ya ta'sirlar haqida ma'lumot
5. Saqlash shartlari va yaroqlilik muddati
6. Homiladorlik va emizish davrida dori xavfsizligi

JAVOB FORMATI:
1. 💊 Dori haqida asosiy ma'lumot (INN, savdo nomi, guruh)
2. 📋 Ko'rsatmalar va qarshi ko'rsatmalar
3. ⚠️ O'zaro ta'sirlar (xavflilik darajasi bilan)
4. 💰 Analoglar va narxlar (O'zbekiston bozori)
5. 📝 Qabul qilish tartibi

O'ZARO TA'SIR DARAJALARI:
- 🔴 XAVFLI - Birgalikda qabul qilish mumkin emas
- 🟡 EHTIYOTKORLIK - Shifokor nazoratida
- 🟢 XAVFSIZ - Birgalikda qabul qilish mumkin

⚠️ Bu ma'lumot faqat ma'lumot maqsadida. Har qanday dorini qabul qilishdan oldin shifokor yoki farmatsevt bilan maslahatlashing.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-farmatsevt");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;

    const __body = await req.json(); const { messages, medications } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const medsContext = medications?.length ? `\nFoydalanuvchining dorilar ro'yxati: ${medications.join(", ")}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [{ role: "system", content: (SYSTEM_PROMPT + languageInstruction(__lang)) + medsContext }, ...messages],
        max_completion_tokens: access.maxTokens ?? 600,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: status === 429 ? "Rate limit" : "Payment required" }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(instrumentStream(response.body!, __usageId, __start, 0), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
