import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CONCISE_DIRECTIVE, MAX_INPUT_TOKENS, aiUsageHeaders, enforceAiAccess, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { languageInstruction, resolveResponseLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Med1-AI-Service, X-Med1-AI-Model, X-Med1-AI-Credits, X-Med1-AI-Estimated-Tokens, X-Med1-AI-Output-Token-Cap, X-Med1-AI-Target-Total-Tokens, X-Med1-AI-Estimated-Cost-Usd",
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
- Profilaktika va oldini olish choralarini tavsiya qil

SIMPTOM TAHLIL JARAYONI:
Agar foydalanuvchi simptom aytsa, quyidagi savollarni ber:
1. Qachondan beri davom etmoqda?
2. Qanchalik kuchli (1-10)?
3. Boshqa belgilar bormi?
4. Dori qabul qilyapsizmi?
5. Surunkali kasalligingiz bormi?
Keyin ehtimoliy sabablar va mos shifokor tavsiya qil.

ANALIZ TAHLILI:
Agar foydalanuvchi analiz natijasini yuborsa:
- Ko'rsatkichni aniqlash
- Normal diapazon bilan solishtirish
- Og'ish sabablarini tushuntirish
- Qo'shimcha tekshiruvlar tavsiya qilish
- Mos mutaxassis tavsiya qilish

SHIFOKOR TAVSIYALARI:
- Ko'krak og'rig'i → Kardiolog
- Qorin og'rig'i → Gastroenterolog
- Bosh og'rig'i → Nevrolog
- Teri muammolari → Dermatolog
- Ko'z muammolari → Oftalmolog
- Burun-tomoq → LOR
- Suyak-bo'g'im → Travmatolog/Ortoped
- Ruhiy holat → Psixolog/Psixiatr
- Homiladorlik → Ginekolog
- Bolalar → Pediatr

SOG'LIQ TAVSIYALARI:
Foydalanuvchiga individual sog'liq tavsiyalari ber:
- Sog'lom ovqatlanish rejasi
- Jismoniy mashq dasturi
- Stressni boshqarish usullari
- Uyqu gigiyenasi
- Profilaktik tekshiruvlar jadvali

KO'P TILLI QO'LLAB-QUVVATLASH:
Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber (o'zbek, rus, ingliz).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-health-assistant");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const __body = await req.json(); const { messages, mode } = __body; const __lang = resolveResponseLang(__body?.lang, messages);
    const inputTokens = estimateTokensFromMessages(messages);
    if (inputTokens > MAX_INPUT_TOKENS) {
      return new Response(JSON.stringify({ error: `So'rov juda uzun (~${inputTokens} token). 1 ta so'rov uchun savolni ${MAX_INPUT_TOKENS} tokengacha qisqartiring.` }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContent = mode === "symptom"
      ? (SYSTEM_PROMPT + languageInstruction(__lang) + CONCISE_DIRECTIVE) + "\n\nHozir SIMPTOM TAHLIL rejimida ishla. Faqat eng zarur keyingi savol yoki tavsiyani ber."
      : mode === "lab"
      ? (SYSTEM_PROMPT + languageInstruction(__lang) + CONCISE_DIRECTIVE) + "\n\nHozir ANALIZ TAHLIL rejimida ishla. Faqat asosiy og'ish va keyingi qadamni yoz."
      : mode === "advice"
      ? (SYSTEM_PROMPT + languageInstruction(__lang) + CONCISE_DIRECTIVE) + "\n\nHozir SOG'LIQ TAVSIYA rejimida ishla. Faqat 2-3 qisqa tavsiya ber."
      : (SYSTEM_PROMPT + languageInstruction(__lang) + CONCISE_DIRECTIVE);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        max_completion_tokens: access.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Biroz kutib qaytadan urinib ko'ring." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, ...aiUsageHeaders("ai-health-assistant", access, inputTokens + access.maxTokens), "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-health-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
