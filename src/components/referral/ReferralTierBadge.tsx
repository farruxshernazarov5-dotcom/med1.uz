import { Medal, Award, Trophy, Crown, Gem } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TIER_META: Record<string, { icon: any; color: string; bg: string }> = {
  Bronze: { icon: Medal, color: "#cd7f32", bg: "from-amber-700/20 to-amber-900/10" },
  Silver: { icon: Award, color: "#c0c0c0", bg: "from-slate-300/20 to-slate-500/10" },
  Gold: { icon: Trophy, color: "#ffd700", bg: "from-yellow-400/20 to-yellow-600/10" },
  Platinum: { icon: Crown, color: "#7B61FF", bg: "from-purple-500/20 to-indigo-700/10" },
  VIP: { icon: Gem, color: "#2F80ED", bg: "from-blue-500/20 to-cyan-700/10" },
};

type Props = {
  tier: string;
  current: number;
  nextMin: number;
};

export const ReferralTierBadge = ({ tier, current, nextMin }: Props) => {
  const meta = TIER_META[tier] ?? TIER_META.Bronze;
  const Icon = meta.icon;
  const pct = nextMin > 0 && nextMin < 9999 ? Math.min(100, (current / nextMin) * 100) : 100;

  return (
    <div className={`glass-dark relative overflow-hidden rounded-2xl border border-white/10 p-5 bg-gradient-to-br ${meta.bg}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 ring-1 ring-white/15" style={{ background: `${meta.color}20`, color: meta.color }}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sizning darajangiz</p>
          <p className="text-2xl font-bold" style={{ color: meta.color }}>{tier}</p>
        </div>
      </div>
      {nextMin < 9999 ? (
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{current} / {nextMin} referral</span>
            <span>Keyingi daraja uchun</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">🎉 Eng yuqori darajaga erishdingiz!</p>
      )}
    </div>
  );
};

export default ReferralTierBadge;
