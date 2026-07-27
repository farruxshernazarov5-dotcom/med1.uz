import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAiUsageEvent, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `Sen Med1.uz "Menga mos shifokorni top" AI yo'naltiruvchisisan.
Bemor simptomi/kasalligi, yoshi, jinsi, joylashuvi va qo'shimcha savollarga bergan javoblari asosida eng mos mutaxassisliklarni aniqlaysan.
FAQAT JSON qaytar, boshqa matn yozma. Kirish/salomlashish yozma.

{
  "specialties": ["Kardiolog"],
  "possible_conditions": ["Gipertoniya"],
  "urgency": "low|medium|high|critical",
  "confidence": 0-100,
  "confidence_reason": "1 jumla: nima uchun shu ishonchlilik (qaysi maʼlumot yetarli/yetishmayapti)",
  "red_flags": [
    { "id": "q1", "question": "Ko'krak og'rig'i qo'l yoki jag'ga tarqalyaptimi?", "why": "yurak xurujini istisno qilish" }
  ],
  "detected_red_flags": ["aniqlangan xavfli belgi"],
  "age_note": "yoshga mos qisqa izoh",
  "summary": "1-2 jumla nima uchun shu mutaxassis kerak",
  "questions_for_doctor": ["shifokorga beriladigan savol"]
}

Qoidalar:
- "red_flags" — bemorga beriladigan 3-5 ta HA/YO'Q savol, faqat hayotga xavfli yoki shoshilinch holatlarni istisno qilish uchun. Agar bemar javoblari allaqachon berilgan bo'lsa, faqat hali aniqlanmagan savollarni qoldir (yoki bo'sh massiv).
- Javoblarda "ha" bo'lgan xavfli belgilar bo'lsa urgency ni oshir va "detected_red_flags" ga yoz.
- "confidence": maʼlumot qanchalik to'liq va simptom qanchalik aniq mutaxassislikka mos kelishiga qarab bering. Javoblar berilmagan bo'lsa 40-65 dan oshmasin.
Mutaxassisliklar ro'yxatidan foydalan: Kardiolog, Terapevt, Stomatolog, Oftalmolog, LOR, Pediatr, Ginekolog, Dermatolog, Nevrolog, Gastroenterolog, Ortoped, Travmatolog, Psixiatr, Psixolog, Endokrinolog, Urolog, Nefrolog, Pulmonolog, Onkolog, Allergolog, Revmatolog, Infeksionist, Xirurg, Kosmetolog, Fizioterapevt.
18 yoshdan kichik bo'lsa Pediatr birinchi o'rinda bo'lsin. Ayol reproduktiv shikoyatlarda Ginekolog qo'sh.
Javob bemor tilida (o'zbek) bo'lsin.`;


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Tizimga kirish talab qilinadi" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Sessiya yaroqsiz" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = await createAiUsageEvent({ userId: u.user.id, serviceId: "ai-doctor-match", req, model: MODEL });

    const body = await req.json().catch(() => ({}));
    const complaint = typeof body.complaint === "string" ? body.complaint.trim().slice(0, 800) : "";
    const age = Number.isFinite(Number(body.age)) ? Number(body.age) : null;
    const gender = ["male", "female"].includes(body.gender) ? body.gender : null;
    const region = typeof body.region === "string" ? body.region.trim().slice(0, 80) : "";
    const answers: { question: string; answer: string }[] = Array.isArray(body.answers)
      ? body.answers
          .filter((a: any) => a && typeof a.question === "string")
          .slice(0, 8)
          .map((a: any) => ({ question: String(a.question).slice(0, 200), answer: String(a.answer ?? "").slice(0, 40) }))
      : [];

    if (complaint.length < 3) {
      await instrumentError(__usageId, __start, { status: "blocked", errorCode: "bad_request", errorMessage: "short complaint" });
      return new Response(JSON.stringify({ error: "Simptom yoki kasallikni yozing" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userMsg = `Shikoyat: ${complaint}\nYosh: ${age ?? "ko'rsatilmagan"}\nJins: ${gender === "female" ? "ayol" : gender === "male" ? "erkak" : "ko'rsatilmagan"}\nJoylashuv: ${region || "ko'rsatilmagan"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!aiRes.ok) {
      await instrumentError(__usageId, __start, { status: statusFromHttp(aiRes.status), errorCode: String(aiRes.status), errorMessage: `AI gateway ${aiRes.status}` });
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi, biroz keyin urinib ko'ring" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI krediti tugadi" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error " + aiRes.status);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    await instrumentJson(aiData, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMsg }]), content);

    let analysis: any = null;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      analysis = m ? JSON.parse(m[0]) : null;
    } catch { analysis = null; }
    if (!analysis) {
      analysis = { specialties: ["Terapevt"], possible_conditions: [], urgency: "low", summary: "Umumiy ko'rik uchun terapevtga murojaat qiling.", questions_for_doctor: [] };
    }

    const specialties: string[] = Array.isArray(analysis.specialties) ? analysis.specialties.slice(0, 5) : [];
    if (age != null && age < 18 && !specialties.includes("Pediatr")) specialties.unshift("Pediatr");
    if (specialties.length === 0) specialties.push("Terapevt");

    // Match external doctors by specialty (+ region bias)
    const orFilter = specialties.map((s) => `primary_specialty.ilike.%${s}%`).join(",");
    let q = supabase
      .from("doctors_external")
      .select("id,slug,name,rank,photo_url,rating,reviews_count,experience,primary_specialty,primary_region,clinic_id,latitude,longitude")
      .or(orFilter)
      .order("rating", { ascending: false })
      .order("reviews_count", { ascending: false })
      .limit(12);
    if (region) q = q.ilike("primary_region", `%${region}%`);
    let { data: doctors } = await q;

    if (!doctors || doctors.length === 0) {
      const { data: fallback } = await supabase
        .from("doctors_external")
        .select("id,slug,name,rank,photo_url,rating,reviews_count,experience,primary_specialty,primary_region,clinic_id,latitude,longitude")
        .or(orFilter)
        .order("rating", { ascending: false })
        .limit(12);
      doctors = fallback || [];
    }

    return new Response(JSON.stringify({ analysis: { ...analysis, specialties }, doctors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-doctor-match error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: "Server xatosi. Qayta urinib ko'ring." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
