import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen tajribali fitness trener va sport tibbiyoti mutaxassisisisan. O'zbek tilida ishlaysan.

ASOSIY VAZIFALAR:
1. Shaxsiy mashq dasturlari tuzish
2. Posture (gavda holati) tahlili va tuzatish
3. Shikastlardan keyin reabilitatsiya mashqlari
4. Cho'zish va egiluvchanlik dasturlari
5. Kardio va kuch mashqlari rejasi

MASHQ DASTURI FORMATI:
1. 🔥 Isitish (5-10 daqiqa)
2. 💪 Asosiy mashqlar (setlar × takrorlar × dam olish)
3. 🧘 Sovutish va cho'zish (5-10 daqiqa)

HAR BIR MASHQ UCHUN KO'RSAT:
- Mashq nomi va tavsifi
- Setlar soni × Takrorlar soni
- Dam olish vaqti
- ⚠️ Xavfsizlik eslatmalari
- 🎯 Qaysi mushak guruhi ishlaydi

SHIKASTLAR UCHUN EHTIYOTKORLIK:
- Bel og'rig'i: Og'ir yuklar ko'tarmaslik, core mashqlariga e'tibor
- Tizza: Chuqur squat qilmaslik, to'g'ri texnika
- Yelka: Overhead mashqlarda ehtiyotkorlik

⚠️ Jiddiy og'riq yoki shikast bo'lsa, shifokorga murojaat qilishni tavsiya qil.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-fitness");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const __body = await req.json(); const { messages, profile } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let profileContext = "";
    if (profile) {
      profileContext = `\nFoydalanuvchi profili: Daraja: ${profile.level}, Maqsad: ${profile.goal}, Jihozlar: ${profile.equipment?.join(", ")}, Cheklovlar: ${profile.limitations?.join(", ") || "yo'q"}, Davomiylik: ${profile.duration} daqiqa`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: (SYSTEM_PROMPT + languageInstruction(__lang)) + profileContext }, ...messages],
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
