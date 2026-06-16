import { useEffect, useRef } from "react";
import { Coins, AlertTriangle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useLanguage } from "@/hooks/useLanguage";
import { getServiceCreditCost } from "@/data/aiTariffs";
import { mc } from "@/lib/medCoinI18n";

interface Props {
  serviceId: string;
  /** Show a one-time toast when entering the service. */
  notify?: boolean;
  className?: string;
}

/**
 * Compact inline badge that shows the expected Med Coin spend for a service
 * and (optionally) fires a one-shot toast notice when the user enters the page.
 * Deduction itself happens server-side (deduct_ai_credits RPC).
 */
const MedCoinCostBadge = ({ serviceId, notify = true, className = "" }: Props) => {
  const { balance } = useCredits();
  const { lang } = useLanguage();
  const cost = getServiceCreditCost(serviceId);
  const enough = balance >= cost;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!notify || firedRef.current) return;
    firedRef.current = true;
    const key = `mc-entry-${serviceId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    toast(
      enough
        ? `${mc(lang, "infoCost")}: ${cost} 🪙  ·  ${mc(lang, "panelRemaining")}: ${balance} 🪙`
        : `${mc(lang, "panelTopup")} — ${mc(lang, "infoCost")} ${cost} 🪙`,
      {
        description: enough
          ? lang === "ru" ? "Списание произойдёт автоматически при запуске сервиса."
            : lang === "en" ? "Med Coins are deducted automatically when the service runs."
            : "Med Coin xizmat ishga tushganda balansdan avtomatik yechiladi."
          : lang === "ru" ? "Недостаточно Med Coin. Пополните баланс."
            : lang === "en" ? "Not enough Med Coin. Please top up."
            : "Med Coin yetarli emas. Iltimos to'ldiring.",
      }
    );
  }, [serviceId, cost, balance, enough, lang, notify]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          enough
            ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
        }`}
      >
        <Coins className="w-3.5 h-3.5" /> {cost} Med Coin / {lang === "ru" ? "запрос" : lang === "en" ? "request" : "so'rov"}
      </span>
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Sparkles className="w-3 h-3" /> {mc(lang, "panelRemaining")}: <b className="tabular-nums">{balance}</b>
      </span>
      {!enough && (
        <Link to="/ai-subscription" className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:underline">
          <AlertTriangle className="w-3 h-3" /> {mc(lang, "panelTopup")}
        </Link>
      )}
    </div>
  );
};

export default MedCoinCostBadge;
