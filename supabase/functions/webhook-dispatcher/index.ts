// MED-ALL AI Webhook Dispatcher
// Picks pending/retry-due deliveries from api_webhook_deliveries, signs each
// payload with HMAC-SHA256 using the partner webhook secret, POSTs to the
// partner URL, and updates status with exponential backoff.
//
// Invoke manually or on a schedule (e.g. every minute via pg_cron):
//   POST /webhook-dispatcher  { "limit": 50 }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const MAX_RETRIES = 5;
// Backoff in seconds: 30s, 2m, 10m, 1h, 6h
const BACKOFF_S = [30, 120, 600, 3600, 21600];

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface DeliveryRow {
  id: string;
  webhook_id: string;
  event: string;
  payload: unknown;
  retry_count: number;
  api_webhooks: { url: string; secret: string; is_active: boolean } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let limit = 50;
  try {
    const body = await req.json();
    if (typeof body?.limit === "number") limit = Math.min(Math.max(body.limit, 1), 200);
  } catch {
    /* no body, use default */
  }

  // Pull due deliveries
  const { data: rows, error } = await supabase
    .from("api_webhook_deliveries")
    .select("id, webhook_id, event, payload, retry_count, api_webhooks ( url, secret, is_active )")
    .in("status", ["pending", "retrying"])
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(limit);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const r of (rows ?? []) as DeliveryRow[]) {
    if (!r.api_webhooks || !r.api_webhooks.is_active) {
      await supabase
        .from("api_webhook_deliveries")
        .update({ status: "cancelled", response_body: "webhook disabled" })
        .eq("id", r.id);
      results.push({ id: r.id, status: "cancelled" });
      continue;
    }

    // Mark in-flight to avoid double processing
    await supabase
      .from("api_webhook_deliveries")
      .update({ status: "in_flight" })
      .eq("id", r.id);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyStr = JSON.stringify({
      id: r.id,
      event: r.event,
      created_at: new Date().toISOString(),
      data: r.payload,
    });
    const signature = await hmacSha256Hex(r.api_webhooks.secret, `${timestamp}.${bodyStr}`);

    let statusCode = 0;
    let responseBody = "";
    let ok = false;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(r.api_webhooks.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "MED-ALL-Webhook/1.0",
          "X-MedAll-Event": r.event,
          "X-MedAll-Delivery": r.id,
          "X-MedAll-Timestamp": timestamp,
          "X-MedAll-Signature": `t=${timestamp},v1=${signature}`,
          // Standard alias used by many partner SDKs
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Timestamp": timestamp,
          "X-Webhook-Event": r.event,
          "X-Webhook-Id": r.id,
        },
        body: bodyStr,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      statusCode = res.status;
      responseBody = (await res.text()).slice(0, 2000);
      ok = res.ok;
    } catch (e) {
      responseBody = `fetch_error: ${String(e).slice(0, 500)}`;
    }

    if (ok) {
      await supabase
        .from("api_webhook_deliveries")
        .update({
          status: "delivered",
          status_code: statusCode,
          response_body: responseBody,
          delivered_at: new Date().toISOString(),
          next_retry_at: null,
        })
        .eq("id", r.id);
      await supabase
        .from("api_webhooks")
        .update({ last_delivery_at: new Date().toISOString(), last_status: "delivered" })
        .eq("id", r.webhook_id);
      results.push({ id: r.id, status: "delivered", statusCode });
    } else {
      const nextRetry = r.retry_count + 1;
      if (nextRetry > MAX_RETRIES) {
        await supabase
          .from("api_webhook_deliveries")
          .update({
            status: "failed",
            status_code: statusCode,
            response_body: responseBody,
            retry_count: nextRetry,
            next_retry_at: null,
          })
          .eq("id", r.id);
        await supabase
          .from("api_webhooks")
          .update({ last_delivery_at: new Date().toISOString(), last_status: "failed" })
          .eq("id", r.webhook_id);
        results.push({ id: r.id, status: "failed", statusCode });
      } else {
        const delaySec = BACKOFF_S[Math.min(nextRetry - 1, BACKOFF_S.length - 1)];
        await supabase
          .from("api_webhook_deliveries")
          .update({
            status: "retrying",
            status_code: statusCode,
            response_body: responseBody,
            retry_count: nextRetry,
            next_retry_at: new Date(Date.now() + delaySec * 1000).toISOString(),
          })
          .eq("id", r.id);
        results.push({ id: r.id, status: "retrying", statusCode, retry_in_s: delaySec });
      }
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
