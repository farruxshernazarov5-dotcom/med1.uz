// referral-apply — Validate a referral code and attach it to the current user.
// Performs anti-fraud checks (self-referral, duplicate attach, IP/device cap)
// and inserts a `referrals` row with status='registered'. Returns the referrer info.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ApplyBody {
  code?: string;
  source?: string;
  device_fp?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as ApplyBody;
    const code = (body.code ?? "").toString().trim().toUpperCase();
    if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
      return json({ error: "invalid_code_format" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // 1) Lookup code
    const { data: rc } = await admin
      .from("referral_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();
    if (!rc) return json({ error: "code_not_found" }, 404);

    // 2) Block self-referral
    if (rc.owner_id === u.user.id) {
      await admin.from("referral_fraud_log").insert({
        kind: "self_referral", severity: "low",
        notes: `Self-referral attempt by ${u.user.id} on code ${code}`,
      });
      return json({ error: "self_referral_blocked" }, 403);
    }

    // 3) Prevent duplicate attach (already has a referral)
    const { data: existing } = await admin
      .from("referrals")
      .select("id, status")
      .eq("referred_user_id", u.user.id)
      .maybeSingle();
    if (existing) {
      return json({ ok: true, status: existing.status, referral_id: existing.id, deduped: true });
    }

    // 4) Soft IP/device cap (settings.ip_device_limit)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const fp = body.device_fp || "unknown";
    const { data: settings } = await admin.from("referral_settings").select("ip_device_limit").eq("id", 1).maybeSingle();
    const limit = settings?.ip_device_limit ?? 3;
    const { count } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("code_id", rc.id)
      .contains("meta", { ip });
    if ((count ?? 0) >= limit) {
      await admin.from("referral_fraud_log").insert({
        kind: "ip_device_cap_exceeded", severity: "medium",
        notes: `IP ${ip} exceeded limit ${limit} for code ${code}`,
      });
      return json({ error: "ip_cap_exceeded" }, 429);
    }

    // 5) Insert referral
    const { data: inserted, error: insErr } = await admin
      .from("referrals")
      .insert({
        code_id: rc.id,
        code_text: rc.code,
        referrer_id: rc.owner_id,
        referred_user_id: u.user.id,
        referred_email: u.user.email,
        referred_org_role: u.user.user_metadata?.role ?? "patient",
        status: "registered",
        registered_at: new Date().toISOString(),
        meta: { ip, device_fp: fp, source: body.source ?? null },
      })
      .select()
      .single();
    if (insErr) { console.error("referral-apply insert error:", insErr); return json({ error: "Internal server error" }, 500); }

    // 6) Bump counters
    await admin
      .from("referral_codes")
      .update({
        total_clicks: (rc.total_clicks ?? 0) + 1,
        total_signups: (rc.total_signups ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rc.id);

    // 7) Notify referrer (in-app)
    await admin.from("referral_notifications").insert({
      user_id: rc.owner_id,
      type: "new_referral",
      title: "Yangi referral!",
      body: `${u.user.email ?? "Yangi foydalanuvchi"} sizning kodingiz orqali ro'yxatdan o'tdi`,
      data: { referral_id: inserted.id, code },
    });

    return json({ ok: true, referral_id: inserted.id, referrer_id: rc.owner_id });
  } catch (e) {
    console.error("referral-apply error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
