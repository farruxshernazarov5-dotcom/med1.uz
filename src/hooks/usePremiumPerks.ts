import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSaasPlan, type SaaSModuleId } from "@/hooks/useSaasPlan";

export interface PremiumPerk {
  id: string;
  module_id: string;
  tier_required: string;
  category: string;
  title: string;
  description: string | null;
  icon: string | null;
  value_text: string | null;
  badge_text: string | null;
  cta_url: string | null;
  is_active: boolean;
  display_order: number;
  valid_until: string | null;
}

export const TIER_RANK: Record<string, number> = {
  free: 0, starter: 1, pro: 2, enterprise: 3,
};

export function usePremiumPerks(moduleId: SaaSModuleId) {
  const plan = useSaasPlan(moduleId);
  const [perks, setPerks] = useState<PremiumPerk[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("premium_perks" as any)
      .select("*")
      .eq("module_id", moduleId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    setPerks((data as any) || []);
    setLoading(false);
  }, [moduleId]);

  useEffect(() => { reload(); }, [reload]);

  const isUnlocked = (perk: PremiumPerk) =>
    (TIER_RANK[plan.tier] ?? 0) >= (TIER_RANK[perk.tier_required] ?? 1);

  return { perks, loading, plan, isUnlocked, reload };
}
