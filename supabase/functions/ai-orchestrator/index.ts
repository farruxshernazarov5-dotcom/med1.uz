// AI Orchestrator / Router — Faza 3
// Foydalanuvchi so'rovini tahlil qilib eng mos ixtisoslashgan AI modulga yo'naltiradi.
// Yengil klassifikator (Gemini 2.5 Flash, 1 Med Coin).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess, refundAiCredits } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, detectLangFromText, normalizeLang } from "../_shared/lang.ts";
import { parseAiJsonObject } from "../_shared/json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODULES = [
  { id: "ai-doctor-chat",            route: "/ai-doctor-chat",            title: "AI Shifokor (umumiy)",         keywords: "umumiy shifokor, savol-javob, konsultatsiya" },
  { id: "symptom-checker",           route: "/symptom-checker",           title: "Simptom tekshirgich",          keywords: "simptom, belgi, og'riq, holat" },
  { id: "ai-farmatsevt",             route: "/ai-farmatsevt",             title: "AI Farmatsevt",                keywords: "dori, preparat, retsept, dozirovka" },
  { id: "ai-psixolog",               route: "/ai-psixolog",               title: "AI Psixolog",                  keywords: "stress, depressiya, hissiyot, xavotir, uyqu" },
  { id: "ai-dietolog",               route: "/ai-dietolog",               title: "AI Dietolog",                  keywords: "ratsion, ovqat, vazn, kaloriya" },
  { id: "ai-fitness",                route: "/ai-fitness",                title: "AI Fitness",                   keywords: "sport, mashq, mushak, jismoniy" },
  { id: "ai-baby-care",              route: "/ai-baby-care",              title: "AI Bola parvarishi",           keywords: "chaqaloq, bola, emizish, pediatriya" },
  { id: "ai-pregnancy",              route: "/ai-pregnancy",              title: "AI Homiladorlik",              keywords: "homila, hafta, hml, tug'ish" },
  { id: "ai-diabetes",               route: "/ai-diabetes",               title: "AI Diabet",                    keywords: "qand, glyukoza, insulin, HbA1c, diabet" },
  { id: "ai-oncology",               route: "/ai-oncology",               title: "AI Onkologiya",                keywords: "o'sma, rak, onkologiya, ximiya, biopsiya" },
  { id: "ai-cosmetology",            route: "/ai-cosmetology",            title: "AI Kosmetologiya",             keywords: "teri, yuz, ajin, kosmetika, botoks" },
  { id: "ai-health-risk",            route: "/ai-health-risk",            title: "AI Salomatlik xavfi",          keywords: "yurak, xolesterin, xavf tahlili" },
  { id: "ai-report-analysis",        route: "/ai-report-analysis",        title: "AI Analiz natijasi (labor)",   keywords: "analiz, laboratoriya, qon, siydik, natija" },
  { id: "ai-radiology",              route: "/ai-radiology",              title: "AI Radiologiya (umumiy)",      keywords: "rentgen, MRT, KT, tasvir" },
  { id: "ai-radiology-pulmonology",  route: "/ai-radiology/pulmonology",  title: "Radiology · Pulmonologiya",    keywords: "o'pka, TB, pnevmoniya, COVID" },
  { id: "ai-radiology-brain",        route: "/ai-radiology/brain",        title: "Radiology · Miya",             keywords: "miya, insult, MRI, bosh" },
  { id: "ai-radiology-bone",         route: "/ai-radiology/bone",         title: "Radiology · Suyak-Skelet",     keywords: "sinish, suyak, bo'g'im, travma" },
  { id: "ai-radiology-chest-ct",     route: "/ai-radiology/chest-ct",     title: "Radiology · Ko'krak KT",       keywords: "ko'krak KT, HRCT, PE, nodul" },
  { id: "ai-radiology-mammography",  route: "/ai-radiology/mammography",  title: "Radiology · Mammografiya",     keywords: "meme, ko'krak, BI-RADS, tugun" },
  { id: "ai-radiology-abdomen",      route: "/ai-radiology/abdomen",      title: "Radiology · Qorin",            keywords: "jigar, buyrak, oshqozon, appenditsit" },
  { id: "ai-radiology-spine",        route: "/ai-radiology/spine",        title: "Radiology · Umurtqa",          keywords: "umurtqa, churra, radikulopatiya, disk" },
];

const SYSTEM_PROMPT = `Sen Med1.uz AI orchestrator (router)sisan. Foydalanuvchi so'rovini o'qib, PLATFORMADAGI eng mos 1 ta modulga yo'naltirasan.

MAVJUD MODULLAR (id — tavsif):
${MODULES.map(m => `- ${m.id}: ${m.title} — ${m.keywords}`).join("\n")}

QOIDALAR:
1) FAQAT yuqoridagi id lardan birini tanla.
2) Agar so'rov tibbiy tasvir (rentgen/MRT/KT/mammografiya) haqida bo'lsa — mos radiology-* sub-modulini tanla.
3) Agar so'rov aniq bir yo'nalishga tegishli bo'lmasa — "ai-doctor-chat" ni tanla.
4) Ishonchli emas bo'lsa (confidence < 0.4) — muqobil (alt) modulni ham ber.

FAQAT valid JSON qaytar (markdown, izoh, salomlashish yo'q):
{"module":"<id>","alt":"<id-yoki-null>","confidence":0.0-1.0,"reason":"<qisqa sabab foydalanuvchi tilida>"}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;
  let __userId: string | null = null;
  const serviceId = "ai-orchestrator";

  try {
    const access = await enforceAiAccess(req, serviceId);
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;
    __userId = access.userId;

    const body = await req.json();
    const query: string = (body?.query ?? body?.text ?? "").toString().trim();
    if (!query) {
      return new Response(JSON.stringify({ error: "So'rov matni bo'sh" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = detectLangFromText(query) ?? normalizeLang(body?.lang);
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY yo'q");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_completion_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + languageInstruction(lang) },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `Gateway ${status}` });
      if (__userId) await refundAiCredits(__userId, serviceId, 1, `Gateway ${status}`);
      const errMsg = status === 429 ? "So'rov limiti oshdi" : status === 402 ? "Xizmat vaqtincha mavjud emas" : "AI xizmat xatosi";
      return new Response(JSON.stringify({ error: errMsg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseAiJsonObject(content) ?? {};
    let moduleId = String((parsed as any).module ?? "ai-doctor-chat");
    const alt = (parsed as any).alt ? String((parsed as any).alt) : null;
    const confidence = Number((parsed as any).confidence ?? 0.5);
    const reason = String((parsed as any).reason ?? "");

    const known = MODULES.find(m => m.id === moduleId);
    const chosen = known ?? MODULES.find(m => m.id === "ai-doctor-chat")!;
    if (!known) moduleId = chosen.id;
    const altMod = alt ? MODULES.find(m => m.id === alt) : null;

    await instrumentJson(data, __usageId, __start, 0, content);

    return new Response(JSON.stringify({
      module: { id: chosen.id, route: chosen.route, title: chosen.title },
      alt: altMod ? { id: altMod.id, route: altMod.route, title: altMod.title } : null,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5,
      reason,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-orchestrator error", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    if (__userId) await refundAiCredits(__userId, serviceId, 1, e instanceof Error ? e.message : "err");
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
