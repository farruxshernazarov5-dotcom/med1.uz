/**
 * Lightweight error tracker — installs global handlers, tags useLocation/Router
 * errors specifically, mirrors to console, and best-effort logs to the
 * security_debug_log table via the existing `insert_security_log` RPC.
 *
 * Not a full Sentry replacement, but covers the regression class we hit
 * (CreditProvider rendering useLocation outside a <BrowserRouter>) and any
 * future Router-context regressions: they'll surface immediately in
 * Admin → Security logs with scope = "router-context".
 */
import { supabase } from "@/integrations/supabase/client";

type Level = "info" | "warn" | "error";

const seen = new Set<string>();
const MAX_SEEN = 200;
let installed = false;

const isRouterContextError = (msg: string) =>
  /useLocation\(\)|useNavigate\(\)|useParams\(\)|useRoutes\(\)|Router context|<Router>|may be used only in the context of a <Router>/i.test(
    msg,
  );

async function report(scope: string, level: Level, message: string, metadata: Record<string, unknown> = {}) {
  const key = `${scope}|${message}`.slice(0, 240);
  if (seen.has(key)) return;
  if (seen.size > MAX_SEEN) seen.clear();
  seen.add(key);

  // Always mirror to console with a clear tag
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](`[errorTracker:${scope}]`, message, metadata);

  try {
    await supabase.rpc("insert_security_log", {
      _scope: scope,
      _level: level,
      _message: message.slice(0, 1000),
      _endpoint: typeof location !== "undefined" ? location.pathname + location.search : null,
      _metadata: {
        ...metadata,
        href: typeof location !== "undefined" ? location.href : null,
        ua: typeof navigator !== "undefined" ? navigator.userAgent : null,
        ts: new Date().toISOString(),
      },
    });
  } catch {
    /* offline / RLS — never throw from tracker */
  }
}

export const errorTracker = {
  capture: (err: unknown, ctx: Record<string, unknown> = {}) => {
    const e = err as Error;
    const msg = e?.message || String(err);
    const scope = isRouterContextError(msg) ? "router-context" : "frontend";
    report(scope, "error", msg, { stack: e?.stack?.slice(0, 1500), ...ctx });
  },
  warn: (msg: string, ctx: Record<string, unknown> = {}) => report("frontend", "warn", msg, ctx),
};

export function installErrorTracker() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (ev) => {
    errorTracker.capture(ev.error ?? new Error(ev.message), {
      filename: ev.filename,
      lineno: ev.lineno,
      colno: ev.colno,
    });
  });

  window.addEventListener("unhandledrejection", (ev) => {
    errorTracker.capture(ev.reason ?? new Error("Unhandled promise rejection"), { kind: "unhandledrejection" });
  });
}
