import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, skinType, age, concerns, mode, photoBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = `Sen Med1.uz platformasining ilg'or AI kosmetologiya va dermatologiya assistentisan.
Sen o'zbek tilida javob berasan. Foydalanuvchilarga teri parvarishi, kosmetologik muolajalar va dermatologiya bo'yicha ilmiy asoslangan maslahatlar berasan.

SEN PROFESSIONAL DERMATOLOGIYA AI MODELISAN. Sening vazifalaring:
1. Teri holatini Computer Vision va Dermatology AI model sifatida tahlil qilish
2. Skin pattern recognition orqali muammolarni aniqlash
3. Individual parvarish rejalarini yaratish
4. Professional muolajalar tavsiya qilish

MUHIM QOIDALAR:
1. Har bir javob oxirida majburiy ogohlantirish: "⚠️ AI tahlili faqat ma'lumot berish maqsadida. Aniq tashxis uchun dermatolog yoki kosmetolog bilan maslahatlashing."
2. Javoblarni ilmiy asoslangan, aniq va strukturali tarzda yoz
3. Har bir muolaja/tavsiya uchun foyda va xavflarni ko'rsat
4. Jiddiy holatlar uchun darhol shifokor ko'rigini tavsiya qil
5. Javoblarda vizual indikatorlar (emoji progress bar) ishlatilsin`;

    if (mode === "skin-analysis") {
      systemPrompt += `\n\nAI TERI SKANERI rejimi faol.
Foydalanuvchi ma'lumotlari:
- Teri turi: ${skinType || "avtomatik aniqlang"}
- Yoshi: ${age || "noma'lum"}
- Ko'rsatilgan muammolar: ${concerns || "ko'rsatilmagan"}

JUDA MUHIM — FOTO TAHLILI QOIDALARI:
1. Agar foydalanuvchi rasmni yuklagan bo'lsa, FAQAT haqiqiy rasmni tahlil qil.
2. Rasmda yuzni aniqla (Face Detection). Agar yuz aniqlanmasa, foydalanuvchiga xabar ber:
   "❌ Yuz aniqlanmadi. Iltimos, yuzingizni to'g'ridan-to'g'ri kameraga qarating va qayta urinib ko'ring."
3. Rasmni sinchiklab ko'r va quyidagilarni REAL tahlil qil:
   - Teri rangi va toni
   - Akne, toshmalar, yallig'lanish belgilari
   - Pigmentatsiya dog'lari
   - Ajinlar va chiziqlar (ayniqsa ko'z va peshona atrofida)
   - Teshiklar (poralar) holati
   - Teri teksturasi va namligi
   - Quyosh zarari belgilari
4. Hech qachon tasodifiy ballar qo'yma — faqat rasmda ko'rgan narsalarga asoslanib baho ber
5. Agar rasm sifati past bo'lsa yoki yuz yaxshi ko'rinmasa, foydalanuvchiga ayt:
   "⚠️ Rasm sifati past. Yaxshiroq natija uchun: yaxshi yoritilgan joyda, ko'zoynak va aksessuarlarsiz, yuzni to'g'ridan-to'g'ri kameraga qaratib suratga oling."

RASMDA KO'RGAN NARSALARINGGA ASOSLANIB QUYIDAGILARNI TAHLIL QIL:

## 🔬 Teri Skaneri Natijalari

### 📷 Rasm Sifati Tekshiruvi
| Tekshiruv | Natija |
|-----------|--------|
| Yuz aniqlandi | ✅/❌ |
| Yoritish sifati | Yaxshi/O'rtacha/Past |
| Rasm aniqligi | Yaxshi/O'rtacha/Past |

### Teri Turi
Rasmdan aniqlangan teri turini ko'rsat va tushuntir.

### Muammolar Tahlili (har biri uchun 0-10 ball — FAQAT rasmda ko'rgan narsaga asoslanib)
| Ko'rsatkich | Ball | Holat | Izoh |
|-------------|------|-------|------|
| Akne/toshmalar | X/10 | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Pigmentatsiya | X/10 | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Ajinlar | X/10 | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Qora nuqtalar | X/10 | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Teri namligi | past/o'rta/yuqori | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Teshiklar kengligi | tor/o'rta/keng | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Teri elastikligi | past/o'rta/yuqori | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |
| Quyosh zarari | X/10 | 🟢/🟡/🔴 | Rasmda ko'rgan belgilar |

### 📊 Umumiy Teri Sog'ligi: XX/100

### 💊 Tavsiya Etilgan Muolajalar
Har bir aniqlangan muammo uchun mos muolaja tavsiya qil.

### 🧴 Tavsiya Etilgan Mahsulotlar
Teri turiga mos ingredientlar (niacinamide, salicylic acid, retinol, hyaluronic acid va h.k.) va mahsulot turlari tavsiya qil.

### 📋 Kundalik Parvarish Rejasi
Ertalab va kechqurun uchun bosqichma-bosqich.

### 👨‍⚕️ Kosmetolog Ko'rigi
Zarur bo'lsa, qaysi mutaxassisga murojaat qilish kerak.`;
    } else if (mode === "treatment") {
      systemPrompt += `\n\nKosmetologik muolajalar haqida so'rov.
Har bir muolaja uchun professional tarzda tushuntir:
- Muolaja nomi va ilmiy asosi
- Qanday ishlaydi (mexanizmi)
- Kimga mos keladi va kimga mos kelmaydi (kontraindikatsiyalar)
- O'tkazish jarayoni
- Kutilgan natija va qachon ko'rinadi
- Ehtimoliy xavflar va yon ta'sirlar
- Narx oralig'i (so'mda)
- Necha seans kerak
- Reabilitatsiya davri
Mashhur muolajalar: kimyoviy peeling, lazer terapiyasi, mezoterapiya, biorevitalizatsiya, botoks, filler, mikroneedling, karboksiterapiya, PRP terapiya.`;
    } else if (mode === "care-plan") {
      systemPrompt += `\n\nShaxsiy teri parvarish rejasi yaratish so'rovi.
Foydalanuvchi ma'lumotlari:
- Teri turi: ${skinType || "noma'lum"}
- Yoshi: ${age || "noma'lum"}
- Muammolar: ${concerns || "ko'rsatilmagan"}

BATAFSIL REJA YARAT:

## ☀️ Ertalabki Parvarish (5 bosqich)
1. Yuzni tozalash (cleanser) — turi va sababi
2. Tonik — turi va sababi
3. Serum — turi va sababi
4. Namlantiruvchi krem — turi va sababi
5. SPF himoyasi — SPF darajasi va sababi

## 🌙 Kechki Parvarish (5 bosqich)
1. Makeup remover
2. Cleanser
3. Tonik
4. Treatment (retinol/AHA/BHA)
5. Night cream

## 📅 Haftalik Parvarish
- Peeling (qaysi tur, haftada necha marta)
- Maska (qaysi tur, haftada necha marta)
- Chuqur tozalash

## 📆 Oylik Tavsiyalar
- Kosmetolog ko'rigi
- Professional muolaja

Har bir mahsulot turi uchun teri turiga mos ingredientlar tavsiya qil.`;
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
