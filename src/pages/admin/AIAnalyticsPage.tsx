import { useCallback, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import {
  useAnalyticsOverview, useAnalyticsByService, useAnalyticsByChannel,
  useAnalyticsTimeseries, useAnalyticsRevenue, useAnalyticsTopUsers,
  useAnalyticsErrors, useLiveAiUsage, type DateRange,
} from "@/hooks/useAdminAnalytics";
import {
  AnalyticsHeader, KpiCards, ServicesTable, ChannelBreakdown,
  UsageTimeline, RevenuePanel, TopUsersList, ErrorsTable,
} from "@/components/admin/analytics/AnalyticsComponents";

const initialRange = (): DateRange => {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86400_000);
  return { from, to };
};

const AIAnalyticsPage = () => {
  const { user, loading, userRole } = useAuth();
  const [range, setRange] = useState<DateRange>(initialRange());
  const [liveCount, setLiveCount] = useState(0);

  const granularity = (() => {
    const days = Math.round((range.to.getTime() - range.from.getTime()) / 86400_000);
    if (days <= 2) return "hour" as const;
    if (days >= 120) return "month" as const;
    return "day" as const;
  })();

  const overview = useAnalyticsOverview(range);
  const byService = useAnalyticsByService(range);
  const byChannel = useAnalyticsByChannel(range);
  const timeseries = useAnalyticsTimeseries(range, granularity);
  const revenue = useAnalyticsRevenue(range);
  const topUsers = useAnalyticsTopUsers(range, 10);
  const errors = useAnalyticsErrors(range);

  useLiveAiUsage(useCallback(() => setLiveCount((n) => n + 1), []));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="animate-spin w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin") return <Navigate to={`/dashboard/${userRole || "patient"}`} replace />;

  return (
    <div className="min-h-screen bg-[#0A2540] bg-grid-tech">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-5">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Admin paneli
        </Link>

        <AnalyticsHeader range={range} onChange={(r) => { setRange(r); setLiveCount(0); }} liveCount={liveCount} />
        <KpiCards data={overview.data} loading={overview.isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <UsageTimeline data={timeseries.data} loading={timeseries.isLoading} granularity={granularity} />
          </div>
          <ChannelBreakdown data={byChannel.data} loading={byChannel.isLoading} />
        </div>

        <ServicesTable data={byService.data} loading={byService.isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenuePanel data={revenue.data} loading={revenue.isLoading} />
          <TopUsersList data={topUsers.data} loading={topUsers.isLoading} />
        </div>

        <ErrorsTable data={errors.data} loading={errors.isLoading} />
      </div>
    </div>
  );
};

export default AIAnalyticsPage;
