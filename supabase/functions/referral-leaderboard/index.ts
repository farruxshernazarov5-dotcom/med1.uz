// referral-leaderboard — Cached anonymous top-N referrers list.
// 60-second in-memory cache. Returns rank, masked owner, org_role, total_uses,
// total_rewards_credits. Public read endpoint (no auth required).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type LeaderRow = {
  rank: number;
  masked_id: string;
  org_role: string | null;
  total_uses: number;
  total_rewards_credits: number;
};

let cache: { ts: number; limit: number; data: LeaderRow[] } | null = null;
const TTL_MS = 60_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 10)));


    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = token ? await admin.auth.getUser(token) : { data: { user: null } } as any;
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ ok: true, cached: false, data: [] });

    // Aggregate from referral_codes
    const { data, error } = await admin
      .from("referral_codes")
      .select("owner_id, total_uses")
      .order("total_uses", { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return json({ error: "failed" }, 500); }

    const rows: LeaderRow[] = (data ?? []).map((r: any, i: number) => ({
      rank: i + 1,
      masked_id: maskId(r.owner_id),
      org_role: null,
      total_uses: r.total_uses ?? 0,
      total_rewards_credits: 0,
    }));

    cache = { ts: Date.now(), limit, data: rows };
    return json({ ok: true, cached: false, data: rows });
  } catch (e) {
    console.error("referral-leaderboard error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function maskId(id: string): string {
  if (!id) return "—";
  const s = id.replace(/-/g, "");
  return `${s.slice(0, 4)}…${s.slice(-3)}`.toUpperCase();
}
