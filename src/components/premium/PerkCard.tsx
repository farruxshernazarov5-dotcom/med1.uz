import { useState } from "react";
import { Lock, Sparkles, Tag, Coins, Crown, Gift, Zap, Star, Clock, Info, ArrowUpRight, ShieldAlert } from "lucide-react";
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

  const openUpgrade = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(true);
  };

  const handleCardClick = () => {
    if (!unlocked) { setOpen(true); return; }
    if (perk.cta_url) window.open(perk.cta_url, "_blank");
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleCardClick()}
        className={cn(
          "group relative text-left w-full rounded-2xl p-5 border transition-all duration-300 overflow-hidden cursor-pointer",
          unlocked
            ? "bg-gradient-to-br from-primary/10 via-card to-card border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5"
            : "bg-gradient-to-br from-muted/30 via-card to-card border-dashed border-primary/30 hover:border-primary/60 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
        )}
      >
        {/* Locked diagonal stripes overlay */}
        {!unlocked && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, hsl(var(--primary)) 0 2px, transparent 2px 14px)",
            }}
          />
        )}

        {/* PRO ribbon corner */}
        {!unlocked && (
          <div className="absolute -right-10 top-3 rotate-45 bg-gradient-to-r from-primary to-purple-500 text-primary-foreground text-[10px] font-bold tracking-wider px-10 py-0.5 shadow-md">
            {perk.tier_required.toUpperCase()}
          </div>
        )}

        {/* Animated shimmer */}
        {unlocked && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none" />
        )}

        <div className="flex items-start justify-between mb-3 relative">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center relative",
            unlocked
              ? "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            <Icon className="w-5 h-5" />
            {!unlocked && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-primary/40 flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-primary animate-pulse" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {perk.badge_text && (
              <Badge variant={unlocked ? "default" : "secondary"} className="text-[10px] font-bold">
                {perk.badge_text}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
          {perk.title}
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
                : "text-muted-foreground blur-[4px] select-none"
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
          <div className="mt-4 pt-3 border-t border-dashed border-primary/30 space-y-2.5 relative">
            {/* Reason chip */}
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug">
                <span className="font-semibold text-amber-700 dark:text-amber-300">Nega bloklangan?</span>
                <span className="text-muted-foreground ml-1">
                  Joriy <b className="uppercase">{currentTier || "free"}</b> tarif —
                  bu funksiya uchun <b className="uppercase">{perk.tier_required}</b> kerak.
                </span>
              </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={openUpgrade}
                className="flex-1 h-8 bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 text-primary-foreground font-semibold gap-1 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openUpgrade}
                className="h-8 px-2 border-primary/30 hover:bg-primary/10"
                title="Nega bloklangan?"
              >
                <Info className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
        {unlocked && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Zap className="w-3 h-3" /> Faol — bosib foydalaning
            </span>
          </div>
        )}
      </div>

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
