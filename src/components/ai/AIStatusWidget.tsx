import { Link } from "react-router-dom";
import { Crown, Zap, Calendar } from "lucide-react";
import { useAiAccess } from "@/hooks/useAiAccess";
import { useCredits } from "@/hooks/useCredits";

/**
 * Compact widget showing tier, remaining daily quota, and credits.
 * Use in AI service page sidebars or headers.
 */
const AIStatusWidget = () => {
  const { access, loading, remainingToday } = useAiAccess();
  const { balance, loading: cLoading } = useCredits();

  if (loading || cLoading || !access) return null;

  const tierColors: Record<string, string> = {
    pro: "from-amber-500 to-orange-500 text-white",
    premium: "from-purple-500 to-fuchsia-500 text-white",
    free: "from-slate-400 to-slate-500 text-white",
  };
  const tierLabel: Record<string, string> = { pro: "Pro", premium: "Premium", free: "Bepul" };

  const dailyPct = Math.min(100, Math.round((access.used_today / Math.max(1, access.daily_limit)) * 100));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarifingiz</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${tierColors[access.tier]}`}>
          <Crown className="w-3 h-3 inline mr-1" />{tierLabel[access.tier]}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" /> Bugungi so'rovlar</span>
          <span className="font-semibold text-foreground">{access.used_today}/{access.daily_limit}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${dailyPct >= 90 ? "bg-rose-500" : dailyPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${dailyPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="flex items-center gap-1.5 text-sm">
          <span className="text-base">🪙</span>
          <span className="font-bold text-foreground">{balance}</span>
          <span className="text-xs text-muted-foreground">Med Coin</span>
        </span>
        <Link to="/ai-payment" className="text-xs font-medium text-primary hover:underline">+ Sotib olish</Link>

      </div>

      {(remainingToday <= 2 || balance <= 5) && (
        <Link to="/ai-subscription" className="block text-center text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg transition">
          Tarifni yangilash →
        </Link>
      )}
    </div>
  );
};

export default AIStatusWidget;
