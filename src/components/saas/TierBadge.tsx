import { Crown, Sparkles, Star, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaaSTier = "free" | "starter" | "pro" | "enterprise";

export const TIER_THEME: Record<SaaSTier, {
  label: string;
  icon: typeof Crown;
  chip: string;
  ring: string;
  accentText: string;
  order: number;
}> = {
  free: {
    label: "Bepul",
    icon: Gift,
    chip: "bg-slate-500/15 text-slate-300 border-slate-400/30",
    ring: "ring-slate-400/20",
    accentText: "text-slate-300",
    order: 0,
  },
  starter: {
    label: "Starter",
    icon: Star,
    chip: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    ring: "ring-sky-400/30",
    accentText: "text-sky-300",
    order: 1,
  },
  pro: {
    label: "Pro",
    icon: Sparkles,
    chip: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    ring: "ring-violet-400/30",
    accentText: "text-violet-300",
    order: 2,
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    chip: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    ring: "ring-amber-400/30",
    accentText: "text-amber-300",
    order: 3,
  },
};

export const tierOrder = (tier?: string | null) =>
  TIER_THEME[(tier as SaaSTier) in TIER_THEME ? (tier as SaaSTier) : "free"].order;

/** True when the user's current tier is enough for the required tier. */
export const tierSatisfies = (current?: string | null, required?: string | null) =>
  !required || tierOrder(current) >= tierOrder(required);

interface TierBadgeProps {
  tier?: string | null;
  status?: string | null;
  className?: string;
}

const TierBadge = ({ tier, status, className }: TierBadgeProps) => {
  const key: SaaSTier = (tier as SaaSTier) in TIER_THEME ? (tier as SaaSTier) : "free";
  const theme = TIER_THEME[key];
  const Icon = theme.icon;
  const expired = status === "expired";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold",
        expired ? "bg-red-500/15 text-red-300 border-red-400/30" : theme.chip,
        className
      )}
      title={expired ? "Tarif muddati tugagan" : `Joriy tarif: ${theme.label}`}
    >
      <Icon className="w-3 h-3" />
      {expired ? "Muddati tugagan" : theme.label}
    </span>
  );
};

export default TierBadge;
