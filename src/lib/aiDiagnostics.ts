// Lightweight in-memory diagnostics store for AI edge-function errors.
// Subscribed to by <AIDiagnosticsPanel /> so the user / dev can inspect
// the HTTP status, raw body, and request id of any failing AI call.

export interface AiDiagnosticEntry {
  id: string;
  ts: number;
  functionName: string;
  status: number | null;
  ok: boolean;
  requestId: string | null;
  errorCode: string | null;
  message: string;
  body: string | null; // raw or stringified response body, truncated
  durationMs: number;
}

const MAX = 50;
const entries: AiDiagnosticEntry[] = [];
const listeners = new Set<() => void>();

export function subscribeAiDiagnostics(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAiDiagnostics(): AiDiagnosticEntry[] {
  return entries.slice();
}

export function clearAiDiagnostics(): void {
  entries.length = 0;
  listeners.forEach(l => l());
}

export function recordAiDiagnostic(e: Omit<AiDiagnosticEntry, "id" | "ts">): void {
  const entry: AiDiagnosticEntry = {
    ...e,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    body: e.body && e.body.length > 4000 ? e.body.slice(0, 4000) + "…[truncated]" : e.body,
    message: e.message?.slice(0, 1000) ?? "",
  };
  entries.unshift(entry);
  if (entries.length > MAX) entries.length = MAX;
  // Also log to console for power users
  if (!entry.ok) {
    console.warn(`[ai-diag] ${entry.functionName} status=${entry.status} req=${entry.requestId} ${entry.message}`);
  }
  listeners.forEach(l => l());
}
