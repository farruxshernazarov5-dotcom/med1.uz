// referral-notify — Multi-channel notification dispatcher for referral events.
// Channels: in-app (referral_notifications), Telegram (via telegram-notify), email queue.
// Body: { user_id, type, title, body, data?, channels? }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NotifyBody {
  user_id: string;
  type: string; // new_referral | reward_granted | level_up | promo_used | fraud_flagged
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  channels?: Array<"in_app" | "telegram" | "email">;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const payload = (await req.json()) as NotifyBody;
    if (!payload?.user_id || !payload?.type || !payload?.title) {
      return json({ error: "missing_fields" }, 400);
    }

    // Authorization: caller may only notify themselves, unless they are an admin.
    const admin = createClient(SUPABASE_URL, SERVICE);
    if (payload.user_id !== u.user.id) {
      const { data: isAdmin } = await admin.rpc("has_role", {
        _user_id: u.user.id,
        _role: "admin",
      });
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
    }

    const channels = payload.channels ?? ["in_app"];
    const results: Record<string, unknown> = {};

    // ── 1) In-app
    if (channels.includes("in_app")) {
      const { error } = await admin.from("referral_notifications").insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        data: payload.data ?? {},
      });
      results.in_app = error ? { error: error.message } : { ok: true };
    }

    // ── 2) Telegram (if profile has telegram_chat_id)
    if (channels.includes("telegram")) {
      const { data: prof } = await admin
        .from("profiles")
        .select("telegram_chat_id, full_name")
        .eq("user_id", payload.user_id)
        .maybeSingle();
      if (prof?.telegram_chat_id) {
        const TG = Deno.env.get("TELEGRAM_BOT_TOKEN");
        if (TG) {
          const text = `🎁 <b>${esc(payload.title)}</b>\n${esc(payload.body ?? "")}`;
          const r = await fetch(`https://api.telegram.org/bot${TG}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: prof.telegram_chat_id,
              text,
              parse_mode: "HTML",
            }),
          });
          results.telegram = { status: r.status };
        } else {
          results.telegram = { skipped: "no_bot_token" };
        }
      } else {
        results.telegram = { skipped: "no_chat_id" };
      }
    }

    // ── 3) Email (enqueue if queue exists)
    if (channels.includes("email")) {
      const { data: usr } = await admin.auth.admin.getUserById(payload.user_id);
      const email = usr?.user?.email;
      if (email) {
        try {
          await admin.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              to: email,
              subject: payload.title,
              text: payload.body ?? "",
              template: "referral_event",
              meta: { type: payload.type, ...(payload.data ?? {}) },
            },
          });
          results.email = { queued: true };
        } catch (e) {
          results.email = { error: String((e as Error).message ?? e) };
        }
      } else {
        results.email = { skipped: "no_email" };
      }
    }

    return json({ ok: true, results });
  } catch (e) {
    console.error("referral-notify error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function esc(s: string) {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
