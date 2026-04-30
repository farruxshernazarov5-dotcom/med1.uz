import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * SaaS Gate — universal access + limit checker.
 *
 * Body:
 * {
 *   module: 'diagnostics',
 *   feature?: 'ai',           // optional feature key
 *   metric?: 'patients',      // optional metric to check & increment
 *   delta?: 1                 // increment amount (default 1)
 * }
 *
 * Returns:
 *   200 { allowed:true, tier, limits, used, remaining }
 *   402 { allowed:false, reason:'limit_exceeded'|'feature_blocked'|'expired'|'no_subscription', upgrade_required:true }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return json({ allowed: false, reason: "unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, srk);

    const { data: auth } = await admin.auth.getUser(token);
    if (!auth?.user) return json({ allowed: false, reason: "unauthorized" }, 401);
    const userId = auth.user.id;

    const body = await req.json().catch(() => ({}));
    const moduleId = String(body.module || "").trim();
    const feature = body.feature ? String(body.feature) : null;
    const metric = body.metric ? String(body.metric) : null;
    const delta = Number(body.delta ?? 1);

    if (!moduleId) return json({ allowed: false, reason: "module_required" }, 400);

    // 1. Get effective subscription
    const { data: subRows } = await admin
      .from("tenant_subscriptions")
      .select("tier,status,expires_at,plan_id,saas_plans(features,limits)")
      .eq("owner_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();

    const tier = subRows?.tier || "free";
    const status = subRows?.status || "active";
    const expiresAt = subRows?.expires_at ? new Date(subRows.expires_at) : null;
    const isExpired = expiresAt ? expiresAt < new Date() : false;

    let features: string[] = [];
    let limits: Record<string, number> = {};

    if (subRows?.saas_plans) {
      const p: any = subRows.saas_plans;
      features = Array.isArray(p.features) ? p.features : [];
      limits = (p.limits || {}) as Record<string, number>;
    } else {
      // Fallback to free plan
      const { data: freePlan } = await admin
        .from("saas_plans")
        .select("features,limits")
        .eq("module_id", moduleId)
        .eq("tier", "free")
        .maybeSingle();
      features = (freePlan?.features as string[]) || [];
      limits = (freePlan?.limits as Record<string, number>) || {};
    }

    if (isExpired) {
      await audit(admin, userId, moduleId, "access_blocked", { reason: "expired", feature, metric });
      return json({ allowed: false, reason: "expired", tier, upgrade_required: true }, 402);
    }

    // 2. Feature check
    if (feature && !features.includes(feature)) {
      await audit(admin, userId, moduleId, "access_blocked", { reason: "feature_blocked", feature });
      return json({ allowed: false, reason: "feature_blocked", tier, feature, upgrade_required: true }, 402);
    }

    // 3. Metric/limit check
    if (metric) {
      const limit = limits[metric];
      const periodStart = new Date();
      periodStart.setDate(1);
      const period = periodStart.toISOString().slice(0, 10);

      const { data: counter } = await admin
        .from("saas_usage_counters")
        .select("id,used")
        .eq("owner_id", userId)
        .eq("module_id", moduleId)
        .eq("metric", metric)
        .eq("period_start", period)
        .maybeSingle();

      const used = counter?.used ?? 0;

      if (limit !== undefined && limit !== -1 && used + delta > limit) {
        await audit(admin, userId, moduleId, "limit_exceeded", { metric, used, limit, delta });
        return json({ allowed: false, reason: "limit_exceeded", tier, metric, used, limit, upgrade_required: true }, 402);
      }

      // Increment counter
      if (counter) {
        await admin.from("saas_usage_counters")
          .update({ used: used + delta, updated_at: new Date().toISOString() })
          .eq("id", counter.id);
      } else {
        await admin.from("saas_usage_counters").insert({
          owner_id: userId, module_id: moduleId, metric, period_start: period, used: delta,
        });
      }

      return json({
        allowed: true, tier, status, features, limits,
        metric, used: used + delta, remaining: limit === -1 ? -1 : (limit - used - delta),
      });
    }

    return json({ allowed: true, tier, status, features, limits });
  } catch (e) {
    console.error("saas-gate error", e);
    return json({ allowed: false, reason: "server_error", error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function audit(admin: any, owner: string, mod: string, action: string, detail: any) {
  try {
    await admin.from("saas_audit_log").insert({
      owner_id: owner, actor_id: owner, module_id: mod, action, detail,
    });
  } catch (e) { console.error("audit fail", e); }
}
