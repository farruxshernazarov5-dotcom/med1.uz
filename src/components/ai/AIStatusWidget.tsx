import { Link } from "react-router-dom";
import { AlertTriangle, Crown, Zap, Calendar } from "lucide-react";
import { useAiAccess } from "@/hooks/useAiAccess";
import { useCredits } from "@/hooks/useCredits";
import { AI_SERVICE_TARIFFS } from "@/data/aiTariffs";

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
  const cheapestCost = Math.min(...AI_SERVICE_TARIFFS.map((s) => s.creditCost));
  const avgCost = Math.ceil(AI_SERVICE_TARIFFS.reduce((sum, s) => sum + s.creditCost, 0) / AI_SERVICE_TARIFFS.length);
  const approxMinRequests = Math.floor(balance / avgCost);
  const approxMaxRequests = Math.floor(balance / cheapestCost);

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

      <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center justify-between"><span>Taxminiy yetadi</span><b className="text-foreground">{approxMinRequests}–{approxMaxRequests} so'rov</b></div>
        <div className="flex items-center justify-between"><span>Token rejimi</span><b className="text-foreground">100–150 / so'rov</b></div>
      </div>

      {(remainingToday <= 2 || balance <= 5) && (
        <Link to="/ai-payment" className="flex items-center justify-center gap-1 text-center text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 py-2 rounded-lg transition">
          <AlertTriangle className="w-3 h-3" /> Balans kamaymoqda — to'ldirish →
        </Link>
      )}
    </div>
  );
};

export default AIStatusWidget;
