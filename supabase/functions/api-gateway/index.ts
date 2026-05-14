// MED-ALL AI Enterprise API Gateway
// Single entry point for all partner API calls. Authenticates via x-api-key,
// enforces scopes, IP/domain restrictions, logs every request, and proxies
// to internal handlers (clinic, doctor, lab, pharmacy, emr, ai, payment).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

const json = (status: number, body: unknown, requestId: string) =>
  new Response(
    JSON.stringify({
      success: status < 400,
      ...(status < 400 ? { data: body } : { error: body }),
      request_id: requestId,
    }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId } },
  );

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface KeyRow {
  id: string;
  partner_id: string;
  scopes: string[];
  rate_limit_per_min: number;
  rate_limit_per_day: number;
  expires_at: string | null;
  is_active: boolean;
  environment: string;
}
interface PartnerRow {
  id: string;
  status: string;
  tier: string;
  ip_whitelist: string[];
  allowed_domains: string[];
}

// Endpoint -> required scope mapping. Add more as Phase 5 lands.
const ROUTES: Record<string, { scope: string; method: string }> = {
  "GET /v1/clinics": { scope: "clinic:read", method: "GET" },
  "GET /v1/doctors": { scope: "doctor:read", method: "GET" },
  "GET /v1/diagnostics": { scope: "diagnostics:read", method: "GET" },
  "GET /v1/pharmacies": { scope: "pharmacy:read", method: "GET" },
  "POST /v1/bookings": { scope: "booking:write", method: "POST" },
  "POST /v1/ai/chat": { scope: "ai:chat", method: "POST" },
  "GET /v1/ping": { scope: "*", method: "GET" },
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const url = new URL(req.url);
  // Strip the function-name prefix from path so partners call /v1/...
  const path = url.pathname.replace(/^\/api-gateway/, "") || "/";
  const routeKey = `${req.method} ${path}`;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "";
  const origin = req.headers.get("origin") || "";

  let partnerId: string | null = null;
  let apiKeyId: string | null = null;
  let statusCode = 200;
  let errorMsg: string | null = null;
  let responseBody: Response;

  try {
    // 1. Extract API key
    const rawKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";
    if (!rawKey) {
      statusCode = 401;
      errorMsg = "Missing API key";
      responseBody = json(401, { code: "missing_api_key", message: "x-api-key header required" }, requestId);
    } else {
      // 2. Lookup key by hash
      const keyHash = await sha256Hex(rawKey);
      const { data: keyRow } = await supabase
        .from("api_keys")
        .select("id, partner_id, scopes, rate_limit_per_min, rate_limit_per_day, expires_at, is_active, environment")
        .eq("key_hash", keyHash)
        .eq("is_active", true)
        .maybeSingle<KeyRow>();

      if (!keyRow) {
        statusCode = 401;
        errorMsg = "Invalid API key";
        responseBody = json(401, { code: "invalid_api_key", message: "Key not recognised" }, requestId);
      } else if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
        statusCode = 401;
        errorMsg = "Key expired";
        apiKeyId = keyRow.id;
        partnerId = keyRow.partner_id;
        responseBody = json(401, { code: "key_expired", message: "API key has expired" }, requestId);
      } else {
        apiKeyId = keyRow.id;
        partnerId = keyRow.partner_id;

        // 3. Lookup partner
        const { data: partner } = await supabase
          .from("api_partners")
          .select("id, status, tier, ip_whitelist, allowed_domains")
          .eq("id", keyRow.partner_id)
          .maybeSingle<PartnerRow>();

        if (!partner || partner.status !== "approved") {
          statusCode = 403;
          errorMsg = "Partner not approved";
          responseBody = json(403, { code: "partner_inactive", message: "Partner organization is not active" }, requestId);
        } else if (partner.ip_whitelist.length && !partner.ip_whitelist.includes(ip)) {
          statusCode = 403;
          errorMsg = "IP not allowed";
          responseBody = json(403, { code: "ip_blocked", message: `Source IP ${ip} not whitelisted` }, requestId);
        } else if (
          partner.allowed_domains.length &&
          origin &&
          !partner.allowed_domains.some((d) => origin.includes(d))
        ) {
          statusCode = 403;
          errorMsg = "Origin not allowed";
          responseBody = json(403, { code: "origin_blocked", message: "Origin not whitelisted" }, requestId);
        } else {
          // 4. Route lookup & scope check
          const route = ROUTES[routeKey];
          if (!route) {
            statusCode = 404;
            errorMsg = "Route not found";
            responseBody = json(
              404,
              { code: "route_not_found", message: `Unknown endpoint ${routeKey}`, available: Object.keys(ROUTES) },
              requestId,
            );
          } else if (route.scope !== "*" && !keyRow.scopes.includes(route.scope) && !keyRow.scopes.includes("*")) {
            statusCode = 403;
            errorMsg = "Missing scope";
            responseBody = json(403, { code: "missing_scope", message: `Required scope: ${route.scope}` }, requestId);
          } else {
            // 5. Update last_used_at (fire and forget)
            supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then();

            // 6. Dispatch
            responseBody = await dispatch(supabase, path, req, requestId);
            statusCode = responseBody.status;
          }
        }
      }
    }
  } catch (e) {
    console.error("api-gateway error", requestId, e);
    statusCode = 500;
    errorMsg = String(e);
    responseBody = json(500, { code: "internal_error", message: "Internal server error" }, requestId);
  }

  // 7. Log request (fire and forget)
  supabase
    .from("api_request_logs")
    .insert({
      partner_id: partnerId,
      api_key_id: apiKeyId,
      endpoint: path,
      method: req.method,
      status_code: statusCode,
      response_time_ms: Date.now() - startTime,
      ip_address: ip,
      user_agent: userAgent,
      request_id: requestId,
      error_message: errorMsg,
    })
    .then();

  return responseBody!;
});

// ---- Dispatcher: maps validated routes to handlers ----
async function dispatch(supabase: any, path: string, req: Request, requestId: string): Promise<Response> {
  if (path === "/v1/ping") {
    return json(200, { pong: true, timestamp: new Date().toISOString() }, requestId);
  }
  if (path === "/v1/clinics" && req.method === "GET") {
    const { data, error } = await supabase
      .from("clinics")
      .select("id, name, address, phone, type, working_hours, is_active")
      .eq("is_active", true)
      .limit(100);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [], count: data?.length ?? 0 }, requestId);
  }
  if (path === "/v1/doctors" && req.method === "GET") {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, full_name, specialization, experience_years, rating, is_active")
      .eq("is_active", true)
      .limit(100);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [], count: data?.length ?? 0 }, requestId);
  }
  if (path === "/v1/diagnostics" && req.method === "GET") {
    const { data, error } = await supabase
      .from("diagnostics_centers")
      .select("id, name, address, phone, services, is_active")
      .eq("is_active", true)
      .limit(100);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [], count: data?.length ?? 0 }, requestId);
  }
  if (path === "/v1/pharmacies" && req.method === "GET") {
    const { data, error } = await supabase
      .from("pharmacies")
      .select("id, name, address, phone, working_hours, is_active")
      .eq("is_active", true)
      .limit(100);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [], count: data?.length ?? 0 }, requestId);
  }
  // Phase-5 endpoints (booking, ai/chat) will land here in the next iteration.
  return json(501, { code: "not_implemented", message: `${path} handler pending Phase 5` }, requestId);
}
