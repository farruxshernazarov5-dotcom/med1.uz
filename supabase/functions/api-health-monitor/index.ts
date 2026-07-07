// api-health-monitor — runs every 5 minutes via pg_cron.
// Scans api_request_logs and triggers alerts (email + Telegram) when thresholds are breached.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

interface Alert {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  window_minutes: number;
  scope_endpoint: string | null;
  notify_email: string | null;
  notify_telegram_chat_id: string | null;
  trigger_count: number;
}

const compare = (a: number, op: string, b: number) => {
  switch (op) {
    case ">": return a > b;
    case "<": return a < b;
    case ">=": return a >= b;
    case "<=": return a <= b;
    case "==": return a === b;
    default: return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: alerts, error } = await supabase
    .from("api_monitoring_alerts")
    .select("*")
    .eq("is_active", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const triggered: string[] = [];

  for (const alert of (alerts ?? []) as Alert[]) {
    const since = new Date(Date.now() - alert.window_minutes * 60_000).toISOString();
    let qry = supabase.from("api_request_logs").select("status_code, response_time_ms, endpoint").gte("created_at", since);
    if (alert.scope_endpoint) qry = qry.ilike("endpoint", `%${alert.scope_endpoint}%`);
    const { data: logs } = await qry;
    const rows = logs ?? [];
    if (rows.length === 0) continue;

    let actual = 0;
    switch (alert.metric) {
      case "error_rate":
        actual = (rows.filter((r: any) => r.status_code >= 400).length / rows.length) * 100;
        break;
      case "latency_p95": {
        const sorted = rows.map((r: any) => r.response_time_ms || 0).sort((a: number, b: number) => a - b);
        actual = sorted[Math.floor(sorted.length * 0.95)] || 0;
        break;
      }
      case "request_volume":
        actual = rows.length;
        break;
      case "rate_limit_hits":
        actual = rows.filter((r: any) => r.status_code === 429).length;
        break;
      case "auth_failures":
        actual = rows.filter((r: any) => r.status_code === 401 || r.status_code === 403).length;
        break;
    }

    if (compare(actual, alert.operator, alert.threshold)) {
      triggered.push(alert.name);
      const message = `🚨 API Alert: ${alert.name}\nMetric: ${alert.metric}\nActual: ${actual.toFixed(2)} ${alert.operator} ${alert.threshold}\nWindow: ${alert.window_minutes} min`;

      // Telegram
      if (alert.notify_telegram_chat_id) {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ chat_id: alert.notify_telegram_chat_id, text: message }),
        }).catch(() => {});
      }
      // Email
      if (alert.notify_email) {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({
            to: alert.notify_email,
            subject: `[MED1 API Alert] ${alert.name}`,
            template: "generic",
            data: { title: alert.name, body: message.replace(/\n/g, "<br>") },
          }),
        }).catch(() => {});
      }

      await supabase.from("api_monitoring_alerts")
        .update({ last_triggered_at: new Date().toISOString(), trigger_count: alert.trigger_count + 1 })
        .eq("id", alert.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, checked: alerts?.length ?? 0, triggered }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
