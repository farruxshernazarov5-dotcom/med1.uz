import { useLatestTokenUsage, TOKEN_CAP } from "@/lib/tokenUsageStore";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Real-time token usage badge — shows the last AI response's output tokens
 * vs the strict 150-token cap. Auto-hides until the first response arrives.
 */
export function TokenUsageBadge({ className }: { className?: string }) {
  const evt = useLatestTokenUsage();
  if (!evt || !evt.outputTokens) return null;
  const pct = Math.min(100, Math.round((evt.outputTokens / TOKEN_CAP) * 100));
  const exceeded = evt.exceeded;
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1 text-xs", exceeded && "border-destructive/60 bg-destructive/10", className)}>
      {exceeded ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <Zap className="h-3.5 w-3.5 text-primary" />}
      <span className="font-medium">{evt.outputTokens}/{TOKEN_CAP} token</span>
      <span className="text-muted-foreground">({pct}%)</span>
      {evt.estimatedCostUsd ? <span className="text-muted-foreground">· ${evt.estimatedCostUsd.toFixed(5)}</span> : null}
      {exceeded ? <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">LIMIT</Badge> : null}
    </div>
  );
}
