import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_GATEWAY = "https://connector-gateway.lovable.dev/telegram";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

async function sendTelegram(chatId: string, text: string) {
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const tgKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovKey || !tgKey || !chatId) {
    return { ok: false, error: "telegram secrets/chat_id missing" };
  }
  try {
    const res = await fetch(`${TELEGRAM_GATEWAY}/sendMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `tg ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "tg network" };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<{ ok: boolean; error?: string }>): Promise<{ ok: boolean; error?: string; attempts: number }> {
  let lastErr: string | undefined;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const r = await fn();
    if (r.ok) return { ok: true, attempts: i };
    lastErr = r.error;
    if (i < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * i);
  }
  return { ok: false, error: lastErr, attempts: MAX_ATTEMPTS };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, srv);

    const body = await req.json().catch(() => ({}));
    let entry: any = body;
    if (body.entryId) {
      const { data } = await admin.from("security_debug_log").select("*").eq("id", body.entryId).maybeSingle();
      if (data) entry = data;
    }
    if (!entry || !entry.level) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const level = String(entry.level);
    const scope = String(entry.scope || "");
    const isTokenOverage = scope === "ai-token-cap";
    const priorityRank: Record<string, number> = { info: 0, warn: 1, error: 2 };
    const entryRank = priorityRank[level] ?? 1;

    const { data: subs } = await admin.from("security_notification_settings").select("*");
    const recipients = (subs || []).filter((s: any) => {
      if (isTokenOverage && s.token_overage_enabled === false) return false;
      const min = priorityRank[s.min_priority || "warn"] ?? 1;
      if (entryRank < min && !isTokenOverage) return false;
      if (s.error_only && level !== "error" && !isTokenOverage) return false;
      return true;
    });

    const baseSubject = `🛡️ Security: ${level.toUpperCase()} — ${scope || "unknown"}`;
    const tgBase = `<b>${baseSubject}</b>\n${entry.message || ""}${entry.endpoint ? `\nEndpoint: <code>${entry.endpoint}</code>` : ""}${entry.column_name ? `\nColumn: <code>${entry.column_name}</code>` : ""}${isTokenOverage ? `\n⚠️ Token cap exceeded` : ""}`;

    let emailSent = 0, tgSent = 0;
    const deliveries: any[] = [];

    for (const sub of recipients) {
      const subject = sub.subject_prefix ? `${sub.subject_prefix} ${baseSubject}` : baseSubject;
      const htmlBody = `
        <h2>${subject}</h2>
        <p><b>Message:</b> ${escapeHtml(entry.message || "")}</p>
        ${entry.endpoint ? `<p><b>Endpoint:</b> <code>${escapeHtml(entry.endpoint)}</code></p>` : ""}
        ${entry.column_name ? `<p><b>Column:</b> <code>${escapeHtml(entry.column_name)}</code></p>` : ""}
        ${entry.query_text ? `<p><b>Query:</b><pre>${escapeHtml(entry.query_text)}</pre></p>` : ""}
        <p><small>Time: ${new Date(entry.created_at || Date.now()).toISOString()}</small></p>
      `;

      // EMAIL
      if (sub.email_enabled && sub.email_address) {
        const { data: allowed } = await admin.rpc("security_notif_check_rate", {
          _user: sub.user_id, _channel: "email", _cap: sub.rate_limit_per_min ?? 10,
        });
        if (allowed === false) {
          deliveries.push({ entry_id: entry.id, user_id: sub.user_id, channel: "email", recipient: sub.email_address, scope, level, status: "rate_limited", attempt: 0 });
        } else {
          const r = await withRetry(async () => {
            try {
              const { error } = await admin.functions.invoke("send-transactional-email", {
                body: {
                  templateName: "security-alert",
                  recipientEmail: sub.email_address,
                  idempotencyKey: `secalert-${entry.id || crypto.randomUUID()}-${sub.user_id}`,
                  templateData: { subject, htmlBody, scope, level, message: entry.message },
                },
              });
              if (error) return { ok: false, error: String(error.message || error) };
              return { ok: true };
            } catch (e: any) { return { ok: false, error: e?.message || "invoke failed" }; }
          });
          if (r.ok) emailSent++;
          deliveries.push({
            entry_id: entry.id, user_id: sub.user_id, channel: "email", recipient: sub.email_address,
            scope, level, status: r.ok ? "sent" : "failed", attempt: r.attempts, error: r.error || null,
          });
        }
      }

      // TELEGRAM
      if (sub.telegram_enabled && sub.telegram_chat_id) {
        const { data: allowed } = await admin.rpc("security_notif_check_rate", {
          _user: sub.user_id, _channel: "telegram", _cap: sub.rate_limit_per_min ?? 10,
        });
        if (allowed === false) {
          deliveries.push({ entry_id: entry.id, user_id: sub.user_id, channel: "telegram", recipient: sub.telegram_chat_id, scope, level, status: "rate_limited", attempt: 0 });
        } else {
          const r = await withRetry(() => sendTelegram(sub.telegram_chat_id, tgBase));
          if (r.ok) tgSent++;
          deliveries.push({
            entry_id: entry.id, user_id: sub.user_id, channel: "telegram", recipient: sub.telegram_chat_id,
            scope, level, status: r.ok ? "sent" : "failed", attempt: r.attempts, error: r.error || null,
          });
        }
      }
    }

    if (deliveries.length > 0) {
      await admin.from("security_notification_deliveries").insert(deliveries);
    }

    if (entry.id) {
      await admin.from("security_debug_log").update({ notified: true }).eq("id", entry.id);
    }

    return new Response(JSON.stringify({ ok: true, emailSent, tgSent, recipients: recipients.length, deliveries: deliveries.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
