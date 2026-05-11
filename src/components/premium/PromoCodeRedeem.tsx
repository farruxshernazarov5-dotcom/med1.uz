import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Loader2 } from "lucide-react";

export const PromoCodeRedeem = ({ moduleId }: { moduleId: string }) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const redeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Tizimga kiring", variant: "destructive" });
        return;
      }
      const { data: pc } = await supabase
        .from("promo_codes" as any)
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle() as any;

      if (!pc) {
        toast({ title: "Promo-kod topilmadi", variant: "destructive" });
        return;
      }
      if (pc.valid_until && new Date(pc.valid_until) < new Date()) {
        toast({ title: "Promo-kod muddati tugagan", variant: "destructive" });
        return;
      }
      if (pc.max_uses && pc.used_count >= pc.max_uses) {
        toast({ title: "Promo-kod limitiga yetdi", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("promo_redemptions" as any).insert({
        user_id: user.id, promo_code_id: pc.id, module_id: moduleId,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Bu promo-kodni allaqachon ishlatgansiz", variant: "destructive" });
        } else throw error;
        return;
      }
      await supabase.from("promo_codes" as any)
        .update({ used_count: (pc.used_count || 0) + 1 })
        .eq("id", pc.id);

      toast({
        title: `🎉 ${pc.discount_pct}% chegirma faollashdi!`,
        description: pc.description || "Keyingi xaridda qo'llaniladi",
      });
      setCode("");
    } catch (e: any) {
      toast({ title: "Xato", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-card border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Promo-kod kiriting</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Maxsus chegirma va bonuslarni faollashtirish uchun kodni kiriting
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="WELCOME10"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono"
        />
        <Button onClick={redeem} disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Faollashtirish"}
        </Button>
      </div>
    </div>
  );
};

export default PromoCodeRedeem;
