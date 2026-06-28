// Shared error sink for AI edge functions.
// Sends structured events to Sentry (when SENTRY_DSN is set) and mirrors them
// into public.security_debug_log via the insert_security_log RPC so admins can
// inspect them in the in-app AI Diagnostics panel.
//
// Always fire-and-forget — never throws, never blocks the handler.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SinkLevel = "info" | "warn" | "error";

export interface SinkEvent {
  scope: string;                       // e.g. "api-gateway", "ai-external-api", "model-map"
  level?: SinkLevel;                   // default "error"
  message: string;
  endpoint?: string | null;
  requestId?: string | null;
  status?: number | null;
  metadata?: Record<string, unknown>;
}

function dsnParts(dsn: string): { url: string; auth: string } | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "");
    const host = u.host;
    const publicKey = u.username;
    const url = `${u.protocol}//${host}/api/${projectId}/envelope/`;
    const auth =
      `Sentry sentry_version=7,sentry_client=med1-edge/1.0,sentry_key=${publicKey}`;
    return { url, auth };
  } catch {
    return null;
  }
}

async function postSentry(dsn: string, e: SinkEvent): Promise<void> {
  const parts = dsnParts(dsn);
  if (!parts) return;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const ts = new Date().toISOString();
  const env = Deno.env.get("SENTRY_ENVIRONMENT") || "production";
  const payload = {
    event_id: eventId,
    timestamp: ts,
    platform: "javascript",
    level: e.level ?? "error",
    environment: env,
    logger: e.scope,
    message: { formatted: e.message },
    tags: {
      scope: e.scope,
      endpoint: e.endpoint ?? undefined,
      request_id: e.requestId ?? undefined,
      status: e.status?.toString(),
    },
    extra: e.metadata ?? {},
  };
  const envelopeHeader = JSON.stringify({ event_id: eventId, sent_at: ts, dsn });
  const itemHeader = JSON.stringify({ type: "event" });
  const body = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(payload)}\n`;
  try {
    await fetch(parts.url, {
      method: "POST",
      headers: { "X-Sentry-Auth": parts.auth, "Content-Type": "application/x-sentry-envelope" },
      body,
      signal: AbortSignal.timeout(2500),
    });
  } catch (_) { /* ignore */ }
}

async function postSecurityLog(e: SinkEvent): Promise<void> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return;
  try {
    const supabase = createClient(url, key);
    await supabase.rpc("insert_security_log", {
      _scope: e.scope,
      _level: e.level ?? "error",
      _message: e.message.slice(0, 1000),
      _endpoint: e.endpoint ?? null,
      _metadata: {
        request_id: e.requestId ?? null,
        status: e.status ?? null,
        ...(e.metadata ?? {}),
      },
    });
  } catch (_) { /* ignore */ }
}

/** Fire-and-forget. Never awaits the network in the handler's critical path. */
export function reportEdgeError(e: SinkEvent): void {
  // Always log to stdout so it appears in edge logs.
  const tag = `[error-sink:${e.scope}]`;
  // deno-lint-ignore no-console
  (e.level === "warn" ? console.warn : console.error)(tag, e.message, {
    requestId: e.requestId,
    status: e.status,
    endpoint: e.endpoint,
    metadata: e.metadata,
  });
  const dsn = Deno.env.get("SENTRY_DSN");
  queueMicrotask(() => {
    void postSecurityLog(e);
    if (dsn) void postSentry(dsn, e);
  });
}
