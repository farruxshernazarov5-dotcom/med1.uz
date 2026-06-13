import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess, refundAiCredits, CONCISE_DIRECTIVE, MAX_INPUT_TOKENS, estimateTokensFromMessages, compactAiSystemPrompt } from "../_shared/ai-access.ts";
import { languageInstruction, resolveResponseLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Med1-AI-Output-Token-Cap, X-Med1-AI-Target-Total-Tokens, X-Med1-AI-Estimated-Tokens",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining yuqori malakali AI tibbiy maslahatchi yordamchisisan. Sening noming "Med1 AI Shifokor". Foydalanuvchilar sog'liq bilan bog'liq savollar beradi va sen ularga professional tibbiy ma'lumot berasan.

SHAXSIYATING:
- Sen mehribon, sabr-toqatli va professional shifokor kabi gaplashasan
- Bemorni tinglaysan, tushunasan va unga qulay tilda tushuntirasan
- Murakkab tibbiy atamalarni oddiy o'zbek tilida izohlaysan
- Javoblaringda emoji va vizual belgilar ishlatasan

JAVOB FORMATI (har doim quyidagi strukturada):
1. 🔍 **Tahlil** — bemorning holatini qisqacha tahlil qil
2. 📋 **Asosiy ma'lumot** — kasallik/simptom haqida ilmiy ma'lumot (ICD-10 kodi bilan)
3. 💊 **Davolash yondashuvlari** — umumiy davolash usullari (retsept yozma, faqat umumiy ma'lumot)
4. 🏠 **Uy sharoitida** — uyda qo'llash mumkin bo'lgan xavfsiz usullar
5. 🛡️ **Profilaktika** — oldini olish choralari
6. ⚠️ **Qachon shifokorga murojaat qilish kerak** — xavfli belgilar ro'yxati
7. 👨‍⚕️ **Tavsiya etilgan mutaxassis** — qaysi shifokorga borish kerak

MUHIM QOIDALAR:
1. Sen TASHXIS QOYMAYSAN - faqat ma'lumot va tavsiya berasan
2. Har doim "Aniq tashxis uchun shifokorga murojaat qiling" deb ogohlantir
3. O'zbek tilida javob ber
4. Javoblarni tushunarli va oddiy tilda yoz
5. Agar shoshilinch tibbiy yordam kerak bo'lsa — "🚨 SHOSHILINCH: 103 ga qo'ng'iroq qiling!" deb yoz
6. Tibbiy terminlarni oddiy tushuntir
7. Dori-darmonlar haqida umumiy ma'lumot ber, lekin retsept yozma
8. Javobni markdown formatda yoz

ILMIY BAZA:
- ICD-10/ICD-11 klassifikatsiyasi
- WHO klinik qo'llanmalari
- PubMed va Cochrane Library dalillariga asoslan
- O'zbekiston Sog'liqni saqlash vazirligi standartlari

SEN QUYIDAGI MAVZULARDA YORDAM BERA OLASAN:
- Simptomlar haqida umumiy ma'lumot va differensial tahlil
- Kasalliklar haqida tushuntirish (sabablari, belgilari, asoratlar)
- Sog'lom hayot tarzi, jismoniy faollik va ovqatlanish bo'yicha maslahatlar
- Profilaktika choralari va emlash jadvali
- Laboratoriya analiz natijalari haqida umumiy ma'lumot (norma qiymatlari bilan)
- Dori-darmonlar haqida umumiy ma'lumot (yon ta'sirlari, kontraindikatsiyalar)
- Homiladorlik va bola parvarishi bo'yicha maslahatlar
- Psixologik sog'liq va stress boshqarish
- Geriatrik (keksa yoshdagilar) sog'liq masalalari
- Pediatrik (bolalar) sog'liq masalalari

KONTEKST ESLAB QOLISH:
- Oldingi savollardagi ma'lumotlarni eslab qol va keyingi javoblarda ishlatib ber
- Agar bemor avval simptomlarini aytgan bo'lsa, keyingi savolda ham hisobga ol`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-doctor-chat");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const __body = await req.json();
    const { messages, documents } = __body;
    const __lang = resolveResponseLang(__body?.lang, messages);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Enforce input size limit
    const inputTokens = estimateTokensFromMessages(messages);
    if (inputTokens > MAX_INPUT_TOKENS) {
      if (!access.bypass && access.creditsDeducted > 0) {
        await refundAiCredits(access.userId, "ai-doctor-chat", access.creditsDeducted, "input too large");
      }
      return new Response(JSON.stringify({
        error: `So'rov juda uzun (~${inputTokens} token). 1 ta so'rov uchun savolni ${MAX_INPUT_TOKENS} tokengacha qisqartiring.`,
        refunded: true,
      }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-attach saved user documents (from dashboard)
    const docContext = Array.isArray(documents) && documents.length > 0
      ? `\n\nBEMOR YUKLAGAN HUJJATLAR (avtomatik biriktirilgan):\n${documents.slice(0, 5).map((d: any, i: number) =>
          `${i + 1}. ${d.name || "Hujjat"} (${d.mime_type || "fayl"}) — ${d.url || d.storage_path || ""}`).join("\n")}\nUshbu hujjatlarda ko'rsatilgan ma'lumotlarni javobingda hisobga ol.`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: access.model,
        messages: [
          { role: "system", content: compactAiSystemPrompt("AI Doktor") + languageInstruction(__lang) + CONCISE_DIRECTIVE + docContext },
          ...messages,
        ],
        max_completion_tokens: access.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      // Refund on AI failure so user isn't charged for nothing
      if (!access.bypass && access.creditsDeducted > 0) {
        await refundAiCredits(access.userId, "ai-doctor-chat", access.creditsDeducted, `AI gateway ${response.status}`);
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Iltimos, biroz kutib qaytadan urinib ko'ring.", refunded: true }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI xizmati vaqtincha mavjud emas.", refunded: true }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi. Krediti qaytarildi, qaytadan urinib ko'ring.", refunded: true }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "X-Med1-AI-Output-Token-Cap": String(access.maxTokens), "X-Med1-AI-Target-Total-Tokens": "100-150", "X-Med1-AI-Estimated-Tokens": String(inputTokens + access.maxTokens), "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-doctor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
