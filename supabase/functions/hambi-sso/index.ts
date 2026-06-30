// HAMBI Single Sign-On Exchange
// Accepts an HMAC-signed token from HAMBI and returns a Supabase session
// (access_token + refresh_token) for the matched user. If the user does not
// exist yet, it is auto-provisioned with the patient role and HAMBI metadata.
//
// Token format (JSON, base64url):
//   { sub: "<hambi_user_id>", email: "...", phone?: "+998...",
//     full_name?: "...", iat: <unix>, exp: <unix>, nonce: "<uuid>" }
// Signature: HMAC-SHA256(secret=HAMBI_SSO_SECRET, message=`${b64Payload}`)
// Request body: { token: "<b64Payload>.<hexSig>" }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-med1-channel",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time hex compare
function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SECRET = Deno.env.get("HAMBI_SSO_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!SECRET) return json(500, { error: "sso_not_configured" });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const token: string = body?.token || "";
  const parts = token.split(".");
  if (parts.length !== 2) return json(400, { error: "malformed_token" });
  const [b64Payload, sig] = parts;

  const expected = await hmacHex(SECRET, b64Payload);
  if (!safeEq(expected, sig.toLowerCase())) return json(401, { error: "bad_signature" });

  let payload: any;
  try {
    payload = JSON.parse(b64urlDecode(b64Payload));
  } catch {
    return json(400, { error: "bad_payload" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.sub || !payload?.email) return json(400, { error: "missing_claims" });
  if (payload.exp && payload.exp < now) return json(401, { error: "token_expired" });
  if (payload.iat && payload.iat > now + 300) return json(401, { error: "token_future" });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const email = String(payload.email).toLowerCase().trim();
  const hambiId = String(payload.sub);

  // Find or create the auth user
  let userId: string | null = null;
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users?.find(
    (u: any) => u.email === email || u.user_metadata?.hambi_id === hambiId,
  );
  if (found) {
    userId = found.id;
    // Refresh hambi metadata
    await supabase.auth.admin.updateUserById(found.id, {
      user_metadata: {
        ...(found.user_metadata || {}),
        hambi_id: hambiId,
        channel: "hambi",
        full_name: payload.full_name ?? found.user_metadata?.full_name,
      },
    });
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      phone: payload.phone || undefined,
      user_metadata: {
        hambi_id: hambiId,
        channel: "hambi",
        full_name: payload.full_name || "",
        role: "patient",
      },
    });
    if (error) return json(500, { error: "create_user_failed", detail: error.message });
    userId = created.user!.id;
  }

  // Issue a magic-link grant and exchange it for a session
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link) return json(500, { error: "link_failed", detail: linkErr?.message });

  // The verify endpoint will return the session; do it server-side.
  const hashedToken = (link.properties as any)?.hashed_token;
  if (!hashedToken) return json(500, { error: "no_hashed_token" });

  const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: verify, error: vErr } = await anonClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: hashedToken,
  });
  if (vErr || !verify?.session) {
    return json(500, { error: "verify_failed", detail: vErr?.message });
  }

  // Audit
  await supabase.from("audit_logs").insert({
    action: "hambi_sso_login",
    entity_type: "auth.users",
    entity_id: userId,
    details: { hambi_id: hambiId, email, nonce: payload.nonce ?? null },
  });

  return json(200, {
    user_id: userId,
    access_token: verify.session.access_token,
    refresh_token: verify.session.refresh_token,
    expires_at: verify.session.expires_at,
    expires_in: verify.session.expires_in,
    token_type: "bearer",
  });
});
