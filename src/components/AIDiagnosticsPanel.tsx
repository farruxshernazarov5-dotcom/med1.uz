import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, X, Trash2, AlertTriangle, CheckCircle2, Download, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";
import { subscribeAiDiagnostics, getAiDiagnostics, clearAiDiagnostics, type AiDiagnosticEntry } from "@/lib/aiDiagnostics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Tab = "calls" | "mapping" | "health";

interface MappingAuditRow {
  id: string;
  created_at: string;
  level: string;
  message: string;
  metadata: Record<string, any> | null;
}

const POLL_MS = 15_000;

/**
 * Admin-only floating AI diagnostics panel.
 *  - Shown only to users with role = "admin" (or when ?diag=1 + already an admin).
 *  - Tabs: AI calls / Model mapping audit (legacy_remap, fallback_unknown) / Health check.
 *  - Polls the diagnostics store + model-mapping audit every 15s, raises a toast
 *    when a new failure or new mapping warning appears.
 *  - CSV / JSON export of the current tab.
 */
export default function AIDiagnosticsPanel() {
  const { user, userRole, loading } = useAuth();
  const isAdmin = userRole === "admin";

  const [entries, setEntries] = useState<AiDiagnosticEntry[]>(getAiDiagnostics());
  const [tab, setTab] = useState<Tab>("calls");
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [selected, setSelected] = useState<AiDiagnosticEntry | null>(null);
  const [mapping, setMapping] = useState<MappingAuditRow[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const lastFailureIdRef = useRef<string | null>(null);
  const lastMappingIdRef = useRef<string | null>(null);

  // Visibility gate (admin-only)
  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      setEnabled(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const force = params.get("diag") === "1" || localStorage.getItem("med1_ai_diag") === "1";
    if (force || getAiDiagnostics().some((e) => !e.ok)) setEnabled(true);
    if (params.get("diag") === "1") localStorage.setItem("med1_ai_diag", "1");
    return subscribeAiDiagnostics(() => {
      const list = getAiDiagnostics();
      setEntries(list);
      const newest = list.find((e) => !e.ok);
      if (newest && newest.id !== lastFailureIdRef.current) {
        lastFailureIdRef.current = newest.id;
        toast.error(`AI xato: ${newest.functionName}`, {
          description: `${newest.status ?? "—"} · ${newest.message.slice(0, 120)}`,
        });
        setEnabled(true);
      }
    });
  }, [isAdmin, loading]);

  // Polling for mapping audit + entries refresh
  useEffect(() => {
    if (!isAdmin || !enabled) return;
    let cancelled = false;
    const fetchMapping = async () => {
      setMappingLoading(true);
      const { data, error } = await supabase
        .from("security_debug_log")
        .select("id, created_at, level, message, metadata")
        .eq("scope", "model-map")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled && !error && data) {
        const rows = data as MappingAuditRow[];
        const newest = rows[0];
        if (newest && lastMappingIdRef.current && newest.id !== lastMappingIdRef.current) {
          toast.warning("Yangi model mapping ogohlantirishi", {
            description: newest.message.slice(0, 140),
          });
        }
        if (newest) lastMappingIdRef.current = newest.id;
        setMapping(rows);
      }
      setMappingLoading(false);
    };
    void fetchMapping();
    setEntries(getAiDiagnostics());
    const t = setInterval(() => {
      setEntries(getAiDiagnostics());
      void fetchMapping();
    }, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [isAdmin, enabled]);

  const failureCount = entries.filter((e) => !e.ok).length;
  const warnMappingCount = useMemo(
    () => mapping.filter((m) => m.level !== "info").length,
    [mapping],
  );

  if (loading || !user) return null;
  if (!isAdmin) return null;
  if (!enabled && failureCount === 0) return null;

  async function runHealth() {
    setHealthLoading(true);
    setHealth(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-health-check", { method: "GET" } as any);
      if (error) {
        setHealth({ error: error.message });
        toast.error("Health check muvaffaqiyatsiz", { description: error.message });
      } else {
        setHealth(data);
      }
    } catch (e: any) {
      setHealth({ error: e?.message ?? "failed" });
    } finally {
      setHealthLoading(false);
    }
  }

  function downloadBlob(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function toCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return "";
    const cols = Array.from(rows.reduce<Set<string>>((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
    const esc = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  }

  function exportData(format: "json" | "csv") {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `ai-diagnostics-${tab}-${stamp}`;
    const rows: Record<string, any>[] =
      tab === "calls" ? entries.map((e) => ({ ...e })) :
      tab === "mapping" ? mapping.map((m) => ({ ...m, metadata: m.metadata })) :
      [{ ok: health?.ok, summary: health?.summary, services: health?.services }];
    if (format === "json") {
      downloadBlob(`${baseName}.json`, JSON.stringify(rows, null, 2), "application/json");
    } else {
      downloadBlob(`${baseName}.csv`, toCsv(rows), "text/csv");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-[9998] flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg hover:bg-slate-800"
        aria-label="AI diagnostika"
      >
        <Activity className="h-4 w-4" />
        AI
        {failureCount > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px]">{failureCount}</span>}
        {warnMappingCount > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-[10px]">{warnMappingCount}</span>}
        <Lock className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div className="fixed bottom-16 left-4 z-[9999] flex max-h-[78vh] w-[min(480px,calc(100vw-2rem))] flex-col rounded-lg border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              AI diagnostika
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">admin</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => exportData("json")} className="rounded px-2 py-1 text-xs hover:bg-muted" title="JSON eksport">
                <Download className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => exportData("csv")} className="rounded px-2 py-1 text-[10px] hover:bg-muted" title="CSV eksport">
                CSV
              </button>
              <button onClick={() => { clearAiDiagnostics(); setSelected(null); }} className="rounded p-1 hover:bg-muted" aria-label="Tozalash">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted" aria-label="Yopish">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex border-b border-border text-xs">
            <TabBtn active={tab === "calls"} onClick={() => setTab("calls")} label="So'rovlar" badge={failureCount} />
            <TabBtn active={tab === "mapping"} onClick={() => setTab("mapping")} label="Model audit" badge={warnMappingCount} amber />
            <TabBtn active={tab === "health"} onClick={() => setTab("health")} label="Health" />
          </div>

          <div className="overflow-y-auto p-2 text-xs">
            {tab === "calls" && (
              <CallsTab entries={entries} selected={selected} setSelected={setSelected} />
            )}
            {tab === "mapping" && (
              <MappingTab rows={mapping} loading={mappingLoading} />
            )}
            {tab === "health" && (
              <HealthTab health={health} loading={healthLoading} run={runHealth} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TabBtn({ active, onClick, label, badge, amber }: { active: boolean; onClick: () => void; label: string; badge?: number; amber?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2 ${active ? "border-b-2 border-primary font-medium" : "text-muted-foreground hover:bg-muted/50"}`}
    >
      {label}
      {badge && badge > 0 ? (
        <span className={`rounded-full px-1.5 text-[10px] text-white ${amber ? "bg-amber-500" : "bg-red-500"}`}>{badge}</span>
      ) : null}
    </button>
  );
}

function CallsTab({ entries, selected, setSelected }: { entries: AiDiagnosticEntry[]; selected: AiDiagnosticEntry | null; setSelected: (e: AiDiagnosticEntry | null) => void }) {
  if (entries.length === 0) return <div className="px-1 py-4 text-center text-muted-foreground">Hozircha AI so'rovlari yo'q.</div>;
  return (
    <ul className="space-y-1">
      {entries.map((e) => (
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
              {e.body && <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all">{e.body}</pre>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function MappingTab({ rows, loading }: { rows: MappingAuditRow[]; loading: boolean }) {
  if (loading && rows.length === 0) return <div className="px-1 py-4 text-center text-muted-foreground">Yuklanmoqda…</div>;
  if (rows.length === 0) return <div className="px-1 py-4 text-center text-muted-foreground">Model mapping ogohlantirishlari yo'q. 🎉</div>;
  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const m = r.metadata ?? {};
        const reason = m.reason ?? "—";
        const amber = r.level === "warn";
        return (
          <li key={r.id} className={`rounded border px-2 py-1.5 ${amber ? "border-amber-500/40 bg-amber-50/60 dark:bg-amber-900/10" : "border-border/60"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{m.service ?? "unknown"}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{reason}</span>
            </div>
            <div className="mt-0.5 text-[11px]">
              <span className="text-muted-foreground">{m.requested ?? "—"}</span>
              <span className="mx-1">→</span>
              <span className="font-mono">{m.mapped ?? "—"}</span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
          </li>
        );
      })}
    </ul>
  );
}

function HealthTab({ health, loading, run }: { health: any; loading: boolean; run: () => void }) {
  return (
    <div className="space-y-2">
      <button onClick={run} disabled={loading} className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-50">
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Tekshirilmoqda…" : "Health check"}
      </button>
      {!health ? (
        <div className="px-1 py-2 text-muted-foreground">Hisobot uchun "Health check" tugmasini bosing.</div>
      ) : health.error ? (
        <div className="text-red-600">{health.error}</div>
      ) : (
        <div className="space-y-1">
          <div>ok: <span className={health.ok ? "text-green-600" : "text-red-600"}>{String(health.ok)}</span> · sog'lom {health.summary?.healthy_count}/{health.summary?.total}</div>
          {health.summary?.invalid_models?.length > 0 && (
            <div className="text-amber-600">noto'g'ri modellar: {health.summary.invalid_models.join(", ")}</div>
          )}
          {health.summary?.unreachable?.length > 0 && (
            <div className="text-red-600">erishib bo'lmaydi: {health.summary.unreachable.join(", ")}</div>
          )}
          <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto">
            {(health.services ?? []).map((s: any) => (
              <li key={s.name} className="flex items-center justify-between rounded border border-border/60 px-2 py-1">
                <span className="truncate">{s.name}</span>
                <span className="text-[10px] text-muted-foreground">{s.http_status ?? "—"} · {s.latency_ms}ms</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
