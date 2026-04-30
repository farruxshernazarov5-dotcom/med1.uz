import { useState } from "react";
import { Lock } from "lucide-react";
import { useSaasPlan, type SaaSModuleId } from "@/hooks/useSaasPlan";
import UpgradeModal from "./UpgradeModal";

interface ModuleLockProps {
  moduleId: SaaSModuleId;
  feature?: string;
  metric?: string;
  children: React.ReactNode;
  /** When true, renders children but intercepts clicks if blocked. Default: hides children. */
  softLock?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on plan features/limits.
 * If blocked, shows lock UI + opens UpgradeModal on click.
 */
export const ModuleLock = ({ moduleId, feature, metric, children, softLock, fallback }: ModuleLockProps) => {
  const plan = useSaasPlan(moduleId);
  const [open, setOpen] = useState(false);

  if (plan.loading) return <>{children}</>;

  let blocked = false;
  let reason: string = "feature_blocked";
  if (plan.status === "expired") { blocked = true; reason = "expired"; }
  else if (feature && !plan.isFeatureAllowed(feature)) { blocked = true; reason = "feature_blocked"; }
  else if (metric && plan.isOverLimit(metric)) { blocked = true; reason = "limit_exceeded"; }

  if (!blocked) return <>{children}</>;

  if (softLock) {
    return (
      <>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }} className="cursor-not-allowed opacity-60 relative">
          {children}
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-lg">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <UpgradeModal open={open} onClose={() => setOpen(false)} reason={reason} moduleId={moduleId} feature={feature} metric={metric} used={metric ? plan.getUsed(metric) : undefined} limit={metric ? plan.getLimit(metric) : undefined} currentTier={plan.tier} />
      </>
    );
  }

  return (
    <>
      {fallback ?? (
        <button onClick={() => setOpen(true)} className="w-full bg-gradient-to-br from-muted to-muted/50 border border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors">
          <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Funksiya bloklangan</h3>
          <p className="text-sm text-muted-foreground mb-3">Tarifingizda bu funksiya yo'q</p>
          <span className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full">Tarifni yangilash →</span>
        </button>
      )}
      <UpgradeModal open={open} onClose={() => setOpen(false)} reason={reason} moduleId={moduleId} feature={feature} metric={metric} used={metric ? plan.getUsed(metric) : undefined} limit={metric ? plan.getLimit(metric) : undefined} currentTier={plan.tier} />
    </>
  );
};

export default ModuleLock;
