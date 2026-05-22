/**
 * partner-track — logs HAMBI/UNITEL Web-View visits and conversions.
 *
 * Events:
 *  - visit:      record landing in partner_visits
 *  - conversion: record signup/subscription/payment in partner_conversions
 *                and auto-calculate revshare based on partner_sources.revshare_percent
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const hash = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event, source_slug } = body ?? {};
    if (!event || !source_slug) {
      return new Response(JSON.stringify({ error: "event and source_slug required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate partner exists & active
    const { data: partner } = await supabase
      .from("partner_sources")
      .select("slug,revshare_percent,is_active")
      .eq("slug", source_slug)
      .maybeSingle();

    if (!partner || !partner.is_active) {
      return new Response(JSON.stringify({ error: "unknown or inactive partner" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const ip_hash = await hash(ip);

    if (event === "visit") {
      const { data, error } = await supabase
        .from("partner_visits")
        .insert({
          source_slug,
          session_id: body.session_id ?? null,
          user_id: body.user_id ?? null,
          landing_path: body.landing_path ?? null,
          referrer: body.referrer ?? null,
          user_agent: body.user_agent ?? null,
          ip_hash,
          utm: body.utm ?? {},
        })
        .select("id")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, visit_id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "conversion") {
      // Find latest visit by session for attribution
      let visit_id: string | null = null;
      if (body.session_id) {
        const { data: v } = await supabase
          .from("partner_visits")
          .select("id")
          .eq("source_slug", source_slug)
          .eq("session_id", body.session_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        visit_id = v?.id ?? null;
      }

      const amount = Number(body.amount ?? 0);
      const revshare_amount = +(amount * (Number(partner.revshare_percent ?? 0) / 100)).toFixed(2);

      const { data, error } = await supabase
        .from("partner_conversions")
        .insert({
          source_slug,
          visit_id,
          user_id: body.user_id ?? null,
          conversion_type: body.conversion_type ?? "signup",
          module: body.module ?? null,
          tier: body.tier ?? null,
          amount,
          currency: body.currency ?? "UZS",
          revshare_amount,
          status: amount > 0 ? "confirmed" : "pending",
          meta: body.meta ?? {},
        })
        .select("id")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, conversion_id: data.id, revshare_amount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown event" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
