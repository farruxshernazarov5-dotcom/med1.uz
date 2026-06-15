import { Link } from "react-router-dom";
import { Coins, Calendar, TrendingDown, ShoppingCart, Sparkles } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useLanguage } from "@/hooks/useLanguage";
import { mc } from "@/lib/medCoinI18n";
import { Button } from "@/components/ui/button";

const fmtDate = (iso: string | null, lang: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-GB"); } catch { return iso; }
};

const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
};

const MedCoinPanel = () => {
  const { balance, expiresAt, loading } = useCredits();
  const { lang } = useLanguage();

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-4 h-32 animate-pulse" />;
  }

  const days = daysUntil(expiresAt);
  const expired = days === 0 && balance > 0;
  const expiryColor = days === null ? "text-muted-foreground" : days <= 3 ? "text-rose-600" : days <= 7 ? "text-amber-600" : "text-emerald-600";

  // Estimates based on tariffs: 1 / 5 / 25
  const estDoctor = Math.floor(balance / 1);
  const estSymptom = Math.floor(balance / 5);
  const estLab = Math.floor(balance / 25);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-50/40 via-background to-primary/5 dark:from-amber-950/20 p-5 shadow-sm">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {mc(lang, "panelTitle")}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tabular-nums">{balance}</span>
              <span className="text-sm text-muted-foreground">Med Coin</span>
            </div>
          </div>
          <Coins className="w-8 h-8 text-amber-500" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="rounded-lg bg-background/60 border border-border p-2.5">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Calendar className="w-3 h-3" /> {mc(lang, "panelExpires")}
            </div>
            <div className="font-semibold text-foreground">{fmtDate(expiresAt, lang)}</div>
            {days !== null && (
              <div className={`text-[11px] font-medium mt-0.5 ${expiryColor}`}>
                {expired ? mc(lang, "panelExpired") : `${days} ${mc(lang, "panelDaysLeft")}`}
              </div>
            )}
          </div>
          <div className="rounded-lg bg-background/60 border border-border p-2.5">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <TrendingDown className="w-3 h-3" /> {mc(lang, "panelRemaining")}
            </div>
            <div className="font-semibold text-foreground">{balance} 🪙</div>
          </div>
        </div>

        <div className="rounded-lg bg-background/60 border border-border p-3 mb-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
            {mc(lang, "panelEstimates")}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-lg">🤖</div>
              <div className="font-bold text-foreground tabular-nums">{estDoctor}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">AI Doktor</div>
            </div>
            <div>
              <div className="text-lg">🩺</div>
              <div className="font-bold text-foreground tabular-nums">{estSymptom}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">Symptom</div>
            </div>
            <div>
              <div className="text-lg">🧪</div>
              <div className="font-bold text-foreground tabular-nums">{estLab}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">Lab / X-ray</div>
            </div>
          </div>
        </div>

        <Link to="/ai-subscription">
          <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white border-0">
            <ShoppingCart className="w-4 h-4 mr-1.5" /> {mc(lang, "panelTopup")}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default MedCoinPanel;
