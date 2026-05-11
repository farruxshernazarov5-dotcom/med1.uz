import { useState } from "react";
import { Lock, Sparkles, Tag, Coins, Crown, Gift, Zap, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UpgradeModal from "@/components/saas/UpgradeModal";
import { cn } from "@/lib/utils";
import type { PremiumPerk } from "@/hooks/usePremiumPerks";
import type { SaaSModuleId } from "@/hooks/useSaasPlan";

const ICON_MAP: Record<string, any> = {
  Sparkles, Tag, Coins, Crown, Gift, Zap, Star,
};

interface Props {
  perk: PremiumPerk;
  unlocked: boolean;
  moduleId: SaaSModuleId;
  currentTier: string;
}

export const PerkCard = ({ perk, unlocked, moduleId, currentTier }: Props) => {
  const [open, setOpen] = useState(false);
  const Icon = ICON_MAP[perk.icon || "Sparkles"] || Sparkles;

  const validUntil = perk.valid_until ? new Date(perk.valid_until) : null;
  const isExpired = validUntil ? validUntil < new Date() : false;

  const handleClick = () => {
    if (!unlocked) { setOpen(true); return; }
    if (perk.cta_url) window.open(perk.cta_url, "_blank");
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "group relative text-left w-full rounded-2xl p-5 border transition-all duration-300 overflow-hidden",
          unlocked
            ? "bg-gradient-to-br from-primary/10 via-card to-card border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5"
            : "bg-gradient-to-br from-muted/40 to-card border-border hover:border-primary/40"
        )}
      >
        {/* Animated shimmer */}
        {unlocked && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none" />
        )}

        <div className="flex items-start justify-between mb-3 relative">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            unlocked
              ? "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5">
            {perk.badge_text && (
              <Badge variant={unlocked ? "default" : "secondary"} className="text-[10px] font-bold">
                {perk.badge_text}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] uppercase">
              {perk.tier_required}
            </Badge>
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
          {perk.title}
          {!unlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />}
        </h3>
        {perk.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{perk.description}</p>
        )}

        <div className="flex items-center justify-between">
          {perk.value_text && (
            <span className={cn(
              "text-2xl font-bold",
              unlocked
                ? "bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                : "text-muted-foreground blur-[3px] select-none"
            )}>
              {perk.value_text}
            </span>
          )}
          {validUntil && !isExpired && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {validUntil.toLocaleDateString("uz-UZ")}
            </span>
          )}
        </div>

        {!unlocked && (
          <div className="mt-3 pt-3 border-t border-dashed border-border/60">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="w-3 h-3" /> Ochish uchun {perk.tier_required.toUpperCase()} →
            </span>
          </div>
        )}
        {unlocked && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Zap className="w-3 h-3" /> Faol — bosib foydalaning
            </span>
          </div>
        )}
      </button>

      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        reason="feature_blocked"
        moduleId={moduleId}
        feature={perk.title}
        currentTier={currentTier}
      />
    </>
  );
};

export default PerkCard;
