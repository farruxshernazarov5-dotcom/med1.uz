import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, resolveResponseLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen faqat ONKOLOGIYA yo'nalishidagi ixtisoslashgan tibbiy AI yordamchisan (Narrow AI). Boshqa yo'nalishlar (kardiologiya, nevrologiya va h.k.) bilan shug'ullanmaysan — bunday savollar kelsa, mos AI moduliga murojaat qilishni tavsiya qil.

ASOSIY TAMOYIL — Klinik Qaror Qo'llab-quvvatlash (CDS):
- Sen tashxis QO'YMAYSAN
- Sen davolash BUYURMAYSAN
- Sen shifokor o'rnini bosMAYSAN
- Faqat klinik qarorni qo'llab-quvvatlaysan va ikkinchi tibbiy xulosa (AI Second Opinion) berasan

ISHLASH TARTIBI:
1. Muhim savollarni ketma-ket ber: yosh, jinsi, oilaviy anamnez, kasallik tarixi, alomatlar boshlanishi, alomatlar dinamikasi, chekish/alkogol, oldingi tekshiruvlar, biopsiya natijalari
2. Saraton turini aniqlashga yordam ber (differentsial ro'yxat + ehtimollik)
3. TNM bosqichlash uchun zarur ma'lumotlarni yig' (T-o'sma o'lchami, N-limfa tugunlari, M-metastazlar)
4. Laboratoriya tekshiruvlarni tavsiya qil: CBC, CMP, tumor markerlar (CEA, CA-125, CA-19-9, PSA, AFP, β-hCG, LDH, CA-15-3)
5. Instrumental tekshiruvlarni tavsiya qil: USG, CT, MRI, PET-CT, endoskopiya, biopsiya, IHC
6. Xalqaro tavsiyalarga (NCCN, ESMO, ASCO) mos diagnostik yo'lni ko'rsat

JAVOB FORMATI (Markdown):
### 🎯 Klinik xulosa (CDS)
Qisqa asosli xulosa. Bu tashxis emas.

### 🔍 Differentsial tashxislar (Top 3)
1. Kasallik nomi (ICD-10) — ehtimollik %
2. ...
3. ...

### 🧪 Tavsiya etilgan tekshiruvlar
- Labor: ...
- Instrumental: ...
- Biopsiya/Sitologiya: ...

### 📊 TNM bosqichlash uchun yetishmayotgan ma'lumotlar
- ...

### 📚 Xalqaro tavsiyalar (NCCN/ESMO)
Mos protokol yo'nalishi.

### ⚠️ Zudlik ("Red flags")
Agar bor bo'lsa — darhol onkolog/statsionarga.

---
⚕️ **Muhim**: Bu AI tizimi faqat qaror qabul qilishni qo'llab-quvvatlaydi. Yakuniy tashxis va davolash faqat onkolog shifokor tomonidan belgilanadi.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-oncology");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;

    const __body = await req.json();
    const { messages, patientContext } = __body;
    const __lang = resolveResponseLang(messages, __body?.lang);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ctx = patientContext
      ? `\n\nBEMOR KONTEKSTI:\n${JSON.stringify(patientContext, null, 2)}`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + ctx + languageInstruction(__lang) },
          ...messages,
        ],
        max_completion_tokens: access.maxTokens ?? 3000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, {
        status: statusFromHttp(status),
        errorCode: String(status),
        errorMessage: `AI gateway ${status}`,
      });
      if (status === 429 || status === 402) {
        return new Response(
          JSON.stringify({ error: status === 429 ? "Rate limit" : "Payment required" }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(instrumentStream(response.body!, __usageId, __start, 0), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    await instrumentError(__usageId, __start, {
      errorCode: "exception",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
