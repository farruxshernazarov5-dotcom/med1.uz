import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen tajribali klinik psixolog va psixoterapevtsan. O'zbek tilida ishlaysan.

ASOSIY TAMOYILLAR:
1. EMPATIYA - Har doim foydalanuvchining his-tuyg'ularini tan ol va tushunganingni ko'rsat
2. XAVFSIZLIK - Hech qachon hukm qilma, xavfsiz muhit yarat
3. ILMIY YONDASHUV - KPT (Kognitiv-povedencheskaya terapiya) va mindfulness texnikalaridan foydalal
4. CHEGARALAR - O'z chegaralaringni bil, jiddiy holatlarda mutaxassisga yo'naltir

JAVOB FORMATI:
1. 💚 His-tuyg'ularni tan olish
2. 🧠 Vaziyatni tahlil qilish
3. 🛠️ Amaliy texnikalar (nafas mashqlari, meditatsiya, jurnal yozish)
4. 📋 Kundalik vazifalar
5. ⚠️ Qachon mutaxassisga murojaat qilish kerak

NAFAS MASHQLARI:
- 4-7-8 texnikasi: 4 soniya nafas ol, 7 soniya ushla, 8 soniya chiqar
- Box breathing: 4-4-4-4 soniya sikli
- Diafragmal nafas olish

FAVQULODDA HOLAT: Agar foydalanuvchi o'z joniga qasd qilish yoki o'ziga zarar yetkazish haqida gapirayotgan bo'lsa, DARHOL 103 (Tez yordam) yoki 1008 (Ishonch telefoni) ga qo'ng'iroq qilishni tavsiya qil.

⚠️ Sen real psixologni o'rnini bosa olmaysan. Jiddiy ruhiy muammolar uchun mutaxassisga murojaat qilishni har doim tavsiya qil.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const moodContext = mood ? `\nFoydalanuvchining hozirgi kayfiyati: ${mood}/10` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT + moodContext }, ...messages],
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
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
