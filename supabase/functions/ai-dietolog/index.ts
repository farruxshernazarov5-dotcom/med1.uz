import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContent = context ? `${SYSTEM_PROMPT}\n\nFOYDALANUVCHI KONTEKSTI: ${context}` : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemContent }, ...messages],
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

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
