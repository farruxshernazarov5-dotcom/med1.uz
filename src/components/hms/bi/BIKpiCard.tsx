import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEALTH_TEXT, Health } from "@/lib/clinicBI";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  delta?: number | null;
  health?: Health;
  hint?: string;
  onClick?: () => void;
}

const HEALTH_RING: Record<Health, string> = {
  good: "border-emerald-500/30 before:bg-emerald-500",
  warn: "border-amber-500/40 before:bg-amber-500",
  bad: "border-rose-500/40 before:bg-rose-500",
};

const BIKpiCard = ({ icon: Icon, label, value, suffix, delta, health = "good", hint, onClick }: Props) => {
  const up = (delta ?? 0) > 0;
  const flat = delta === null || delta === undefined || Math.abs(delta) < 0.05;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "relative overflow-hidden text-left w-full rounded-2xl border bg-card/70 backdrop-blur-xl p-4 shadow-sm transition-all",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:content-['']",
        HEALTH_RING[health],
        onClick && "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
            flat ? "text-muted-foreground border-border"
              : up ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
              : "text-rose-600 border-rose-500/30 bg-rose-500/10"
          )}
        >
          {flat ? <Minus className="w-3 h-3" /> : up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {flat ? "—" : `${Math.abs(delta!).toFixed(1)}%`}
        </span>
      </div>
      <p className="mt-3 text-xl font-bold text-foreground tracking-tight break-all">
        {value}
        {suffix && <span className="text-xs font-medium text-muted-foreground ml-1">{suffix}</span>}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[10px] text-muted-foreground/70 mt-1">{hint || HEALTH_TEXT[health]}</p>
    </button>
  );
};

export default BIKpiCard;
