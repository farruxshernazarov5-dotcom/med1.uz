import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MODEL = "google/gemini-2.5-flash-lite";

const langName = (l: string) => (l === "ru" ? "rus" : l === "en" ? "ingliz" : "o'zbek");

const callAi = async (system: string, user: string, maxTokens = 500) => {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("AI kalit sozlanmagan");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("So'rovlar limiti — birozdan so'ng urinib ko'ring");
  if (res.status === 402) throw new Error("AI balansi tugagan");
  if (!res.ok) throw new Error(`AI xatolik: ${res.status}`);
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Tizimga kirish talab qilinadi" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "moderate");
    const lang = String(body?.lang || "uz");

    if (action === "moderate") {
      const campaignId = String(body?.campaign_id || "");
      if (!campaignId) return json({ error: "campaign_id kerak" }, 400);

      const { data: ad, error } = await admin
        .from("med1_ad_campaigns")
        .select("id, owner_id, title, brand_name, description, website_url, specialty, entity_type")
        .eq("id", campaignId)
        .maybeSingle();
      if (error || !ad) return json({ error: "Reklama topilmadi" }, 404);

      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (ad.owner_id !== userId && !isAdmin) return json({ error: "Ruxsat yo'q" }, 403);

      // duplicate URL detection
      let duplicate = false;
      if (ad.website_url) {
        const { count } = await admin
          .from("med1_ad_campaigns")
          .select("id", { count: "exact", head: true })
          .eq("website_url", ad.website_url)
          .neq("id", ad.id)
          .in("status", ["active", "approved", "pending"]);
        duplicate = (count ?? 0) > 0;
      }

      const system = `Sen Med1.uz tibbiy reklama moderatorisan. O'zbekiston reklama va tibbiyot qonunchiligiga amal qil.
Taqiqlangan: yolg'on tibbiy va'dalar, "100% davolaydi", kafolatlangan natija, noqonuniy dori, taqiqlangan xizmat, soxta shifokor/klinika, manipulyativ tibbiy da'volar, retsept dorilarni targ'ib qilish.
FAQAT quyidagi JSON qaytar, boshqa matn yozma:
{"decision":"approve|flag|reject","score":0-100,"flags":["qisqa sabab"],"note":"1 jumla ${langName(lang)} tilida"}`;

      const raw = await callAi(
        system,
        JSON.stringify({
          title: ad.title,
          brand: ad.brand_name,
          description: ad.description,
          specialty: ad.specialty,
          type: ad.entity_type,
          website: ad.website_url,
        }),
        400,
      );

      let parsed: { decision?: string; score?: number; flags?: string[]; note?: string } = {};
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { decision: "flag", score: 50, flags: ["ai_parse_error"], note: "Qo'lda tekshirish talab qilinadi" };
      }

      const flags = [...(parsed.flags ?? [])];
      if (duplicate) flags.push("duplicate_url");
      const decision = parsed.decision === "reject" ? "rejected" : flags.length > 0 ? "ai_flagged" : "pending";

      await admin
        .from("med1_ad_campaigns")
        .update({
          ai_score: Number(parsed.score ?? 0),
          ai_flags: flags,
          moderation_notes: parsed.note ?? null,
          status: decision,
        })
        .eq("id", ad.id);

      return json({ ok: true, decision, flags, score: parsed.score ?? 0, note: parsed.note ?? "" });
    }

    if (action === "advise") {
      // Real statistics only — AI must reason on supplied numbers.
      const { data: stats } = await admin
        .from("med1_ad_campaigns")
        .select("placement_id, region, bid_amount, impressions, clicks, status")
        .eq("status", "active")
        .limit(300);

      const system = `Sen Med1.uz reklama analitigisan. FAQAT berilgan real raqamlarga tayan, hech narsa o'ylab topma.
Reklama beruvchiga qaysi TOP o'rin foydaliroq ekanini 3-5 qisqa jumlada ${langName(lang)} tilida tushuntir.
CTR = kliklar / ko'rishlar. Narx va raqobat darajasini solishtir. Aniq tavsiya ber.`;

      const advice = await callAi(
        system,
        JSON.stringify({
          selected_placement: body?.placement_code,
          region: body?.region,
          specialty: body?.specialty,
          budget: body?.budget,
          auction: body?.auction ?? [],
          active_campaign_stats: (stats ?? []).map((s) => ({
            placement_id: s.placement_id,
            region: s.region,
            bid: s.bid_amount,
            impressions: s.impressions,
            clicks: s.clicks,
          })),
        }),
        500,
      );

      return json({ ok: true, advice });
    }

    return json({ error: "Noma'lum action" }, 400);
  } catch (err) {
    console.error("med1-ad-review error:", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
