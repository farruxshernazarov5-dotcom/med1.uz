import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen tajribali klinik psixolog va psixoterapevtsan. O'zbek tilida ishlaysan.

ASOSIY TAMOYILLAR:
1. EMPATIYA - Har doim foydalanuvchining his-tuyg'ularini tan ol va tushunganingni ko'rsat
2. XAVFSIZLIK - Hech qachon hukm qilma, xavfsiz muhit yarat
3. ILMIY YONDASHUV - KPT (Kognitiv-povedencheskaya terapiya) va mindfulness texnikalaridan foydalal
4. CHEGARALAR - O'z chegaralaringni bil, jiddiy holatlarda mutaxassisga yo'naltir

JAVOB FORMATI:
1. 💚 His-tuyg'ularni tan olish
2. 🧠 Vaziyatni tahlil qilish
3. 🛠️ Amaliy texnikalar (nafas mashqlari, meditatsiya, jurnal yozish)
4. 📋 Kundalik vazifalar
5. ⚠️ Qachon mutaxassisga murojaat qilish kerak

NAFAS MASHQLARI:
- 4-7-8 texnikasi: 4 soniya nafas ol, 7 soniya ushla, 8 soniya chiqar
- Box breathing: 4-4-4-4 soniya sikli
- Diafragmal nafas olish

FAVQULODDA HOLAT: Agar foydalanuvchi o'z joniga qasd qilish yoki o'ziga zarar yetkazish haqida gapirayotgan bo'lsa, DARHOL 103 (Tez yordam) yoki 1008 (Ishonch telefoni) ga qo'ng'iroq qilishni tavsiya qil.

⚠️ Sen real psixologni o'rnini bosa olmaysan. Jiddiy ruhiy muammolar uchun mutaxassisga murojaat qilishni har doim tavsiya qil.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-psixolog");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;

    const __body = await req.json(); const { messages, mood } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const moodContext = mood ? `\nFoydalanuvchining hozirgi kayfiyati: ${mood}/10` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [{ role: "system", content: (SYSTEM_PROMPT + languageInstruction(__lang)) + moodContext }, ...messages],
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
