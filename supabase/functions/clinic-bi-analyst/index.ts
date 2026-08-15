import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SYSTEM = `Sen MED1.UZ klinikalari uchun professional Healthcare Business Analyst'san.
Faqat berilgan JSON snapshot ma'lumotlariga tayangan holda javob ber.
QOIDALAR:
1. Hech qachon ma'lumot to'qib chiqarma. Snapshotda yo'q ko'rsatkich haqida "ma'lumot yetarli emas" deb yoz.
2. Javob tuzilishi: **Xulosa** (2-3 gap) → **Sabablar** (raqamlar bilan) → **Tavsiyalar** (3-5 aniq amaliy qadam) → **Kutilayotgan natija**.
3. Prognoz yoki taxmin bo'lsa, uni aniq "Prognoz:" deb belgila.
4. Tibbiy tashxis berma — faqat biznes va operatsion tahlil.
5. O'zbek tilida, qisqa, kirish so'zlarsiz, markdown bilan yoz. Javobni oxirigacha yakunla.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Avtorizatsiya talab qilinadi" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Sessiya topilmadi" }, 401);

    const { question, snapshot } = await req.json();
    if (!question || !snapshot) return json({ error: "Savol yoki ma'lumot yuborilmadi" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI xizmati sozlanmagan" }, 500);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 1400,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `KLINIKA MA'LUMOTLARI (JSON):\n${JSON.stringify(snapshot)}\n\nSAVOL: ${question}` },
        ],
      }),
    });

    if (res.status === 429) return json({ error: "So'rovlar limiti oshdi, biroz kuting" }, 429);
    if (res.status === 402) return json({ error: "AI krediti tugagan" }, 402);
    if (!res.ok) {
      const t = await res.text();
      console.error("clinic-bi-analyst gateway error", res.status, t);
      return json({ error: "AI tahlil xizmatida xatolik" }, 500);
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) return json({ error: "AI javob qaytarmadi" }, 500);

    return json({ answer });
  } catch (e) {
    console.error("clinic-bi-analyst error", e);
    return json({ error: e instanceof Error ? e.message : "Nomalum xatolik" }, 500);
  }
});
