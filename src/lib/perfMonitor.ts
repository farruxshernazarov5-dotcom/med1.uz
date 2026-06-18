/**
 * Lightweight performance monitor for CreditProvider & app-level metrics.
 * Logs to console + optional security_debug_log for regression detection.
 * No external dependency (Sentry not installed).
 */
import { supabase } from "@/integrations/supabase/client";

type MetricName =
  | "credits.first_paint_ms"
  | "credits.fetch_ms"
  | "credits.cache_hit"
  | "credits.cache_miss"
  | "app.route_change_ms"
  | "app.router_context_error";

const buffer: Array<{ name: MetricName; value: number; meta?: Record<string, unknown>; ts: number }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export const recordMetric = (name: MetricName, value: number, meta?: Record<string, unknown>) => {
  buffer.push({ name, value, meta, ts: Date.now() });
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[perf] ${name} = ${value.toFixed?.(2) ?? value}ms`, meta || "");
  }
  scheduleFlush();
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 10_000);
};

const flush = async () => {
  flushTimer = null;
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  // Only escalate to backend log on regressions (slow fetches > 2s or router errors)
  const escalate = batch.filter(
    (m) =>
      m.name === "app.router_context_error" ||
      (m.name === "credits.fetch_ms" && m.value > 2000) ||
      (m.name === "credits.first_paint_ms" && m.value > 3000),
  );
  if (escalate.length === 0) return;
  try {
    await supabase.rpc("insert_security_log", {
      _scope: "perf-monitor",
      _level: "warn",
      _message: `Performance regression: ${escalate.map((m) => m.name).join(",")}`,
      _metadata: { metrics: escalate } as never,
    });
  } catch {
    /* silent — never block UI */
  }
};

// Auto-flush on page hide
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => void flush());
}
