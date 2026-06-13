import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CONCISE_DIRECTIVE, compactAiSystemPrompt, MAX_INPUT_TOKENS, aiUsageHeaders, enforceAiAccess, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { languageInstruction, resolveResponseLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Med1-AI-Service, X-Med1-AI-Model, X-Med1-AI-Credits, X-Med1-AI-Estimated-Tokens, X-Med1-AI-Output-Token-Cap, X-Med1-AI-Target-Total-Tokens, X-Med1-AI-Estimated-Cost-Usd",
};

const SYSTEM_PROMPT = `Sen tajribali dietolog va ovqatlanish mutaxassisisisan. O'zbekiston sharoitida ishlaysan.

ASOSIY VAZIFALAR:
1. Shaxsiy ovqatlanish rejasi tuzish (O'zbek taomlari asosida)
2. Kaloriya va makronutrientlarni hisoblash
3. Kasalliklarga qarab parhez tavsiyalari
4. Vitaminlar va minerallar haqida maslahat
5. Vazn boshqarish strategiyalari

JAVOB FORMATI:
- Har bir taom uchun kaloriya va makronutrientlarni ko'rsat
- O'zbek milliy taomlari (osh, sho'rva, non, lag'mon) uchun sog'lom alternativalar taklif qil
- Kunlik ovqatlanish rejasini 5-6 ta ovqatga bo'l
- Suv iste'moli va vitamin tavsiyalarini qo'sh

⚠️ OGOHLANTIRISH: Sen shifokor emassan. Jiddiy kasalliklar uchun mutaxassisga murojaat qilishni tavsiya qil.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-dietolog");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const __body = await req.json(); const { messages, context } = __body; const __lang = resolveResponseLang(__body?.lang, messages);
    const inputTokens = estimateTokensFromMessages(messages);
    if (inputTokens > MAX_INPUT_TOKENS) {
      return new Response(JSON.stringify({ error: `So'rov juda uzun (~${inputTokens} token). Savolni ${MAX_INPUT_TOKENS} tokengacha qisqartiring.` }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContent = context ? `${(compactAiSystemPrompt("AI Dietolog") + languageInstruction(__lang) + CONCISE_DIRECTIVE)}\n\nFOYDALANUVCHI KONTEKSTI: ${context}` : (compactAiSystemPrompt("AI Dietolog") + languageInstruction(__lang) + CONCISE_DIRECTIVE);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemContent }, ...messages],
        max_completion_tokens: access.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: status === 429 ? "Rate limit" : "Payment required" }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(response.body, { headers: { ...corsHeaders, ...aiUsageHeaders("ai-dietolog", access, inputTokens + access.maxTokens), "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
