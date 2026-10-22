import { sanitizeChatMessages } from "../_shared/sanitize-messages.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, resolveResponseLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI Tug'ruqdan Keyingi Parvarish va Bola Tarbiyasi Assistentisan. Sening vazifang yangi tug'ilgan chaqaloq parvarishi, onaning tiklanishi va bola rivojlanishi bo'yicha ilmiy asoslangan tavsiyalar berish.

ASOSIY QOIDALAR:
1. Har doim foydalanuvchining so'nggi xabari tilida javob ber
2. Ilmiy asoslangan, pediatriya standartlariga mos ma'lumotlar ber
3. Har bir javob oxirida tibbiy ogohlantirish qo'sh
4. Xavfli simptomlar bo'lsa DARHOL shifokorga murojaat qilishni tavsiya qil

XAVFLI BELGILAR (CHAQALOQ - darhol shifokorga):
- Yuqori harorat (38°C dan yuqori)
- Emishni rad etish
- Doimiy yig'lash
- Teri rangi o'zgarishi (sariq, ko'karish)
- Nafas olish qiyinligi

JAVOB TUZILISHI (faqat savolga tegishli bandlarni tanla, hammasini takrorlama):
1. 👶 Qisqa xulosa
2. 📈 Shu yoshdagi normal rivojlanish (WHO o'sish standartlari: vazn, bo'y, motor, nutq, ijtimoiy ko'nikmalar)
3. 🍼 Ovqatlantirish: 6 oygacha faqat ko'krak suti/aralashma, 6 oydan qo'shimcha ovqat bosqichlari, allergen kiritish
4. 😴 Uyqu me'yori va xavfsiz uyqu (chalqancha, qattiq matras, yostiqsiz — SIDS profilaktikasi)
5. 💉 O'zbekiston milliy emlash taqvimi bo'yicha navbatdagi emlash
6. 🛁 Gigiyena, kindik, teri, tish chiqarish parvarishi
7. 👩 Onaning tiklanishi: tug'ruqdan keyingi depressiya belgilari (EPDS), laktatsiya, chok parvarishi
8. 🚨 Qizil bayroqlar — 3 oygacha chaqaloqda 38°C — darhol 103; suvsizlanish (6 soat siydik yo'q), letargiya, tutqanoq, toshma bosganda yo'qolmasa
Dori dozasini yosh, vazn va preparat konsentratsiyasi tasdiqlanmagan bo‘lsa hisoblama. Uch oygacha isitma bo‘lsa dori tavsiyasi bilan yordamni kechiktirma. Aspirin bolalarga mumkin emas. Muddatidan oldin tug‘ilgan bolada rivojlanish uchun tuzatilgan yosh zarurligini tushuntir; WHO percentilini haqiqiy o‘lchov va jadvalsiz to‘qib chiqarma. Emizishning qat’iy soat oralig‘idan ko‘ra ochlik signallariga qarab ovqatlantirishni tushuntir. Bir yoshgacha asal bermaslik, bo‘g‘ilish xavfi va xavfsiz uyquni tegishli savolda eslat. Emlash sanalarini amaldagi mahalliy jadvalni pediatr bilan tasdiqlamasdan qat’iy belgilama.
Avval savolga to‘g‘ridan-to‘g‘ri javob, keyin yoshga mos 2–4 amaliy qadam, xavf belgilari va pediatr (ona alomatlarida akusher-ginekolog) tavsiyasini ber. Uyqu, ovqatlanish yoki kunlik reja so‘ralganda qisqa, teng ustunli jadval ber. Yosh ko‘rsatilmagan bo‘lsa aniqlashtir, yangi tug‘ilgan deb taxmin qilma.
Bu so‘rovda tashqi klinik manba yoki med1.uz bilim bazasidan maqola olinmagan. Yakuniy manba satri aynan: "Manba: med1.uz (platforma). Klinik manbalar bu so‘rovda tekshirilmagan." JSST yoki boshqa tashkilotni tekshirilgan manba sifatida ko‘rsatma. Sigir sutini 12 oygacha asosiy ichimlik sifatida bermaslikni, ammo qo‘shimcha ovqat tayyorlashdagi oz miqdor sut va yoshga mos pasterizatsiyalangan sut mahsulotlarini bundan farqlashni tushuntir. Tuz/shakar qo‘shmaslik tavsiya; bu tabiiy tarkibdagi barcha shakar taqiqlangan degani emas. Allergenga tayyorlik bo‘lsa xavfsiz shaklda birma-bir kiriting; har bir ovqat uchun majburiy 3–5 kun kutishni talab qilmang, yuqori allergiya xavfida pediatr bilan kelishing.
Markdown sarlavha va ro'yxatlardan foydalan, qisqa va aniq yoz.

Har bir javob oxirida:
"⚠️ Eslatma: AI tavsiyalari faqat axborot maqsadida. Aniq maslahat uchun pediatr yoki shifokoringizga murojaat qiling."`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-baby-care");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;

    const __body = await req.json(); const { messages, babyAgeMonths, mode } = __body; const __lang = resolveResponseLang(messages, __body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextMessage = "";
    if (babyAgeMonths !== undefined && babyAgeMonths !== null) {
      const age = Number(babyAgeMonths);
      if (Number.isFinite(age) && age >= 0 && age <= 60) contextMessage = `\n\nChaqaloq hozir ${Math.round(age)} oylik.`;
    }
    const safeMode = typeof mode === "string" && /^[a-z_-]{1,30}$/i.test(mode) ? mode : "";
    if (safeMode) contextMessage += `\nReja rejimi: ${safeMode}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [{ role: "system", content: SYSTEM_PROMPT + contextMessage + languageInstruction(__lang) }, ...sanitizeChatMessages(messages)],
        max_completion_tokens: access.maxTokens ?? 600,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi, keyinroq urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Kredit yetarli emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatoligi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(instrumentStream(response.body!, __usageId, __start, 0), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("baby-care-ai error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xatolik" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
