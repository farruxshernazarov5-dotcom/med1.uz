/**
 * Shared dashboard KPI / stat card.
 * Built on GlowCard — drop into any dashboard page.
 */
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { GlowCard } from "@/components/futuristic";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  delta?: number; // percentage change
  tone?: "blue" | "purple" | "cyan" | "neutral";
  glow?: boolean;
}

const toneIconBg: Record<NonNullable<Props["tone"]>, string> = {
  blue: "bg-[hsl(214,84%,56%)]/20 text-[hsl(214,84%,70%)]",
  purple: "bg-[hsl(250,100%,69%)]/20 text-[hsl(250,100%,80%)]",
  cyan: "bg-cyan-400/15 text-cyan-300",
  neutral: "bg-white/10 text-white/80",
};

const DashboardStatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  delta,
  tone = "blue",
  glow = false,
}: Props) => {
  const positive = (delta ?? 0) >= 0;
  return (
    <GlowCard tone={tone} glow={glow} className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", toneIconBg[tone])}>
          <Icon className="w-5 h-5" />
        </div>
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
              positive
                ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
                : "text-rose-300 bg-rose-400/10 border-rose-400/20"
            )}
          >
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[11px] uppercase tracking-wider text-white/50 mt-3">{label}</p>
      <p className="text-2xl font-heading font-bold text-white mt-1 tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-white/45 mt-1">{hint}</p>}
    </GlowCard>
  );
};

export default DashboardStatCard;
