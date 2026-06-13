import { useEffect } from "react";
import { useLatestTokenUsage, TOKEN_CAP } from "@/lib/tokenUsageStore";
import { useCredits } from "@/hooks/useCredits";
import { getServiceCreditCost } from "@/data/aiTariffs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Coins, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Real-time token usage badge — shows the last AI response's output tokens
 * vs the strict 150-token cap. Auto-hides until the first response arrives.
 */
export function TokenUsageBadge({ className, serviceId }: { className?: string; serviceId?: string }) {
  const evt = useLatestTokenUsage();
  const { balance, refetch } = useCredits();
  useEffect(() => { if (evt) refetch(); }, [evt, refetch]);
  const activeService = evt?.serviceId ?? serviceId ?? "ai-doctor-chat";
  const cost = getServiceCreditCost(activeService);
  const approxRequests = cost > 0 ? Math.floor(balance / cost) : 0;
  if (!evt || !evt.outputTokens) {
    return (
      <div className={cn("inline-flex flex-wrap items-center gap-2 rounded-md border bg-card px-2.5 py-1 text-xs", balance <= cost * 2 && "border-amber-500/60 bg-amber-500/10", className)}>
        <Coins className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">{balance} Med Coin</span>
        <span className="text-muted-foreground">≈ {approxRequests} so'rov · token rejimi 100–150</span>
        {balance <= cost * 2 ? <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px] border-amber-500 text-amber-600">BALANS KAM</Badge> : null}
      </div>
    );
  }
  const pct = Math.min(100, Math.round((evt.outputTokens / TOKEN_CAP) * 100));
  const exceeded = evt.exceeded;
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-2 rounded-md border bg-card px-2.5 py-1 text-xs", exceeded && "border-destructive/60 bg-destructive/10", balance <= cost * 2 && "border-amber-500/60 bg-amber-500/10", className)}>
      {exceeded ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <Zap className="h-3.5 w-3.5 text-primary" />}
      <span className="font-medium">Kirish {evt.inputTokens ?? "—"} · Chiqish {evt.outputTokens} · Jami {evt.totalTokens ?? "—"}</span>
      <span className="text-muted-foreground">({pct}%)</span>
      <span className="inline-flex items-center gap-1 text-muted-foreground"><Coins className="h-3.5 w-3.5" /> {balance} Med Coin ≈ {approxRequests} so'rov</span>
      {evt.estimatedCostUsd ? <span className="text-muted-foreground">· ${evt.estimatedCostUsd.toFixed(5)}</span> : null}
      {exceeded ? <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">LIMIT</Badge> : null}
      {balance <= cost * 2 ? <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px] border-amber-500 text-amber-600">BALANS KAM</Badge> : null}
    </div>
  );
}
