// AI Legal Assistant — shartnomalarni tushuntiradi, xulosa qiladi, xavflarni belgilaydi
import { createAiUsageEvent, getAuthenticatedUserId, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;


interface Body {
  action: "summarize" | "explain_clause" | "risks";
  language: "uz" | "ru" | "en";
  title?: string;
  body?: string;
  clause?: string;
}

const SYSTEM = {
  uz: "Sen MED1.UZ yuridik AI yordamchisisan. Shartnomalarni qisqa, sodda va aniq tushuntirasan. Yuridik atamalarni oddiy tilda. Doimo MED-ALL AI SYSTEM MChJ xizmatlari kontekstida javob ber. Maksimal 300 so'z. Markdown ishlat: **muhim**, ⚠️ xavflar, ✅ huquqlar.",
  ru: "Ты юридический AI-ассистент MED1.UZ. Объясняешь договоры кратко и понятно. Юридические термины — простым языком. Контекст: MED-ALL AI SYSTEM ООО. Макс. 300 слов. Используй markdown: **важно**, ⚠️ риски, ✅ права.",
  en: "You are MED1.UZ legal AI assistant. Explain contracts concisely and clearly. Translate legal jargon to plain language. Context: MED-ALL AI SYSTEM LLC. Max 300 words. Use markdown: **important**, ⚠️ risks, ✅ rights.",
};

const PROMPTS = {
  summarize: {
    uz: (t: string, b: string) => `Quyidagi shartnomaning ASOSIY XULOSASINI ber:\n\n**${t}**\n\n${b.slice(0, 6000)}\n\n--- \nJavob tuzilmasi:\n1. **Maqsad** (1 jumla)\n2. **Tomonlar majburiyatlari** (3-5 nuqta)\n3. ⚠️ **Asosiy xavflar**\n4. ✅ **Foydalanuvchi huquqlari**`,
    ru: (t: string, b: string) => `Дай ОСНОВНОЕ РЕЗЮМЕ договора:\n\n**${t}**\n\n${b.slice(0, 6000)}\n\n---\nСтруктура:\n1. **Цель** (1 предложение)\n2. **Обязательства сторон** (3-5 пунктов)\n3. ⚠️ **Ключевые риски**\n4. ✅ **Права пользователя**`,
    en: (t: string, b: string) => `Provide a CORE SUMMARY of this contract:\n\n**${t}**\n\n${b.slice(0, 6000)}\n\n---\nStructure:\n1. **Purpose** (1 sentence)\n2. **Party obligations** (3-5 points)\n3. ⚠️ **Key risks**\n4. ✅ **User rights**`,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __start = Date.now();
  let __usageId: string | null = null;
  try {
    // Require authentication — burns LOVABLE AI credits
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, language = "uz", title = "", body = "", clause = "" } = (await req.json()) as Body;
    __usageId = await createAiUsageEvent({ userId, serviceId: "legal-assistant", req, model: "google/gemini-1.5-flash" });
    if (!body && !clause) {
      await instrumentError(__usageId, __start, { status: "blocked", errorCode: "bad_request", errorMessage: "body or clause required" });
      return new Response(JSON.stringify({ error: "body or clause required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const lang = (["uz", "ru", "en"].includes(language) ? language : "uz") as "uz" | "ru" | "en";
    const userMsg =
      action === "summarize" ? PROMPTS.summarize[lang](title, body) :
      action === "explain_clause" ? `Tushuntir:\n\n${clause}` :
      `Xavflarni ko'rsat:\n\n${body.slice(0, 6000)}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [{ role: "system", content: SYSTEM[lang] }, { role: "user", content: userMsg }],
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      await instrumentError(__usageId, __start, { status: statusFromHttp(r.status), errorCode: String(r.status), errorMessage: txt.slice(0, 500) });
      return new Response(JSON.stringify({ error: "AI gateway error", detail: txt.slice(0, 300) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const summary = j?.choices?.[0]?.message?.content || "—";
    await instrumentJson(j, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: SYSTEM[lang] }, { role: "user", content: userMsg }]), summary);
    return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("legal-assistant error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
