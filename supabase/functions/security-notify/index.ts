import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function sendTelegram(chatId: string, text: string) {
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const tgKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovKey || !tgKey || !chatId) return false;
  const res = await fetch(`${TELEGRAM_GATEWAY}/sendMessage`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, srv);

    const body = await req.json().catch(() => ({}));
    // body: { entryId?: string, scope, level, message, endpoint?, column?, query? }
    let entry = body;
    if (body.entryId) {
      const { data } = await admin.from("security_debug_log").select("*").eq("id", body.entryId).maybeSingle();
      if (data) entry = data;
    }
    if (!entry || !entry.level) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Only error-level by default
    const level = String(entry.level);

    // Fetch admin subscribers
    const { data: subs } = await admin.from("security_notification_settings").select("*");
    const recipients = (subs || []).filter((s: any) => !s.error_only || level === "error");

    const subject = `🛡️ Security Center: ${level.toUpperCase()} — ${entry.scope || "unknown"}`;
    const htmlBody = `
      <h2>${subject}</h2>
      <p><b>Message:</b> ${escapeHtml(entry.message || "")}</p>
      ${entry.endpoint ? `<p><b>Endpoint:</b> <code>${escapeHtml(entry.endpoint)}</code></p>` : ""}
      ${entry.column_name ? `<p><b>Column:</b> <code>${escapeHtml(entry.column_name)}</code></p>` : ""}
      ${entry.query_text ? `<p><b>Query:</b><pre>${escapeHtml(entry.query_text)}</pre></p>` : ""}
      <p><small>Time: ${new Date(entry.created_at || Date.now()).toISOString()}</small></p>
    `;
    const tgText = `<b>${subject}</b>\n${entry.message || ""}\n${entry.endpoint ? `\nEndpoint: <code>${entry.endpoint}</code>` : ""}${entry.column_name ? `\nColumn: <code>${entry.column_name}</code>` : ""}`;

    let emailSent = 0, tgSent = 0;
    for (const sub of recipients) {
      if (sub.email_enabled && sub.email_address) {
        try {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "security-alert",
              recipientEmail: sub.email_address,
              idempotencyKey: `secalert-${entry.id || crypto.randomUUID()}-${sub.user_id}`,
              templateData: { subject, htmlBody, scope: entry.scope, level, message: entry.message },
            },
          });
          emailSent++;
        } catch (e) { console.warn("email failed", e); }
      }
      if (sub.telegram_enabled && sub.telegram_chat_id) {
        const ok = await sendTelegram(sub.telegram_chat_id, tgText);
        if (ok) tgSent++;
      }
    }

    if (entry.id) {
      await admin.from("security_debug_log").update({ notified: true }).eq("id", entry.id);
    }

    return new Response(JSON.stringify({ ok: true, emailSent, tgSent, recipients: recipients.length }), {
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
