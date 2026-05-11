import { useMemo } from "react";
import { usePremiumPerks } from "@/hooks/usePremiumPerks";
import type { SaaSModuleId } from "@/hooks/useSaasPlan";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Crown, Tag, Coins, Gift, Sparkles, Ticket } from "lucide-react";
import PerkCard from "./PerkCard";
import PromoCodeRedeem from "./PromoCodeRedeem";
import UpgradeNudge from "./UpgradeNudge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "all", label: "Barchasi", icon: Sparkles },
  { id: "discount", label: "Chegirmalar", icon: Tag },
  { id: "bonus", label: "Bonuslar", icon: Gift },
  { id: "cashback", label: "Cashback", icon: Coins },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "vip", label: "VIP", icon: Crown },
];

export const PremiumPerksPanel = ({ moduleId }: { moduleId: SaaSModuleId }) => {
  const { perks, loading, plan, isUnlocked } = usePremiumPerks(moduleId);

  const stats = useMemo(() => {
    const unlocked = perks.filter(isUnlocked).length;
    const locked = perks.length - unlocked;
    return { unlocked, locked, total: perks.length };
  }, [perks, isUnlocked]);

  const recommendedTier = plan.tier === "free" ? "starter" : plan.tier === "starter" ? "pro" : "enterprise";

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-primary/80 p-6 md:p-8 text-primary-foreground">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                Premium Monetization
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Chegirmalar va Premium Features</h2>
            <p className="opacity-90 text-sm md:text-base max-w-xl">
              Sizning tarifingiz: <span className="font-bold uppercase">{plan.tier}</span> · {stats.unlocked}/{stats.total} faol
            </p>
          </div>
          <Link to={`/pricing?module=${moduleId}`}>
            <Button variant="secondary" size="lg" className="gap-2 shadow-lg">
              <Sparkles className="w-4 h-4" /> Tarifni yangilash
            </Button>
          </Link>
        </div>
      </div>

      {/* AI nudge */}
      {plan.tier !== "enterprise" && stats.locked > 0 && (
        <UpgradeNudge
          moduleId={moduleId}
          currentTier={plan.tier}
          recommendedTier={recommendedTier}
          reason={`Siz ${stats.locked} ta premium imkoniyatdan foydalanmayapsiz. ${recommendedTier.toUpperCase()} tarifga o'tib hammasini oching.`}
        />
      )}

      {/* Promo code */}
      <PromoCodeRedeem moduleId={moduleId} />

      {/* Perks grid by category */}
      <Tabs defaultValue="all">
        <TabsList className="flex flex-wrap h-auto">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="gap-1.5">
              <c.icon className="w-3.5 h-3.5" /> {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => {
          const filtered = cat.id === "all" ? perks : perks.filter((p) => p.category === cat.id);
          return (
            <TabsContent key={cat.id} value={cat.id} className="mt-5">
              {filtered.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  <Ticket className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  Bu kategoriyada hozircha imkoniyat yo'q
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((p) => (
                    <PerkCard key={p.id} perk={p} unlocked={isUnlocked(p)} moduleId={moduleId} currentTier={plan.tier} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default PremiumPerksPanel;
