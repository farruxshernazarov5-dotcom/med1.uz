/**
 * AI Analytics Center — Phase 3 UI components.
 * Bundled together for cohesion; each named export is used by AIAnalyticsPage.
 */
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/futuristic/GlowCard";
import {
  Activity, Users, Zap, Wallet, AlertTriangle, Gauge, DollarSign, CheckCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/hooks/useAdminAnalytics";

const CHANNEL_COLORS: Record<string, string> = {
  web: "#2F80ED",
  hambi: "#7B61FF",
  telegram: "#06b6d4",
  mobile_android: "#22c55e",
  mobile_ios: "#a3a3a3",
  api: "#eab308",
  unknown: "#475569",
};

// ───────────────── Header (date range) ─────────────────
export const PRESETS: { id: string; label: string; days: number }[] = [
  { id: "1d",  label: "Bugun",   days: 1 },
  { id: "7d",  label: "7 kun",   days: 7 },
  { id: "30d", label: "30 kun",  days: 30 },
  { id: "90d", label: "90 kun",  days: 90 },
  { id: "365d",label: "1 yil",   days: 365 },
];

export function AnalyticsHeader({
  range, onChange, liveCount,
}: { range: DateRange; onChange: (r: DateRange) => void; liveCount: number }) {
  const set = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400_000);
    onChange({ from, to });
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">AI Analytics Center</h1>
        <p className="text-white/50 text-sm mt-1">Real-time AI xizmatlar monitoringi</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live · {liveCount} yangi
        </span>
        <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {PRESETS.map((p) => {
            const active = Math.round((range.to.getTime() - range.from.getTime()) / 86400_000) === p.days;
            return (
              <Button key={p.id} variant="ghost" size="sm"
                onClick={() => set(p.days)}
                className={cn("rounded-none text-xs h-8 px-3",
                  active ? "bg-[#2F80ED] text-white hover:bg-[#2F80ED]" : "text-white/70 hover:text-white")}>
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ───────────────── KPI Cards ─────────────────
function Kpi({ icon: Icon, label, value, sub, tone = "blue" }: any) {
  return (
    <GlowCard tone={tone} glow className="min-h-[110px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-white/40 text-[11px] mt-1">{sub}</p>}
        </div>
        <Icon className="w-5 h-5 text-white/40" />
      </div>
    </GlowCard>
  );
}

export function KpiCards({ data, loading }: { data: any; loading: boolean }) {
  const o = (Array.isArray(data) ? data[0] : data) || {};
  const fmt = (n: any) => Number(n ?? 0).toLocaleString("ru-RU");
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Kpi icon={Activity} label="Jami so'rovlar" value={loading ? "…" : fmt(o.total_requests)} sub={`Bugun: ${fmt(o.requests_today)}`} tone="blue" />
      <Kpi icon={Users} label="Foydalanuvchilar" value={loading ? "…" : fmt(o.unique_users)} tone="purple" />
      <Kpi icon={CheckCircle} label="Success rate" value={loading ? "…" : `${Number(o.success_rate ?? 0)}%`} sub={`Xato: ${fmt(o.error_count)}`} tone="cyan" />
      <Kpi icon={Gauge} label="Avg latency" value={loading ? "…" : `${fmt(o.avg_latency_ms)}ms`} sub={`p95: ${fmt(o.p95_latency_ms)}ms`} tone="neutral" />
      <Kpi icon={Zap} label="Jami tokenlar" value={loading ? "…" : fmt(o.total_tokens)} tone="purple" />
      <Kpi icon={DollarSign} label="AI xarajat (USD)" value={loading ? "…" : `$${Number(o.total_cost_usd ?? 0).toFixed(2)}`} tone="cyan" />
      <Kpi icon={Wallet} label="Med Coin sarflandi" value={loading ? "…" : fmt(o.total_cost_credits)} tone="blue" />
      <Kpi icon={AlertTriangle} label="Rate-limited" value={loading ? "…" : fmt(o.rate_limited_count)} tone="neutral" />
    </div>
  );
}

// ───────────────── Services table ─────────────────
export function ServicesTable({ data, loading }: { data: any[]; loading: boolean }) {
  const rows = data ?? [];
  return (
    <GlowCard className="overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">AI xizmatlar reytingi</h3>
        <span className="text-xs text-white/40">{rows.length} ta xizmat</span>
      </div>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead className="text-left text-white/40 text-[11px] uppercase">
            <tr>
              <th className="px-2 py-2">Xizmat</th>
              <th className="px-2 py-2 text-right">So'rov</th>
              <th className="px-2 py-2 text-right">Userlar</th>
              <th className="px-2 py-2 text-right">Success</th>
              <th className="px-2 py-2 text-right">Latency</th>
              <th className="px-2 py-2 text-right">Tokens</th>
              <th className="px-2 py-2 text-right">USD</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {loading && <tr><td colSpan={7} className="px-2 py-6 text-center text-white/40">Yuklanmoqda…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-2 py-6 text-center text-white/40">Ma'lumot yo'q</td></tr>
            )}
            {rows.map((r: any) => (
              <tr key={r.service_id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-2 py-2 font-mono text-xs">{r.service_id}</td>
                <td className="px-2 py-2 text-right">{Number(r.requests).toLocaleString("ru-RU")}</td>
                <td className="px-2 py-2 text-right">{Number(r.unique_users).toLocaleString("ru-RU")}</td>
                <td className="px-2 py-2 text-right">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[11px]",
                    Number(r.success_rate) >= 95 ? "bg-emerald-500/15 text-emerald-300" :
                    Number(r.success_rate) >= 80 ? "bg-amber-500/15 text-amber-300" :
                    "bg-rose-500/15 text-rose-300"
                  )}>{Number(r.success_rate ?? 0)}%</span>
                </td>
                <td className="px-2 py-2 text-right">{Number(r.avg_latency_ms ?? 0)}ms</td>
                <td className="px-2 py-2 text-right">{Number(r.total_tokens ?? 0).toLocaleString("ru-RU")}</td>
                <td className="px-2 py-2 text-right">${Number(r.total_cost_usd ?? 0).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlowCard>
  );
}

// ───────────────── Channel donut ─────────────────
export function ChannelBreakdown({ data, loading }: { data: any[]; loading: boolean }) {
  const rows = (data ?? []).map((r) => ({
    name: r.channel,
    value: Number(r.requests),
    color: CHANNEL_COLORS[r.channel] || "#475569",
  }));
  return (
    <GlowCard className="h-[340px]">
      <h3 className="text-white font-semibold mb-2">Kanallar bo'yicha</h3>
      {loading ? (
        <div className="h-[280px] flex items-center justify-center text-white/40">Yuklanmoqda…</div>
      ) : rows.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-white/40">Ma'lumot yo'q</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
              {rows.map((r, i) => <Cell key={i} fill={r.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#0A2540", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#fff" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </GlowCard>
  );
}

// ───────────────── Usage timeline ─────────────────
export function UsageTimeline({ data, loading, granularity }: { data: any[]; loading: boolean; granularity: string }) {
  const rows = useMemo(() => (data ?? []).map((r) => ({
    bucket: new Date(r.bucket).toLocaleDateString("ru-RU", granularity === "hour" ? { hour: "2-digit", day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "2-digit" }),
    requests: Number(r.requests),
    users: Number(r.unique_users),
  })), [data, granularity]);
  return (
    <GlowCard className="h-[340px]">
      <h3 className="text-white font-semibold mb-2">Vaqt grafigi</h3>
      {loading ? (
        <div className="h-[280px] flex items-center justify-center text-white/40">Yuklanmoqda…</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={rows}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2F80ED" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#2F80ED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="bucket" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#0A2540", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Area type="monotone" dataKey="requests" stroke="#2F80ED" fill="url(#g1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </GlowCard>
  );
}

// ───────────────── Revenue ─────────────────
export function RevenuePanel({ data, loading }: { data: any; loading: boolean }) {
  const r = (Array.isArray(data) ? data[0] : data) || {};
  const fmt = (n: any, c = "") => `${c}${Number(n ?? 0).toLocaleString("ru-RU")}`;
  return (
    <GlowCard>
      <h3 className="text-white font-semibold mb-3">Daromad va Med Coin</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="AI obuna" value={loading ? "…" : fmt(r.ai_payments_total, "UZS ")} sub={`${fmt(r.ai_payments_count)} to'lov`} />
        <Stat label="Platform" value={loading ? "…" : fmt(r.platform_payments_total, "UZS ")} sub={`${fmt(r.platform_payments_count)} to'lov`} />
        <Stat label="Sarflangan Med Coin" value={loading ? "…" : fmt(r.credits_spent)} />
        <Stat label="Sotib olingan Med Coin" value={loading ? "…" : fmt(r.credits_purchased)} />
      </div>
    </GlowCard>
  );
}
function Stat({ label, value, sub }: any) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <p className="text-white/50 text-[11px] uppercase">{label}</p>
      <p className="text-white font-bold text-lg mt-1">{value}</p>
      {sub && <p className="text-white/40 text-[11px]">{sub}</p>}
    </div>
  );
}

// ───────────────── Top users ─────────────────
export function TopUsersList({ data, loading }: { data: any[]; loading: boolean }) {
  const rows = data ?? [];
  return (
    <GlowCard>
      <h3 className="text-white font-semibold mb-3">Top foydalanuvchilar</h3>
      <div className="space-y-2">
        {loading && <div className="text-white/40 text-sm">Yuklanmoqda…</div>}
        {!loading && rows.length === 0 && <div className="text-white/40 text-sm">Ma'lumot yo'q</div>}
        {rows.map((u: any, i: number) => (
          <div key={u.user_id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[#2F80ED]/20 text-[#2F80ED] font-bold text-xs flex items-center justify-center">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-white text-sm truncate">{u.full_name || "—"}</p>
                <p className="text-white/40 text-[11px] truncate">{u.phone || u.user_id?.slice(0, 8)}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white text-sm font-semibold">{Number(u.requests).toLocaleString("ru-RU")}</p>
              <p className="text-white/40 text-[11px]">${Number(u.total_cost_usd ?? 0).toFixed(3)}</p>
            </div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

// ───────────────── Errors ─────────────────
export function ErrorsTable({ data, loading }: { data: any[]; loading: boolean }) {
  const rows = data ?? [];
  return (
    <GlowCard>
      <h3 className="text-white font-semibold mb-3">Xatoliklar tahlili</h3>
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
        {loading && <div className="text-white/40 text-sm">Yuklanmoqda…</div>}
        {!loading && rows.length === 0 && <div className="text-white/40 text-sm">Xatolik yo'q ✨</div>}
        {rows.map((e: any, i: number) => (
          <div key={i} className="flex items-start justify-between gap-2 rounded-lg bg-rose-500/5 border border-rose-500/20 px-3 py-2 text-xs">
            <div className="min-w-0">
              <p className="text-rose-200 font-mono">{e.service_id} · {e.error_code}</p>
              {e.sample_msg && <p className="text-white/50 truncate">{e.sample_msg}</p>}
            </div>
            <span className="text-rose-300 font-bold shrink-0">×{e.occurrences}</span>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}
