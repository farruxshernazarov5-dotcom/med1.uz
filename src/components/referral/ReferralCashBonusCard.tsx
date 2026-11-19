import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Gift, Sparkles, Coins, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Summary = { balance: number; bonus_balance: number; rewarded_invites: number; earned: number; awaiting_payment: number; welcome_amount: number; inviter_amount: number };
const fmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("ru-RU").replace(/,/g, " ")} so‘m`;

/** Avans kartadagi referral bonus hisobi va uni xizmatga sarflash tugmalari. */
export const ReferralCashBonusCard = () => {
  const [s, setS] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    setLoading(true);
    const { data, error: failure } = await supabase.rpc("get_my_referral_cash_summary");
    setError(Boolean(failure));
    if (data && !failure) setS(data as unknown as Summary);
    setLoading(false);
  };
  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 space-y-4">
      <div className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /><h3 className="font-semibold">Bonus hisobim</h3><Button className="ml-auto" size="icon" variant="ghost" aria-label="Bonus hisobini yangilash" disabled={loading} onClick={() => void refresh()}><RefreshCw className="w-4 h-4" /></Button></div>
      {error && <p role="alert" className="text-sm text-destructive">Bonus hisobi yuklanmadi. Qayta yangilang.</p>}
      {loading && !s && <p role="status" className="text-sm text-muted-foreground">Bonus hisobi yuklanmoqda…</p>}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-background/60 p-3"><p className="text-muted-foreground text-xs">Ishlatsa bo‘ladigan bonus</p><p className="text-xl font-bold text-primary">{fmt(s?.bonus_balance ?? 0)}</p></div>
        <div className="rounded-xl bg-background/60 p-3"><p className="text-muted-foreground text-xs">Avans karta jami</p><p className="text-xl font-bold">{fmt(s?.balance ?? 0)}</p></div>
        <div className="rounded-xl bg-background/60 p-3"><p className="text-muted-foreground text-xs">Bonus bergan takliflar</p><p className="text-lg font-semibold">{s?.rewarded_invites ?? 0} ta</p></div>
        <div className="rounded-xl bg-background/60 p-3"><p className="text-muted-foreground text-xs">Takliflardan topilgan</p><p className="text-lg font-semibold">{fmt(s?.earned ?? 0)}</p></div>
      </div>
      <p className="text-sm">Pullik xaridni kutayotgan takliflar: <strong>{s?.awaiting_payment ?? 0} ta</strong></p>
      <p className="text-xs text-muted-foreground">Yangi tasdiqlangan hisobga {fmt(s?.welcome_amount ?? 10000)}. Do‘stingiz birinchi pullik tarif yoki Med Coin xaridini bajarsa, sizga {fmt(s?.inviter_amount ?? 5000)} bir marta tushadi. Faqat bonusga qilingan xarid va avans kartani to‘ldirish taklif bonusini bermaydi. Bonus boshqa kartaga o‘tkazilmaydi.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button asChild className="gap-2"><Link to="/mobile-profile?section=cash_wallet"><Sparkles className="w-4 h-4" />Bonus bilan tarif olish</Link></Button>
        <Button asChild variant="outline" className="gap-2"><Link to="/mobile-profile?section=cash_wallet"><Coins className="w-4 h-4" />Med Coin sotib olish</Link></Button>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Wallet className="w-3 h-3" />To‘lovda avval bonus summasi yechiladi.</div>
    </div>
  );
};
