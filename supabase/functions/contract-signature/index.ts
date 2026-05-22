import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendTelegram(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data } = await admin.auth.getUser(token);
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action as string;
    const contractId = body.contract_id as string;
    if (!action || !contractId) {
      return new Response(JSON.stringify({ error: "action and contract_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load contract & verify access
    const { data: contract } = await admin
      .from("contracts")
      .select("id, owner_id, counterparty_id, status, approval_status, required_signatures, title_uz")
      .eq("id", contractId)
      .maybeSingle();
    if (!contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (contract.owner_id !== user.id && contract.counterparty_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SEND OTP ===
    if (action === "send_otp") {
      const channel = (body.channel as string) || "email";
      let destination = body.destination as string | undefined;

      if (!destination) {
        if (channel === "email") {
          destination = user.email || "";
        } else if (channel === "telegram") {
          const { data: prof } = await admin
            .from("profiles").select("telegram_chat_id, phone")
            .eq("user_id", user.id).maybeSingle();
          destination = (prof as any)?.telegram_chat_id || "";
        }
      }
      if (!destination) {
        return new Response(JSON.stringify({ error: "no_destination", message: "Yetkazib berish manzili topilmadi" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const otp = genOtp();
      await admin.from("contract_signature_otps").insert({
        contract_id: contractId,
        user_id: user.id,
        otp_code: otp,
        channel,
        destination,
      });

      if (channel === "telegram") {
        await sendTelegram(
          destination,
          `📜 <b>MED1.UZ — Shartnoma imzolash kodi</b>\n\nShartnoma: <code>${contract.title_uz}</code>\nKod: <code>${otp}</code>\n\n⏱ 10 daqiqa amal qiladi.`,
        );
      } else {
        // Email: enqueue via existing transactional email queue if available
        await admin.from("contract_notifications").insert({
          contract_id: contractId,
          user_id: user.id,
          channel: "email",
          kind: "otp_email",
          payload: { otp, destination, subject: "Shartnoma imzolash kodi" },
        }).catch(() => {});
        console.log(`[contract-signature] OTP for ${destination}: ${otp}`);
      }

      return new Response(JSON.stringify({ success: true, channel, destination_masked: destination.replace(/(.{2}).*(.{2})/, "$1***$2") }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === VERIFY + SIGN ===
    if (action === "verify_and_sign") {
      const { otp, signer_name, signer_phone, signature_image_base64, method = "otp_canvas" } = body;
      if (!otp || !signer_name) {
        return new Response(JSON.stringify({ error: "otp and signer_name required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check approval status
      if (contract.approval_status === "rejected" || contract.status === "cancelled") {
        return new Response(JSON.stringify({ error: "Shartnoma rad etilgan" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (contract.approval_status === "pending") {
        return new Response(JSON.stringify({ error: "Shartnoma admin tomonidan tasdiqlanmagan" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: otpRow } = await admin
        .from("contract_signature_otps")
        .select("*")
        .eq("contract_id", contractId)
        .eq("user_id", user.id)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRow) {
        return new Response(JSON.stringify({ error: "OTP topilmadi yoki muddati tugagan" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new Date(otpRow.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "OTP muddati tugagan" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if ((otpRow.attempts || 0) >= 5) {
        return new Response(JSON.stringify({ error: "Juda ko'p urinish — qaytadan kod oling" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (otpRow.otp_code !== String(otp).trim()) {
        await admin.from("contract_signature_otps")
          .update({ attempts: (otpRow.attempts || 0) + 1 })
          .eq("id", otpRow.id);
        return new Response(JSON.stringify({ error: "Noto'g'ri kod" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload canvas signature if provided
      let signature_image_url: string | null = null;
      if (signature_image_base64 && typeof signature_image_base64 === "string") {
        try {
          const base64 = signature_image_base64.replace(/^data:image\/\w+;base64,/, "");
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const path = `${user.id}/${contractId}/${crypto.randomUUID()}.png`;
          const { error: upErr } = await admin.storage
            .from("legal-contracts")
            .upload(path, bytes, { contentType: "image/png", upsert: false });
          if (!upErr) signature_image_url = path;
        } catch (e) {
          console.error("signature upload error", e);
        }
      }

      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const ua = req.headers.get("user-agent") || null;
      const hashSource = `${contractId}|${user.id}|${signer_name}|${otpRow.otp_code}|${Date.now()}`;
      const signature_hash = await sha256(hashSource);

      const { data: sig, error: sigErr } = await admin.from("contract_signatures").insert({
        contract_id: contractId,
        signer_id: user.id,
        signer_name,
        signer_email: user.email,
        signer_phone: signer_phone || null,
        method,
        signature_image_url,
        signature_hash,
        otp_verified: true,
        otp_channel: otpRow.channel,
        ip_address: ip,
        user_agent: ua,
      }).select().single();

      if (sigErr) {
        return new Response(JSON.stringify({ error: sigErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await admin.from("contract_signature_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otpRow.id);

      await admin.from("contract_access_log").insert({
        contract_id: contractId,
        user_id: user.id,
        action: "signed",
        ip_address: ip,
        user_agent: ua,
      }).catch(() => {});

      return new Response(JSON.stringify({ success: true, signature: sig }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
