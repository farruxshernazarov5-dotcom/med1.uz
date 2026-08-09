import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AI_SERVICE_TARIFFS, getServiceCreditCost } from "@/data/aiTariffs";

/** Monthly free-grant quota for any 1-Med-Coin service (server-enforced). */
export const FREE_MONTHLY_GRANT = 2;

export interface AiAccess {
  plan_id: string;
  tier: "free" | "premium" | "pro";
  daily_limit: number;
  monthly_limit: number;
  allowed_services: string[];
  status: string;
  expires_at: string | null;
  used_today: number;
  used_month: number;
}

interface AiAccessState {
  access: AiAccess | null;
  loading: boolean;
  refetch: () => void;
  isServiceAllowed: (serviceId: string) => boolean;
  isLimitReached: () => { reached: boolean; type?: "daily" | "monthly" };
  remainingToday: number;
  remainingMonth: number;
}

const DEFAULT_ACCESS: AiAccess = {
  plan_id: "free",
  tier: "free",
  daily_limit: FREE_MONTHLY_GRANT,
  monthly_limit: 30,
  allowed_services: ["ai-health-assistant", "symptom-checker"],
  status: "active",
  expires_at: null,
  used_today: 0,
  used_month: 0,
};

export function useAiAccess(): AiAccessState {
  const { user, userRole } = useAuth();
  const [access, setAccess] = useState<AiAccess | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccess = useCallback(async () => {
    if (!user) {
      setAccess(DEFAULT_ACCESS);
      setLoading(false);
      return;
    }
    if (userRole === "admin") {
      setAccess({
        plan_id: "super-admin-test",
        tier: "pro",
        daily_limit: 999999,
        monthly_limit: 999999,
        allowed_services: AI_SERVICE_TARIFFS.map((s) => s.id),
        status: "admin_test",
        expires_at: null,
        used_today: 0,
        used_month: 0,
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("get_user_ai_access", { _user_id: user.id });
    if (error) {
      console.error("get_user_ai_access error", error);
      setAccess(DEFAULT_ACCESS);
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      setAccess(row ? {
        plan_id: row.plan_id ?? "free",
        tier: (row.tier ?? "free") as any,
        daily_limit: row.daily_limit ?? FREE_MONTHLY_GRANT,
        monthly_limit: row.monthly_limit ?? 30,
        allowed_services: (row.allowed_services as string[]) ?? DEFAULT_ACCESS.allowed_services,
        status: row.status ?? "active",
        expires_at: row.expires_at ?? null,
        used_today: row.used_today ?? 0,
        used_month: row.used_month ?? 0,
      } : DEFAULT_ACCESS);
    }
    setLoading(false);
  }, [user, userRole]);

  useEffect(() => { fetchAccess(); }, [fetchAccess]);

  const isServiceAllowed = useCallback((serviceId: string) => {
    if (!access) return false;
    if (access.allowed_services.includes(serviceId)) return true;
    // Free monthly grant: any 1-Med-Coin service is unlockable up to 2 times / month.
    if (getServiceCreditCost(serviceId) === 1) return true;
    return false;
  }, [access]);

  const isLimitReached = useCallback(() => {
    if (!access) return { reached: false };
    if (access.used_today >= access.daily_limit) return { reached: true, type: "daily" as const };
    if (access.used_month >= access.monthly_limit) return { reached: true, type: "monthly" as const };
    return { reached: false };
  }, [access]);

  return {
    access,
    loading,
    refetch: fetchAccess,
    isServiceAllowed,
    isLimitReached,
    remainingToday: access ? Math.max(0, access.daily_limit - access.used_today) : 0,
    remainingMonth: access ? Math.max(0, access.monthly_limit - access.used_month) : 0,
  };
}
