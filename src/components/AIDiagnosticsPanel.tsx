import { useEffect, useState } from "react";
import { Activity, X, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { subscribeAiDiagnostics, getAiDiagnostics, clearAiDiagnostics, type AiDiagnosticEntry } from "@/lib/aiDiagnostics";
import { supabase } from "@/integrations/supabase/client";

/**
 * Floating AI diagnostics panel.
 * - Shown only when ?diag=1 is in the URL, localStorage.med1_ai_diag === "1",
 *   or there is at least one failed AI call in the current session.
 * - Surfaces HTTP status, request id, raw body for every AI edge-function call.
 * - Includes "Run health check" that hits ai-health-check edge function.
 */
export default function AIDiagnosticsPanel() {
  const [entries, setEntries] = useState<AiDiagnosticEntry[]>(getAiDiagnostics());
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [selected, setSelected] = useState<AiDiagnosticEntry | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const force = params.get("diag") === "1" || localStorage.getItem("med1_ai_diag") === "1";
    if (force) {
      setEnabled(true);
      if (params.get("diag") === "1") localStorage.setItem("med1_ai_diag", "1");
    }
    return subscribeAiDiagnostics(() => {
      const list = getAiDiagnostics();
      setEntries(list);
      if (list.some(e => !e.ok)) setEnabled(true);
    });
  }, []);

  const failureCount = entries.filter(e => !e.ok).length;

  if (!enabled && failureCount === 0) return null;

  async function runHealth() {
    setHealthLoading(true);
    setHealth(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-health-check", {
        method: "GET",
      } as any);
      setHealth(error ? { error: error.message } : data);
    } catch (e: any) {
      setHealth({ error: e?.message ?? "failed" });
    } finally {
      setHealthLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 left-4 z-[9998] flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg hover:bg-slate-800"
        aria-label="AI diagnostika"
      >
        <Activity className="h-4 w-4" />
        AI {failureCount > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px]">{failureCount}</span>}
      </button>

      {open && (
        <div className="fixed bottom-16 left-4 z-[9999] flex max-h-[70vh] w-[min(420px,calc(100vw-2rem))] flex-col rounded-lg border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="text-sm font-semibold">AI diagnostika</div>
            <div className="flex items-center gap-1">
              <button onClick={runHealth} disabled={healthLoading} className="rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-50">
                {healthLoading ? "..." : "Health check"}
              </button>
              <button onClick={() => { clearAiDiagnostics(); setSelected(null); }} className="rounded p-1 hover:bg-muted" aria-label="Tozalash">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted" aria-label="Yopish">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-2 text-xs">
            {health && (
              <div className="mb-2 rounded border border-border bg-muted/40 p-2">
                <div className="mb-1 font-medium">Health check</div>
                {health.error ? (
                  <div className="text-red-600">{health.error}</div>
                ) : (
                  <div>
                    <div>
                      ok: <span className={health.ok ? "text-green-600" : "text-red-600"}>{String(health.ok)}</span>
                      {" · "}healthy {health.summary?.healthy_count}/{health.summary?.total}
                    </div>
                    {health.summary?.invalid_models?.length > 0 && (
                      <div className="text-amber-600">invalid models: {health.summary.invalid_models.join(", ")}</div>
                    )}
                    {health.summary?.unreachable?.length > 0 && (
                      <div className="text-red-600">unreachable: {health.summary.unreachable.join(", ")}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {entries.length === 0 && (
              <div className="px-1 py-4 text-center text-muted-foreground">Hozircha AI so‘rovlari yo‘q.</div>
            )}

            <ul className="space-y-1">
              {entries.map(e => (
                <li key={e.id}>
                  <button
                    onClick={() => setSelected(e === selected ? null : e)}
                    className="flex w-full items-start gap-2 rounded border border-border/60 px-2 py-1.5 text-left hover:bg-muted"
                  >
                    {e.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-red-600" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-medium">{e.functionName}</span>
                        <span className="text-muted-foreground">{e.status ?? "—"} · {e.durationMs}ms</span>
                      </div>
                      {!e.ok && <div className="truncate text-red-600">{e.message}</div>}
                    </div>
                  </button>
                  {selected?.id === e.id && (
                    <div className="mt-1 rounded border border-border/60 bg-muted/30 p-2 font-mono text-[10px]">
                      <div>ts: {new Date(e.ts).toISOString()}</div>
                      <div>request_id: {e.requestId ?? "—"}</div>
                      <div>code: {e.errorCode ?? "—"}</div>
                      {e.body && (
                        <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all">{e.body}</pre>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
