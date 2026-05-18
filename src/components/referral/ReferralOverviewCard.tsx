import { Users, TrendingUp, Coins, Calendar, Sparkles } from "lucide-react";
import type { ReferralStats } from "@/hooks/useReferral";

const Card = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="glass-dark relative overflow-hidden rounded-2xl border border-white/10 p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="rounded-xl p-2 ring-1 ring-white/10" style={{ background: `${color}15`, color }}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-2xl" style={{ background: `${color}30` }} />
  </div>
);

export const ReferralOverviewCard = ({ stats }: { stats: ReferralStats | null }) => {
  const s = stats ?? {
    total_invites: 0, pending_count: 0, subscribed_count: 0, approved_count: 0,
    conversion_rate: 0, total_credits: 0, total_months: 0, total_ai_credits: 0,
    current_tier: "Bronze", next_tier_min: 5,
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card icon={Users} label="Jami taklif" value={s.total_invites} sub={`${s.pending_count} kutilmoqda`} color="#2F80ED" />
      <Card icon={TrendingUp} label="Konversiya" value={`${s.conversion_rate}%`} sub={`${s.subscribed_count} obuna oldi`} color="#22D3EE" />
      <Card icon={Coins} label="Daromad (credits)" value={s.total_credits.toLocaleString()} sub="Hamyoningizda" color="#7B61FF" />
      <Card icon={Calendar} label="Bonus oylar" value={s.total_months} sub={`+ ${s.total_ai_credits} AI credits`} color="#10B981" />
    </div>
  );
};

export default ReferralOverviewCard;
