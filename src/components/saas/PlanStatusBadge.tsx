import { Crown, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useSaasPlan, type SaaSModuleId } from "@/hooks/useSaasPlan";
import { Progress } from "@/components/ui/progress";

interface PlanStatusBadgeProps {
  moduleId: SaaSModuleId;
  showMetrics?: string[];
}

const TIER_STYLES: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  pro: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
  enterprise: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
};

export const PlanStatusBadge = ({ moduleId, showMetrics = [] }: PlanStatusBadgeProps) => {
  const plan = useSaasPlan(moduleId);

  if (plan.loading) return null;

  const expired = plan.status === "expired";
  const daysLeft = plan.expires_at ? Math.ceil((new Date(plan.expires_at).getTime() - Date.now()) / 86400000) : null;
  const expiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${TIER_STYLES[plan.tier]}`}>{plan.tier}</span>
          {expired && <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Tugagan</span>}
          {!expired && expiringSoon && <span className="text-xs text-amber-600">{daysLeft} kun qoldi</span>}
        </div>
        <Link to={`/pricing?module=${moduleId}`} className="text-xs text-primary hover:underline flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Yangilash
        </Link>
      </div>

      {showMetrics.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {showMetrics.map((m) => {
            const limit = plan.getLimit(m);
            const used = plan.getUsed(m);
            const pct = limit === -1 ? 0 : Math.min(100, (used / Math.max(1, limit)) * 100);
            return (
              <div key={m} className="text-xs">
                <div className="flex justify-between mb-0.5">
                  <span className="text-muted-foreground capitalize">{m.replace(/_/g, " ")}</span>
                  <span className="font-medium">{used}/{limit === -1 ? "∞" : limit}</span>
                </div>
                {limit !== -1 && <Progress value={pct} className="h-1" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanStatusBadge;
