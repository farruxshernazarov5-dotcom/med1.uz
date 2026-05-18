import { Wallet, Coins, Sparkles, Calendar, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ReferralWallet } from "@/hooks/useReferral";

export const ReferralWalletCard = ({ wallet }: { wallet: ReferralWallet | null }) => {
  const w = wallet ?? { owner_id: "", credits_balance: 0, ai_credits_balance: 0, months_balance: 0, lifetime_earned: 0, lifetime_spent: 0 };

  return (
    <div className="glass-dark relative overflow-hidden rounded-2xl border border-white/10 p-5">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl bg-[#7B61FF]/20" />
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-[#22D3EE]" />
        <h3 className="font-semibold">Referral hamyon</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
          <Coins className="w-4 h-4 text-emerald-400 mb-1" />
          <p className="text-xs text-muted-foreground">Credits</p>
          <p className="text-lg font-bold tabular-nums">{Number(w.credits_balance).toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
          <Calendar className="w-4 h-4 text-cyan-400 mb-1" />
          <p className="text-xs text-muted-foreground">Bonus oy</p>
          <p className="text-lg font-bold tabular-nums">{w.months_balance}</p>
        </div>
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
          <Sparkles className="w-4 h-4 text-violet-400 mb-1" />
          <p className="text-xs text-muted-foreground">AI credits</p>
          <p className="text-lg font-bold tabular-nums">{Number(w.ai_credits_balance).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>Umumiy daromad: <b className="text-emerald-400">{Number(w.lifetime_earned).toLocaleString()}</b></span>
        <span>Ishlatilgan: <b>{Number(w.lifetime_spent).toLocaleString()}</b></span>
      </div>

      <Button
        className="w-full btn-magnetic bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0"
        onClick={() => toast.info("Bonusni obunaga qo'llash tez orada qo'shiladi")}
      >
        <ArrowUpRight className="w-4 h-4 mr-2" /> Obunaga qo'llash
      </Button>
    </div>
  );
};

export default ReferralWalletCard;
