// HMAC-SHA256 request signature guard for the MED-ALL API Gateway.
//
// Partners send:
//   x-signature: hex-encoded HMAC-SHA256(secret, `${timestamp}.${method}.${path}.${sha256(body)}`)
//   x-timestamp: unix seconds (must be within ±TOLERANCE)
//
// The secret is stored per-key in api_keys.hmac_secret. Enforcement is
// activated per-partner via api_partners.require_hmac.

const TOLERANCE_SECONDS = 300; // 5 minutes

export interface HmacResult {
  ok: boolean;
  code?: string;
  message?: string;
}

async function sha256Hex(bytes: Uint8Array | string): Promise<string> {
  const buf = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// constant-time hex compare
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyHmac(opts: {
  secret: string;
  method: string;
  path: string;
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
}): Promise<HmacResult> {
  const { secret, method, path, rawBody, signatureHeader, timestampHeader } = opts;
  if (!signatureHeader) return { ok: false, code: "missing_signature", message: "x-signature header required" };
  if (!timestampHeader) return { ok: false, code: "missing_timestamp", message: "x-timestamp header required" };

  const ts = parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return { ok: false, code: "bad_timestamp", message: "x-timestamp must be unix seconds" };
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TOLERANCE_SECONDS) {
    return { ok: false, code: "stale_signature", message: `Timestamp outside ±${TOLERANCE_SECONDS}s window` };
  }

  const bodyHash = await sha256Hex(rawBody || "");
  const payload = `${ts}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const expected = await hmacSha256Hex(secret, payload);

  if (!safeEqual(expected, signatureHeader.trim().toLowerCase())) {
    return { ok: false, code: "invalid_signature", message: "HMAC signature mismatch" };
  }
  return { ok: true };
}
