import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI Shaxsiy Sog'liq Assistentisan — 24/7 ishlaydigan professional tibbiy yordamchi.

SENING VAZIFALARING:
1. **Simptom tahlili** — foydalanuvchi simptomlarini so'rab, ehtimoliy sabablarni ko'rsat
2. **Analiz natijalarini tushuntirish** — laboratoriya ko'rsatkichlarini oddiy tilda tushuntir (normal diapazon, og'ish sabablari)
3. **Tibbiy tasvirlar haqida maslahat** — rentgen, MRT, KT natijalarini tushuntir
4. **Shifokor va klinika tavsiyasi** — simptomlar asosida mos mutaxassisni tavsiya qil
5. **Sog'liq monitoringi** — foydalanuvchi sog'liq ko'rsatkichlarini kuzat
6. **Individual tavsiyalar** — ovqatlanish, jismoniy mashq, stress boshqarish bo'yicha

MUHIM QOIDALAR:
- Sen TASHXIS QOYMAYSAN — faqat ma'lumot, tahlil va tavsiya berasan
- Har doim "Aniq tashxis uchun shifokorga murojaat qiling" deb ogohlantir
- Shoshilinch holatlarda darhol 103 ga qo'ng'iroq qilishni maslahat ber
- Javoblarni oddiy, tushunarli tilda yoz
- Tibbiy terminlarni tushuntir
- Dori-darmon haqida umumiy ma'lumot ber, lekin retsept yozma
- Javobni markdown formatda yoz (sarlavhalar, ro'yxatlar, qalin matn, jadvallar)
- ICD-10 kodlarini ko'rsat (agar tegishli bo'lsa)
- Profilaktika va oldini olish choralarini tavsiya qil`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-health-assistant");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;

    const __body = await req.json(); const { messages, mode } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContent = mode === "symptom"
      ? (SYSTEM_PROMPT + languageInstruction(__lang)) + "\n\nHozir SIMPTOM TAHLIL rejimida ishla."
      : mode === "lab"
      ? (SYSTEM_PROMPT + languageInstruction(__lang)) + "\n\nHozir ANALIZ TAHLIL rejimida ishla."
      : mode === "advice"
      ? (SYSTEM_PROMPT + languageInstruction(__lang)) + "\n\nHozir SOG'LIQ TAVSIYA rejimida ishla."
      : (SYSTEM_PROMPT + languageInstruction(__lang));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [{ role: "system", content: systemContent }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(instrumentStream(response.body!, __usageId, __start, 0), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("ai-health-assistant error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
