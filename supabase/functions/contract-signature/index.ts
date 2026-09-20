import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendRawEmail } from "../_shared/transactional-email-templates/send-raw-email.ts";

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

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      .select("id, owner_id, counterparty_id, status, approval_status, required_signatures, title_uz, body_uz, contract_number, hash_id")
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

    if (action === "get_eimzo_challenge") {
      if (contract.approval_status === "rejected" || contract.status === "cancelled") return json(400, { error: "Shartnoma imzolash uchun mavjud emas" });
      if (contract.approval_status === "pending") return json(400, { error: "Shartnoma admin tomonidan tasdiqlanmagan" });
      const challengeId = crypto.randomUUID();
      const issuedAt = new Date().toISOString();
      const documentHash = await sha256(`${contract.id}|${contract.contract_number}|${contract.title_uz}|${contract.body_uz}`);
      const canonicalPayload = JSON.stringify({ version: 1, purpose: "MED1_CONTRACT_SIGNATURE", contract_id: contract.id, contract_number: contract.contract_number, document_hash: documentHash, signer_id: user.id, challenge_id: challengeId, issued_at: issuedAt });
      const { error } = await admin.from("contract_signature_challenges").insert({
        contract_id: contractId, user_id: user.id, challenge_id: challengeId,
        canonical_payload: canonicalPayload, document_hash: documentHash,
        expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      });
      if (error) return json(500, { error: "E-IMZO so‘rovini yaratib bo‘lmadi" });
      return json(200, { challenge_id: challengeId, canonical_payload: canonicalPayload, document_hash: documentHash, expires_in: 600 });
    }

    if (action === "sign_eimzo") {
      const pkcs7 = typeof body.pkcs7 === "string" ? body.pkcs7 : "";
      const certificate = body.certificate || {};
      if (!pkcs7 || pkcs7.length < 100 || !body.challenge_id || !certificate.serial_number || !body.signer_name) return json(400, { error: "E-IMZO ma’lumotlari to‘liq emas" });
      const { data: challenge } = await admin.from("contract_signature_challenges").select("*").eq("contract_id", contractId).eq("user_id", user.id).eq("challenge_id", body.challenge_id).is("consumed_at", null).maybeSingle();
      if (!challenge || new Date(challenge.expires_at) < new Date()) return json(400, { error: "E-IMZO so‘rovi eskirgan. Qaytadan urinib ko‘ring" });

      let verificationStatus = "pending";
      let verificationDetails: Record<string, unknown> = { client_certificate: certificate, reason: "Accredited verifier is not configured" };
      const verifierUrl = Deno.env.get("EIMZO_VERIFY_URL");
      const verifierToken = Deno.env.get("EIMZO_VERIFY_TOKEN");
      if (verifierUrl) {
        const verifyResponse = await fetch(verifierUrl, { method: "POST", headers: { "Content-Type": "application/json", ...(verifierToken ? { Authorization: `Bearer ${verifierToken}` } : {}) }, body: JSON.stringify({ pkcs7, data: challenge.canonical_payload, document_hash: challenge.document_hash }) });
        const verifyData = await verifyResponse.json().catch(() => ({}));
        verificationStatus = verifyResponse.ok && (verifyData.valid === true || verifyData.verified === true) ? "verified" : "failed";
        verificationDetails = { provider_status: verifyResponse.status, response: verifyData };
      }
      if (verificationStatus === "failed") return json(400, { error: "E-IMZO server tekshiruvidan o‘tmadi" });

      const signatureHash = await sha256(pkcs7);
      const { data: sig, error: sigError } = await admin.from("contract_signatures").insert({
        contract_id: contractId, signer_id: user.id, signer_name: body.signer_name, signer_email: user.email,
        method: "eimzo", signature_hash: signatureHash, pkcs7_signature: pkcs7,
        certificate_serial: certificate.serial_number, certificate_subject: certificate.subject || body.signer_name,
        certificate_issuer: certificate.issuer || null, certificate_valid_from: certificate.valid_from || null,
        certificate_valid_until: certificate.valid_until || null, document_hash: challenge.document_hash,
        verification_status: verificationStatus, verification_details: verificationDetails,
        otp_verified: false, ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: req.headers.get("user-agent") || null, is_valid: verificationStatus === "verified",
      }).select().single();
      if (sigError) return json(500, { error: "E-IMZO dalilini saqlab bo‘lmadi" });
      await admin.from("contract_signature_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", challenge.id);
      return json(200, { success: true, signature_id: sig.id, verification_status: verificationStatus });
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
        // Email: real yuborish
        const subject = "MED1.UZ — Shartnoma imzolash kodi";
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#0A2540">MED1.UZ — Shartnoma imzolash</h2>
            <p>Shartnoma: <b>${contract.title_uz}</b></p>
            <p>Tasdiqlash kodi:</p>
            <p style="font-size:30px;letter-spacing:6px;font-weight:700;color:#2F80ED">${otp}</p>
            <p style="color:#64748B">Kod 10 daqiqa amal qiladi. Kodni hech kimga bermang.</p>
          </div>`;
        let emailSent = false;
        try {
          const res = await sendRawEmail({
            to: destination,
            subject,
            html,
            label: "contract_signature_otp",
            idempotencyKey: `contract-otp-${contractId}-${otp}`,
          });
          emailSent = res.sent;
        } catch (e) {
          console.error("[contract-signature] email send failed", e);
        }
        try {
          await admin.from("contract_notifications").insert({
            contract_id: contractId,
            user_id: user.id,
            type: "otp_email",
            title: subject,
            body: "Shartnoma imzolash uchun tasdiqlash kodi yuborildi",
            data: { destination, sent: emailSent },
          });
        } catch (e) {
          console.error("[contract-signature] notification log failed", e);
        }
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
        console.error("contract-signature insert error:", sigErr);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
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
