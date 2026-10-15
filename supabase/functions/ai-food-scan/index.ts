import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PROMPT = `Sen sport dietologisan. Rasmdagi ovqat yoki qadoqlangan mahsulotni (yorliq bo'lsa undagi qiymatlarni o'qib) aniqla.
Faqat JSON qaytar, boshqa matn yo'q:
{"items":[{"name":"o'zbekcha nom","grams":number,"kcal":number,"protein":number,"fat":number,"carbs":number}],
"total":{"kcal":number,"protein":number,"fat":number,"carbs":number},
"health_score":1-10,"verdict":"1 gap baho","tips":["2-4 qisqa tavsiya maqsadga ko'ra"],"alternatives":["sog'lomroq muqobil 1-3"]}
Porsiya hajmini idish/qo'l o'lchamidan taxmin qil. Ovqat bo'lmasa items bo'sh ro'yxat va verdict da sababini yoz.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const start = Date.now();
  let usageId: string | null = null;
  try {
    const body = await req.json().catch(() => null);
    const image = typeof body?.image === "string" ? body.image : "";
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 6_000_000) return json({ error: "Rasm noto'g'ri yoki juda katta" }, 400);
    const goal = String(body?.goal ?? "general").slice(0, 30).replace(/[^\w-]/g, "");
    const note = String(body?.note ?? "").replace(/[\r\n`<>{}]/g, " ").slice(0, 200);

    const access = await enforceAiAccess(req, "ai-fitness");
    if (!access.allowed) return json({ error: access.error }, access.status);
    usageId = access.usageId ?? null;
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model,
        messages: [
          { role: "system", content: PROMPT },
          { role: "user", content: [
            { type: "text", text: `Maqsad: ${goal}. ${note ? "Izoh (faqat ma'lumot): " + note : ""}` },
            { type: "image_url", image_url: { url: image } },
          ] },
        ],
      }),
    });
    if (!r.ok) {
      await instrumentError(usageId, start, { status: statusFromHttp(r.status), errorCode: String(r.status) });
      return json({ error: r.status === 429 ? "Juda ko'p so'rov, biroz kuting" : r.status === 402 ? "AI kreditlari tugagan" : "AI xatosi" }, r.status === 429 || r.status === 402 ? r.status : 502);
    }
    const data = await r.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    let parsed: any = null;
    try { parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
    if (!parsed) return json({ error: "Rasmni tahlil qilib bo'lmadi, qayta urinib ko'ring" }, 422);
    const t = parsed.total ?? {};
    const summary = `🍽 **Ovqat skaneri**\n\n${(parsed.items ?? []).map((i: any) => `- ${i.name} (~${i.grams} g): ${i.kcal} kkal, O ${i.protein} g, Y ${i.fat} g, U ${i.carbs} g`).join("\n")}\n\n**Jami:** ${t.kcal} kkal · Oqsil ${t.protein} g · Yog' ${t.fat} g · Uglevod ${t.carbs} g\n\n**Baho:** ${parsed.health_score}/10 — ${parsed.verdict}\n\n${(parsed.tips ?? []).map((x: string) => `- ${x}`).join("\n")}`;
    await instrumentJson(data, usageId, start, 800, summary);
    return json({ ...parsed, credits: access.creditsDeducted });
  } catch (e) {
    await instrumentError(usageId, start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : String(e) });
    return json({ error: "Server xatosi" }, 500);
  }
});
