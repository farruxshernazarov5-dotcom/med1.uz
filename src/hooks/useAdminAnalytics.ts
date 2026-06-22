import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DateRange = { from: Date; to: Date };

const iso = (d: Date) => d.toISOString();

function useRpc<T = any>(name: string, args: Record<string, any>, range: DateRange) {
  return useQuery({
    queryKey: [name, iso(range.from), iso(range.to), JSON.stringify(args)],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(name as any, args as any);
      if (error) throw error;
      return (data ?? []) as T;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAnalyticsOverview(range: DateRange) {
  return useRpc("analytics_overview", { _from: iso(range.from), _to: iso(range.to) }, range);
}
export function useAnalyticsByService(range: DateRange) {
  return useRpc("analytics_by_service", { _from: iso(range.from), _to: iso(range.to) }, range);
}
export function useAnalyticsByChannel(range: DateRange) {
  return useRpc("analytics_by_channel", { _from: iso(range.from), _to: iso(range.to) }, range);
}
export function useAnalyticsTimeseries(range: DateRange, granularity: "hour" | "day" | "month" = "day") {
  return useRpc("analytics_timeseries", { _from: iso(range.from), _to: iso(range.to), _granularity: granularity }, range);
}
export function useAnalyticsRevenue(range: DateRange) {
  return useRpc("analytics_revenue", { _from: iso(range.from), _to: iso(range.to) }, range);
}
export function useAnalyticsTopUsers(range: DateRange, limit = 10) {
  return useRpc("analytics_top_users", { _from: iso(range.from), _to: iso(range.to), _limit: limit }, range);
}
export function useAnalyticsByRegion(range: DateRange) {
  return useRpc("analytics_by_region", { _from: iso(range.from), _to: iso(range.to) }, range);
}
export function useAnalyticsErrors(range: DateRange) {
  return useRpc("analytics_error_breakdown", { _from: iso(range.from), _to: iso(range.to) }, range);
}

/** Realtime live counter — subscribes to ai_usage INSERT events. */
export function useLiveAiUsage(onInsert: (row: any) => void) {
  useEffect(() => {
    const ch = supabase
      .channel("admin-ai-usage-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_usage" }, (payload) => {
        onInsert(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [onInsert]);
}
