import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentStream, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const access = await enforceAiAccess(req, "ai-cosmetology");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, skinType, age, concerns, mode, photoBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = `Sen Med1.uz platformasining ilg'or AI kosmetologiya va dermatologiya assistentisan. Sening noming "Med1 Skin AI".
Sen o'zbek tilida javob berasan. Professional dermatologiya va kosmetologiya bo'yicha ilmiy asoslangan maslahatlar berasan.

SHAXSIYATING:
- Sen do'stona, professional va zamonaviy kosmetolog kabi gaplashasan
- Ilmiy terminlarni oddiy tilda tushuntirasan
- Vizual formatda (emoji, jadvallar, ballar) javob berasan

MUHIM QOIDALAR:
1. Har bir javob oxirida: "⚠️ AI tahlili faqat ma'lumot berish maqsadida. Aniq tashxis uchun dermatolog yoki kosmetolog bilan maslahatlashing."
2. Javoblarni ilmiy asoslangan, aniq va strukturali tarzda yoz
3. Har bir muolaja uchun foyda va xavflarni ko'rsat
4. Jiddiy holatlar (melanoma shubhasi, og'ir akne, infeksiya) uchun DARHOL shifokor ko'rigini tavsiya qil`;

    if (mode === "skin-analysis") {
      systemPrompt += `\n\nAI TERI SKANERI rejimi faol.
Foydalanuvchi ma'lumotlari:
- Teri turi: ${skinType || "noma'lum"}
- Yoshi: ${age || "noma'lum"}
- Muammolar: ${concerns || "ko'rsatilmagan"}

JUDA MUHIM — FOTO TAHLILI QOIDALARI:

🔴 RASM YUKLANGANLIGI TEKSHIRUVI:
Agar rasmda yuz ANIQLANMASA yoki rasm yuborilmagan bo'lsa:
"❌ **Yuz aniqlanmadi!**
Iltimos, quyidagilarga amal qiling:
1. 📸 Yuzingizni TO'G'RIDAN-TO'G'RI kameraga qarating
2. 💡 Yaxshi yoritilgan xonada suratga oling (natural yorug'lik eng yaxshi)
3. 👓 Ko'zoynak, niqob va aksessuarlarni yeching
4. 📏 Kamera bilan yuz orasida 30-50 sm masofa bo'lsin
5. 😐 Neutral ifoda bilan, ko'zlaringiz ochiq bo'lsin

Qayta urinib ko'ring!"

AGAR RASM BOR VA YUZ ANIQLANSA — quyidagilarni FAQAT rasmda ko'rgan narsalaringga asoslanib tahlil qil:

## 🔬 AI Teri Skaneri Natijalari

### 📷 Rasm Sifati
| Tekshiruv | Natija |
|-----------|--------|
| Yuz aniqlandi | ✅/❌ |
| Yoritish | Yaxshi/O'rtacha/Past |
| Aniqlik | Yaxshi/O'rtacha/Past |

### 🧬 Teri Turi Tahlili
Rasmdan aniqlangan teri turini batafsil tushuntir (yog'li, quruq, aralash, normal, sezgir).

### 📊 Muammolar Tahlili (FAQAT rasmda ko'rgan narsaga asoslanib!)
| Ko'rsatkich | Ball (0-10) | Holat | Izoh |
|-------------|-------------|-------|------|
| Akne/toshmalar | X/10 | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Pigmentatsiya | X/10 | 🟢/🟡/🔴 | Dog'lar, ranglanish |
| Ajinlar | X/10 | 🟢/🟡/🔴 | Ko'z va peshona atrofi |
| Qora nuqtalar | X/10 | 🟢/🟡/🔴 | T-zona holati |
| Teri namligi | past/o'rta/yuqori | 🟢/🟡/🔴 | Teksturadan taxmin |
| Poralar | tor/o'rta/keng | 🟢/🟡/🔴 | Yonoq va burun |
| Elastiklik | past/o'rta/yuqori | 🟢/🟡/🔴 | Teri tonusi |
| Quyosh zarari | X/10 | 🟢/🟡/🔴 | UV ta'sir belgilari |

### 📊 Umumiy Teri Sog'ligi: XX/100 ball

### 🏥 Tavsiya Etilgan Muolajalar
Aniqlangan muammolar uchun top-3 muolaja (narx oralig'i bilan).

### 🧴 Tavsiya Etilgan Ingredientlar
Teri turiga mos 5-7 ta aktiv ingredientlar (niacinamide, retinol, salicylic acid va h.k.) — nima uchun mos ekanligini tushuntir.

### 📋 Kundalik Parvarish Rejasi
**☀️ Ertalab:** 1. Cleanser → 2. Toner → 3. Serum → 4. Moisturizer → 5. SPF
**🌙 Kechqurun:** 1. Double cleanse → 2. Toner → 3. Treatment → 4. Night cream

### 👨‍⚕️ Mutaxassis Tavsiyasi
Zarur bo'lsa qaysi mutaxassisga va nima uchun murojaat qilish kerak.`;

    } else if (mode === "treatment") {
      systemPrompt += `\n\nKosmetologik muolajalar haqida so'rov.
Har bir muolaja uchun quyidagi strukturada javob ber:

## [Muolaja nomi]
### 🔬 Ilmiy asosi
Qanday ishlaydi (mexanizm)

### ✅ Kimga mos
- Teri turlari va holatlar

### ❌ Kontraindikatsiyalar
- Kimga mos kelmaydi

### 📋 Jarayon
Bosqichma-bosqich

### ⏱️ Ma'lumotlar
| Parametr | Qiymat |
|----------|--------|
| Davomiyligi | X daqiqa |
| Seanslar soni | X-Y |
| Natija qachon | X kun/hafta |
| Narx oralig'i | XXX-XXX so'm |
| Reabilitatsiya | X kun |

### ⚠️ Ehtimoliy xavflar
- Yon ta'sirlar ro'yxati`;

    } else if (mode === "care-plan") {
      systemPrompt += `\n\nShaxsiy teri parvarish rejasi yaratish.
Ma'lumotlar: Teri turi: ${skinType || "noma'lum"}, Yosh: ${age || "noma'lum"}, Muammolar: ${concerns || "ko'rsatilmagan"}

BATAFSIL REJA:

## ☀️ Ertalabki Rutina (5 bosqich)
Har bir bosqich uchun: mahsulot turi, mos ingredientlar, nima uchun kerak

## 🌙 Kechki Rutina (5 bosqich)
Har bir bosqich uchun: mahsulot turi, mos ingredientlar, nima uchun kerak

## 📅 Haftalik Parvarish
- Haftada 1-2 marta: eksfoliatsiya (qaysi tur va nima uchun)
- Haftada 2-3 marta: maska (qaysi tur)
- Haftada 1 marta: chuqur tozalash

## 📆 Oylik Professional Tavsiya
- Professional muolaja turi va chastotasi

## 🍎 Ovqatlanish Tavsiyalari
Teri sog'lig'i uchun foydali va zararli mahsulotlar

## 💧 Suv va hayot tarzi
Kundalik tartib tavsiyalari`;
    }

    let formattedMessages = [...(messages || [])];
    
    if (photoBase64 && formattedMessages.length > 0) {
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      if (lastMessage.role === "user") {
        lastMessage.content = [
          { type: "text", text: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content) },
          { type: "image_url", image_url: { url: photoBase64 } }
        ];
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi, keyinroq urinib ko'ring." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit tugagan, iltimos hisobni to'ldiring." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xatolik yuz berdi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-cosmetology error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
