import { useEffect } from "react";
import { useCredits } from "@/hooks/useCredits";
import { useLanguage } from "@/hooks/useLanguage";
import { mc } from "@/lib/medCoinI18n";
import { toast } from "@/hooks/use-toast";

const TRIGGER_DAYS = [30, 15, 7, 3, 1] as const;
const LS_PREFIX = "medcoin-expiry-toast-";

/**
 * Mount-once component (drop into AI hub pages). Fires a toast once per
 * (expires_at, threshold) pair, so users see each reminder a single time.
 */
const MedCoinExpiryReminder = () => {
  const { expiresAt, balance } = useCredits();
  const { lang } = useLanguage();

  useEffect(() => {
    if (!expiresAt || balance <= 0) return;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
    if (days <= 0) return;

    const threshold = TRIGGER_DAYS.find((d) => days <= d);
    if (!threshold) return;

    const key = `${LS_PREFIX}${expiresAt}-${threshold}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}

    const msgKey = `reminder${threshold}` as const;
    const variant = threshold <= 3 ? "destructive" : "default";
    toast({
      title: mc(lang, "panelTitle"),
      description: mc(lang, msgKey),
      variant: variant as any,
    });
  }, [expiresAt, balance, lang]);

  return null;
};

export default MedCoinExpiryReminder;
