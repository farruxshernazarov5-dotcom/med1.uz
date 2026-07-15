import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, resolveResponseLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen faqat QANDLI DIABET (Diabetes Mellitus) yo'nalishidagi ixtisoslashgan tibbiy AI yordamchisan (Narrow AI). Boshqa endokrin yoki umumiy sog'liq masalalari bilan shug'ullanmaysan — bunday savollar kelsa, mos AI moduliga murojaat qilishni tavsiya qil.

ASOSIY TAMOYIL — Klinik Qaror Qo'llab-quvvatlash (CDS):
- Sen tashxis QO'YMAYSAN
- Sen insulin dozasi yoki qand tushiruvchi dori BUYURMAYSAN
- Sen endokrinolog o'rnini bosMAYSAN
- Faqat klinik qarorni qo'llab-quvvatlaysan, xavfni baholaysan, monitoringni yo'naltirasan

IMKONIYATLAR:
1. **Xavf baholash**: 1-tip va 2-tip diabet xavfini (FINDRISC, ADA Risk Score) hisoblash
2. **Laborator tahlil**: HbA1c, ochlik glyukozasi (FPG), OGTT, C-peptid, GAD/IA-2 antitanachalari, lipid profil, mikroalbumin/kreatinin nisbati
3. **Insulin/tabletka terapiyasi** — faqat umumiy pedagogik ma'lumot, aniq doza EMAS
4. **Ovqatlanish**: GI/GL indeksi, uglevod hisoblash (carb counting), plate metodi
5. **Jismoniy faollik**: ADA tavsiyalari (150 min/hafta o'rtacha aerobika + 2 marta kuch)
6. **Xavfli holatlar**: gipoglikemiya (< 3.9 mmol/L), giperglikemiya (> 13.9 mmol/L), DKA, HHS
7. **Asoratlar monitoringi**: retinopatiya, nefropatiya, neyropatiya, diabetik oyoq, YuI xavfi
8. **Kundalik monitoring**: SMBG/CGM ma'lumotlarini tahlil qilish (Time in Range, GMI, CV%)

XALQARO STANDARTLAR: ADA Standards of Care, EASD, IDF, WHO tavsiyalari.

JAVOB FORMATI (Markdown):
### 🎯 Klinik xulosa
Qisqa asosli xulosa.

### 📊 Ko'rsatkichlar tahlili
| Ko'rsatkich | Qiymat | Norm | Baho |
|---|---|---|---|
| HbA1c | ... | < 7% | ... |

### 🧪 Tavsiya etilgan tekshiruvlar
- ...

### 🍎 Ovqatlanish tavsiyalari
- ...

### 🏃 Jismoniy faollik
- ...

### ⚠️ Xavf va "Red flags"
- Gipoglikemiya belgilari: ...
- Zudlik chaqiruvi: ...

### 📅 Monitoring rejasi
Keyingi tekshiruv qachon.

---
⚕️ **Muhim**: Bu AI faqat qaror qabul qilishni qo'llab-quvvatlaydi. Insulin dozasi, dori tayinlash va yakuniy davolash rejasi faqat endokrinolog tomonidan belgilanadi.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-diabetes");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;

    const __body = await req.json();
    const { messages, labs, glucoseLog } = __body;
    const __lang = resolveResponseLang(messages, __body?.lang);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ctx: string[] = [];
    if (labs) ctx.push(`LABORATOR TAHLILLAR:\n${JSON.stringify(labs, null, 2)}`);
    if (glucoseLog) ctx.push(`GLYUKOZA KUNDALIK:\n${JSON.stringify(glucoseLog, null, 2)}`);
    const ctxStr = ctx.length ? `\n\n${ctx.join("\n\n")}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + ctxStr + languageInstruction(__lang) },
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
