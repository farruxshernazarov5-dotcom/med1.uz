import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SaaSModuleId =
  | "clinic" | "diagnostics" | "dental" | "pharmacy"
  | "cosmetology" | "maternity" | "medtech" | "bloodbank" | "doctor";

export interface SaaSAccess {
  tier: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "expired" | "cancelled" | "trial";
  expires_at: string | null;
  features: string[];
  limits: Record<string, number>;
  loading: boolean;
}

const DEFAULT: SaaSAccess = {
  tier: "free", status: "active", expires_at: null,
  features: [], limits: {}, loading: true,
};

export function useSaasPlan(moduleId: SaaSModuleId) {
  const [access, setAccess] = useState<SaaSAccess>(DEFAULT);
  const [usage, setUsage] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAccess({ ...DEFAULT, loading: false }); return; }

    const [{ data: sub }, { data: counters }] = await Promise.all([
      supabase.from("tenant_subscriptions")
        .select("tier,status,expires_at,saas_plans(features,limits)")
        .eq("owner_id", user.id).eq("module_id", moduleId).maybeSingle(),
      supabase.from("saas_usage_counters")
        .select("metric,used,period_start")
        .eq("owner_id", user.id).eq("module_id", moduleId),
    ]);

    let features: string[] = []; let limits: Record<string, number> = {};
    let tier: any = "free"; let status: any = "active"; let expires_at: any = null;

    if (sub?.saas_plans) {
      const p: any = sub.saas_plans;
      features = Array.isArray(p.features) ? p.features : [];
      limits = (p.limits || {}) as Record<string, number>;
      tier = sub.tier; status = sub.status; expires_at = sub.expires_at;
    } else {
      const { data: free } = await supabase.from("saas_plans")
        .select("features,limits").eq("module_id", moduleId).eq("tier", "free").maybeSingle();
      features = (free?.features as string[]) || [];
      limits = (free?.limits as Record<string, number>) || {};
    }

    const isExpired = expires_at ? new Date(expires_at) < new Date() : false;
    if (isExpired) status = "expired";

    setAccess({ tier, status, expires_at, features, limits, loading: false });

    const period = new Date(); period.setDate(1);
    const periodStr = period.toISOString().slice(0, 10);
    const usageMap: Record<string, number> = {};
    (counters || []).forEach((c: any) => {
      if (c.period_start === periodStr) usageMap[c.metric] = c.used;
    });
    setUsage(usageMap);
  }, [moduleId]);

  useEffect(() => { reload(); }, [reload]);

  const isFeatureAllowed = (feature: string) => {
    if (access.status === "expired") return false;
    return access.features.includes(feature);
  };

  const getLimit = (metric: string) => access.limits[metric] ?? 0;
  const getUsed = (metric: string) => usage[metric] ?? 0;
  const getRemaining = (metric: string) => {
    const l = getLimit(metric);
    if (l === -1) return Infinity;
    return Math.max(0, l - getUsed(metric));
  };
  const isOverLimit = (metric: string) => getRemaining(metric) <= 0;

  /** Server-side gate. Returns true if allowed, false if blocked (and shows upgrade reason). */
  const checkGate = async (opts: { feature?: string; metric?: string; delta?: number }) => {
    const { data, error } = await supabase.functions.invoke("saas-gate", {
      body: { module: moduleId, ...opts },
    });
    if (error) return { allowed: false, reason: "network_error" as const };
    return data as { allowed: boolean; reason?: string; tier?: string; metric?: string; used?: number; limit?: number; feature?: string; upgrade_required?: boolean };
  };

  return {
    ...access, usage,
    isFeatureAllowed, getLimit, getUsed, getRemaining, isOverLimit,
    checkGate, reload,
  };
}
