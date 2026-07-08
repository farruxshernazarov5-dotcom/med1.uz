// MED-ALL AI Enterprise API Gateway
// Single entry point for all partner API calls. Authenticates via x-api-key,
// enforces scopes, IP/domain restrictions, logs every request, and proxies
// to internal handlers (clinic, doctor, lab, pharmacy, emr, ai, payment).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAiUsageEvent, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { mapModel } from "../_shared/model-map.ts";
import { reportEdgeError } from "../_shared/error-sink.ts";
import { verifyHmac } from "../_shared/api-hmac.ts";
import { sandboxDispatch } from "../_shared/api-mock.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-med1-channel",
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
  owner_user_id: string;
}

// Endpoint -> required scope mapping. Add more as Phase 5 lands.
// Static routes (exact match). Dynamic routes (with :id) handled in matchRoute().
const ROUTES: Record<string, { scope: string; method: string }> = {
  "GET /v1/ping": { scope: "*", method: "GET" },
  // Auth (public)
  "POST /v1/auth/login": { scope: "*", method: "POST" },
  "POST /v1/auth/register": { scope: "*", method: "POST" },
  "POST /v1/auth/otp/send": { scope: "*", method: "POST" },
  "POST /v1/auth/otp/verify": { scope: "*", method: "POST" },
  "POST /v1/auth/refresh": { scope: "*", method: "POST" },
  "POST /v1/auth/logout": { scope: "*", method: "POST" },
  "POST /v1/auth/forgot-password": { scope: "*", method: "POST" },
  // User
  "GET /v1/user/profile": { scope: "user:read", method: "GET" },
  "PATCH /v1/user/profile": { scope: "user:write", method: "PATCH" },
  "POST /v1/user/avatar": { scope: "user:write", method: "POST" },
  "PATCH /v1/user/settings": { scope: "user:write", method: "PATCH" },
  // Directory
  "GET /v1/clinics": { scope: "clinic:read", method: "GET" },
  "GET /v1/doctors": { scope: "doctor:read", method: "GET" },
  "GET /v1/diagnostics": { scope: "diagnostics:read", method: "GET" },
  "GET /v1/maternity": { scope: "clinic:read", method: "GET" },
  "GET /v1/pharmacies": { scope: "pharmacy:read", method: "GET" },
  // Bookings
  "POST /v1/bookings": { scope: "booking:write", method: "POST" },
  "POST /v1/appointments": { scope: "booking:write", method: "POST" },
  "GET /v1/appointments/history": { scope: "booking:read", method: "GET" },
  // EMR
  "GET /v1/emr/records": { scope: "emr:read", method: "GET" },
  "GET /v1/emr/analyses": { scope: "emr:read", method: "GET" },
  "GET /v1/emr/prescriptions": { scope: "emr:read", method: "GET" },
  "GET /v1/emr/diagnoses": { scope: "emr:read", method: "GET" },
  // Payments
  "POST /v1/payments/click": { scope: "payment:write", method: "POST" },
  "POST /v1/payments/payme": { scope: "payment:write", method: "POST" },
  "POST /v1/payments/uzum": { scope: "payment:write", method: "POST" },
  "GET /v1/payments/history": { scope: "payment:read", method: "GET" },
  "GET /v1/subscriptions": { scope: "payment:read", method: "GET" },
  "POST /v1/med-coin/purchase": { scope: "payment:write", method: "POST" },
  // Notifications
  "POST /v1/notifications/push": { scope: "notify:write", method: "POST" },
  "POST /v1/notifications/sms": { scope: "notify:write", method: "POST" },
  "POST /v1/notifications/email": { scope: "notify:write", method: "POST" },
  "POST /v1/notifications/telegram": { scope: "notify:write", method: "POST" },
  // Maps
  "GET /v1/maps/nearby": { scope: "*", method: "GET" },
  "GET /v1/maps/geofence": { scope: "*", method: "GET" },
  // AI (legacy generic)
  "POST /v1/ai/chat": { scope: "ai:chat", method: "POST" },
  // AI (14 services) — proxied to ai-* edge functions
  "POST /v1/ai/doctor": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/symptoms": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/laboratory": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/radiology": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/pregnancy": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/baby-care": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/psychologist": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/diet": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/pharmacy": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/cosmetology": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/fitness": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/assistant": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/monitoring": { scope: "ai:chat", method: "POST" },
  "POST /v1/ai/prediction": { scope: "ai:chat", method: "POST" },
};

// Dynamic route patterns (path segments starting with ":" are wildcards)
const DYNAMIC_ROUTES: Array<{ method: string; pattern: RegExp; scope: string }> = [
  { method: "GET", pattern: /^\/v1\/clinics\/[^/]+$/, scope: "clinic:read" },
  { method: "GET", pattern: /^\/v1\/doctors\/[^/]+$/, scope: "doctor:read" },
  { method: "GET", pattern: /^\/v1\/diagnostics\/[^/]+$/, scope: "diagnostics:read" },
  { method: "GET", pattern: /^\/v1\/pharmacies\/[^/]+$/, scope: "pharmacy:read" },
  { method: "DELETE", pattern: /^\/v1\/appointments\/[^/]+$/, scope: "booking:write" },
  { method: "POST", pattern: /^\/v1\/appointments\/[^/]+\/checkin$/, scope: "booking:write" },
];

function matchRoute(method: string, path: string): { scope: string } | null {
  const key = `${method} ${path}`;
  if (ROUTES[key]) return ROUTES[key];
  for (const r of DYNAMIC_ROUTES) {
    if (r.method === method && r.pattern.test(path)) return { scope: r.scope };
  }
  return null;
}

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
  let partnerOwnerId: string | null = null;
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
          .select("id, status, tier, ip_whitelist, allowed_domains, owner_user_id")
          .eq("id", keyRow.partner_id)
          .maybeSingle<PartnerRow>();
        partnerOwnerId = partner?.owner_user_id ?? null;

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
          const route = matchRoute(req.method, path);
          if (!route) {
            statusCode = 404;
            errorMsg = "Route not found";
            responseBody = json(
              404,
              { code: "route_not_found", message: `Unknown endpoint ${routeKey}` },
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
            responseBody = await dispatch(supabase, path, req, requestId, partnerOwnerId, startTime);
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
    reportEdgeError({
      scope: "api-gateway",
      level: "error",
      message: e instanceof Error ? e.message : String(e),
      endpoint: path,
      requestId,
      status: 500,
      metadata: { stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined, ip, userAgent, origin },
    });
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
async function dispatch(supabase: any, path: string, req: Request, requestId: string, partnerOwnerId: string | null, startTime: number): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
  const q = (url.searchParams.get("q") || "").trim();
  const city = (url.searchParams.get("city") || "").trim();

  if (path === "/v1/ping") {
    return json(200, { pong: true, timestamp: new Date().toISOString() }, requestId);
  }

  if (path === "/v1/clinics" && req.method === "GET") {
    let qry = supabase
      .from("registered_clinics")
      .select(
        "id, name, category, address, service_city, phone, email, website, working_hours, specialties, latitude, longitude, logo_url",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);
    if (q) qry = qry.ilike("name", `%${q}%`);
    if (city) qry = qry.ilike("service_city", `%${city}%`);
    const { data, error, count } = await qry;
    if (error) { console.error("api-gateway clinics error:", error); return json(500, { code: "db_error", message: "Internal server error" }, requestId); }
    return json(200, { items: data ?? [], count: count ?? 0, limit, offset }, requestId);
  }

  if (path === "/v1/doctors" && req.method === "GET") {
    let qry = supabase
      .from("doctors")
      .select(
        "id, full_name, specialty, experience_years, consultation_price, avg_rating, review_count, languages, online_consultation, city, region, photo_url",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("avg_rating", { ascending: false })
      .range(offset, offset + limit - 1);
    if (q) qry = qry.ilike("full_name", `%${q}%`);
    if (city) qry = qry.ilike("city", `%${city}%`);
    const specialty = url.searchParams.get("specialty");
    if (specialty) qry = qry.ilike("specialty", `%${specialty}%`);
    const { data, error, count } = await qry;
    if (error) { console.error("api-gateway doctors error:", error); return json(500, { code: "db_error", message: "Internal server error" }, requestId); }
    return json(200, { items: data ?? [], count: count ?? 0, limit, offset }, requestId);
  }

  if (path === "/v1/diagnostics" && req.method === "GET") {
    let qry = supabase
      .from("registered_diagnostics")
      .select(
        "id, name, address, city, region, phone, email, website, working_hours, specialties, equipment_info, latitude, longitude, logo_url",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);
    if (q) qry = qry.ilike("name", `%${q}%`);
    if (city) qry = qry.ilike("city", `%${city}%`);
    const { data, error, count } = await qry;
    if (error) { console.error("api-gateway diagnostics error:", error); return json(500, { code: "db_error", message: "Internal server error" }, requestId); }
    return json(200, { items: data ?? [], count: count ?? 0, limit, offset }, requestId);
  }

  if (path === "/v1/pharmacies" && req.method === "GET") {
    let qry = supabase
      .from("registered_pharmacies")
      .select(
        "id, name, pharmacy_type, address, city, region, phone, email, website, working_hours, is_24h, has_delivery, avg_rating, review_count, latitude, longitude, logo_url",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("avg_rating", { ascending: false })
      .range(offset, offset + limit - 1);
    if (q) qry = qry.ilike("name", `%${q}%`);
    if (city) qry = qry.ilike("city", `%${city}%`);
    if (url.searchParams.get("is_24h") === "true") qry = qry.eq("is_24h", true);
    if (url.searchParams.get("has_delivery") === "true") qry = qry.eq("has_delivery", true);
    const { data, error, count } = await qry;
    if (error) { console.error("api-gateway pharmacies error:", error); return json(500, { code: "db_error", message: "Internal server error" }, requestId); }
    return json(200, { items: data ?? [], count: count ?? 0, limit, offset }, requestId);
  }

  if (path === "/v1/ai/chat" && req.method === "POST") {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json(500, { code: "ai_unconfigured", message: "AI gateway is not configured" }, requestId);
    }
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json(400, { code: "invalid_json", message: "Body must be JSON" }, requestId);
    }
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
      return json(400, { code: "invalid_messages", message: "`messages` array required" }, requestId);
    }
    if (messages.length > 30) {
      return json(400, { code: "too_many_messages", message: "Max 30 messages per request" }, requestId);
    }
    const mapped = mapModel(typeof body?.model === "string" ? body.model : null, { service: "api-gateway:ai-chat" });
    const model = mapped.model;
    const usageId = partnerOwnerId
      ? await createAiUsageEvent({ userId: partnerOwnerId, serviceId: "api-gateway:ai-chat", req, channel: "api", model })
      : null;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: typeof body?.temperature === "number" ? body.temperature : 0.7,
      }),
    });

    if (aiRes.status === 429) {
      await instrumentError(usageId, startTime, { status: "rate_limited", errorCode: "429", errorMessage: "AI rate limit reached" });
      return json(429, { code: "ai_rate_limited", message: "AI rate limit reached, retry later" }, requestId);
    }
    if (aiRes.status === 402) {
      await instrumentError(usageId, startTime, { status: "error", errorCode: "402", errorMessage: "AI credits exhausted" });
      return json(402, { code: "ai_credits_exhausted", message: "AI credits exhausted" }, requestId);
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      await instrumentError(usageId, startTime, { status: statusFromHttp(aiRes.status), errorCode: String(aiRes.status), errorMessage: txt.slice(0, 500) });
      return json(502, { code: "ai_upstream_error", message: txt.slice(0, 300) }, requestId);
    }
    const ai = await aiRes.json();
    await instrumentJson(ai, usageId, startTime, estimateTokensFromMessages(messages), ai?.choices?.[0]?.message?.content || "");
    return json(
      200,
      {
        model,
        message: ai?.choices?.[0]?.message ?? null,
        usage: ai?.usage ?? null,
      },
      requestId,
    );
  }

  // ==================== Dynamic entity GETs ====================
  const clinicIdMatch = path.match(/^\/v1\/clinics\/([^/]+)$/);
  if (clinicIdMatch && req.method === "GET") {
    const { data, error } = await supabase.from("registered_clinics").select("*").eq("id", clinicIdMatch[1]).maybeSingle();
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    if (!data) return json(404, { code: "not_found", message: "Clinic not found" }, requestId);
    return json(200, data, requestId);
  }
  const doctorIdMatch = path.match(/^\/v1\/doctors\/([^/]+)$/);
  if (doctorIdMatch && req.method === "GET") {
    const { data, error } = await supabase.from("doctors").select("*").eq("id", doctorIdMatch[1]).maybeSingle();
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    if (!data) return json(404, { code: "not_found", message: "Doctor not found" }, requestId);
    return json(200, data, requestId);
  }
  const diagIdMatch = path.match(/^\/v1\/diagnostics\/([^/]+)$/);
  if (diagIdMatch && req.method === "GET") {
    const { data, error } = await supabase.from("registered_diagnostics").select("*").eq("id", diagIdMatch[1]).maybeSingle();
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    if (!data) return json(404, { code: "not_found", message: "Not found" }, requestId);
    return json(200, data, requestId);
  }
  const pharmIdMatch = path.match(/^\/v1\/pharmacies\/([^/]+)$/);
  if (pharmIdMatch && req.method === "GET") {
    const { data, error } = await supabase.from("registered_pharmacies").select("*").eq("id", pharmIdMatch[1]).maybeSingle();
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    if (!data) return json(404, { code: "not_found", message: "Not found" }, requestId);
    return json(200, data, requestId);
  }

  // ==================== Maternity list ====================
  if (path === "/v1/maternity" && req.method === "GET") {
    let qry = supabase.from("registered_maternity").select("*", { count: "exact" })
      .eq("is_active", true).order("name").range(offset, offset + limit - 1);
    if (q) qry = qry.ilike("name", `%${q}%`);
    if (city) qry = qry.ilike("city", `%${city}%`);
    const { data, error, count } = await qry;
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [], count: count ?? 0, limit, offset }, requestId);
  }

  // ==================== AUTH ====================
  if (path.startsWith("/v1/auth/") && req.method === "POST") {
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body OK */ }
    const authUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const call = async (endpoint: string, payload: any) => {
      const r = await fetch(`${authUrl}/auth/v1/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      return { status: r.status, body: j };
    };

    if (path === "/v1/auth/login") {
      const r = await call("token?grant_type=password", { email: body.email, password: body.password, phone: body.phone });
      return json(r.status < 400 ? 200 : r.status, r.body, requestId);
    }
    if (path === "/v1/auth/register") {
      const r = await call("signup", { email: body.email, password: body.password, phone: body.phone, data: body.metadata || {} });
      return json(r.status < 400 ? 201 : r.status, r.body, requestId);
    }
    if (path === "/v1/auth/refresh") {
      const r = await call("token?grant_type=refresh_token", { refresh_token: body.refresh_token });
      return json(r.status < 400 ? 200 : r.status, r.body, requestId);
    }
    if (path === "/v1/auth/logout") {
      const at = body.access_token || req.headers.get("x-user-token");
      if (!at) return json(400, { code: "no_token", message: "access_token required" }, requestId);
      const r = await fetch(`${authUrl}/auth/v1/logout`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${at}` } });
      return json(r.ok ? 200 : r.status, { logged_out: r.ok }, requestId);
    }
    if (path === "/v1/auth/forgot-password") {
      const r = await call("recover", { email: body.email });
      return json(r.status < 400 ? 200 : r.status, r.body, requestId);
    }
    if (path === "/v1/auth/otp/send") {
      const r = await call("otp", { phone: body.phone, email: body.email, create_user: body.create_user ?? true });
      return json(r.status < 400 ? 200 : r.status, r.body, requestId);
    }
    if (path === "/v1/auth/otp/verify") {
      const r = await call("verify", { type: body.type || "sms", phone: body.phone, email: body.email, token: body.token });
      return json(r.status < 400 ? 200 : r.status, r.body, requestId);
    }
  }

  // ==================== USER ====================
  if (path === "/v1/user/profile" && req.method === "GET") {
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    if (!uid) return json(401, { code: "no_user", message: "x-user-id header required" }, requestId);
    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, data || {}, requestId);
  }
  if (path === "/v1/user/profile" && req.method === "PATCH") {
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    if (!uid) return json(401, { code: "no_user", message: "x-user-id header required" }, requestId);
    let body: any = {}; try { body = await req.json(); } catch {}
    const allowed = ["full_name", "phone", "avatar_url", "language", "region", "district"];
    const patch: any = {};
    for (const k of allowed) if (k in body) patch[k] = body[k];
    const { data, error } = await supabase.from("profiles").update(patch).eq("user_id", uid).select().maybeSingle();
    if (error) return json(400, { code: "update_failed", message: error.message }, requestId);
    return json(200, data, requestId);
  }
  if (path === "/v1/user/settings" && req.method === "PATCH") {
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    if (!uid) return json(401, { code: "no_user", message: "x-user-id header required" }, requestId);
    let body: any = {}; try { body = await req.json(); } catch {}
    const patch: any = {};
    if (body.language) patch.language = body.language;
    const { data, error } = await supabase.from("profiles").update(patch).eq("user_id", uid).select().maybeSingle();
    if (error) return json(400, { code: "update_failed", message: error.message }, requestId);
    return json(200, data, requestId);
  }

  // ==================== AI (14 services -> ai-* edge functions) ====================
  const aiMatch = path.match(/^\/v1\/ai\/([a-z-]+)$/);
  if (aiMatch && req.method === "POST" && aiMatch[1] !== "chat") {
    const AI_MAP: Record<string, string> = {
      doctor: "ai-doctor-chat",
      symptoms: "symptom-checker",
      laboratory: "ai-report-analysis",
      radiology: "ai-radiology",
      pregnancy: "ai-pregnancy",
      "baby-care": "ai-baby-care",
      psychologist: "ai-psixolog",
      diet: "ai-dietolog",
      pharmacy: "ai-farmatsevt",
      cosmetology: "ai-cosmetology",
      fitness: "ai-fitness",
      assistant: "ai-health-assistant",
      monitoring: "ai-health-check",
      prediction: "ai-health-risk",
    };
    const fnName = AI_MAP[aiMatch[1]];
    if (!fnName) return json(404, { code: "unknown_ai_service", message: `Unknown AI service: ${aiMatch[1]}` }, requestId);
    let body: any = {}; try { body = await req.json(); } catch {}
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const r = await fetch(`${supaUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    return json(r.ok ? 200 : r.status, parsed, requestId);
  }

  // ==================== EMR (patient-scoped reads) ====================
  if (path.startsWith("/v1/emr/") && req.method === "GET") {
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    if (!uid) return json(401, { code: "no_user", message: "x-user-id header required" }, requestId);
    let table = "";
    if (path === "/v1/emr/records") table = "medical_records";
    else if (path === "/v1/emr/analyses") table = "hms_lab_results";
    else if (path === "/v1/emr/prescriptions") table = "doctor_prescriptions";
    else if (path === "/v1/emr/diagnoses") table = "health_records";
    if (!table) return json(404, { code: "not_found", message: "Unknown EMR path" }, requestId);
    const { data, error } = await supabase.from(table).select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(limit);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [], count: (data ?? []).length }, requestId);
  }

  // ==================== PAYMENTS ====================
  if (path === "/v1/payments/history" && req.method === "GET") {
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    if (!uid) return json(401, { code: "no_user", message: "x-user-id header required" }, requestId);
    const { data, error } = await supabase.from("ai_payments").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(limit);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [] }, requestId);
  }
  if (path === "/v1/subscriptions" && req.method === "GET") {
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    if (!uid) return json(401, { code: "no_user", message: "x-user-id header required" }, requestId);
    const { data, error } = await supabase.from("user_ai_subscriptions").select("*").eq("user_id", uid);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [] }, requestId);
  }
  if (path.startsWith("/v1/payments/") && req.method === "POST") {
    const provider = path.split("/").pop();
    let body: any = {}; try { body = await req.json(); } catch {}
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const fnMap: Record<string, string> = { click: "click-create-invoice", payme: "payme-create-invoice", uzum: "uzum-create-invoice" };
    const fn = fnMap[provider || ""];
    if (!fn) return json(404, { code: "unknown_provider", message: "Unknown payment provider" }, requestId);
    const r = await fetch(`${supaUrl}/functions/v1/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    return json(r.ok ? 200 : r.status, parsed, requestId);
  }

  // ==================== NOTIFICATIONS ====================
  if (path === "/v1/notifications/telegram" && req.method === "POST") {
    let body: any = {}; try { body = await req.json(); } catch {}
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const r = await fetch(`${supaUrl}/functions/v1/telegram-notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    return json(r.ok ? 200 : r.status, parsed, requestId);
  }
  if (path === "/v1/notifications/email" && req.method === "POST") {
    let body: any = {}; try { body = await req.json(); } catch {}
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const r = await fetch(`${supaUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    return json(r.ok ? 200 : r.status, parsed, requestId);
  }
  if ((path === "/v1/notifications/push" || path === "/v1/notifications/sms") && req.method === "POST") {
    return json(202, { queued: true, note: "SMS/Push queued for future dispatch" }, requestId);
  }

  // ==================== MAPS ====================
  if (path === "/v1/maps/nearby" && req.method === "GET") {
    const lat = parseFloat(url.searchParams.get("lat") || "0");
    const lng = parseFloat(url.searchParams.get("lng") || "0");
    const radiusKm = parseFloat(url.searchParams.get("radius_km") || "10");
    if (!lat || !lng) return json(400, { code: "invalid_coords", message: "lat and lng required" }, requestId);
    const { data, error } = await supabase.from("registered_clinics").select("id, name, address, latitude, longitude, phone").eq("is_active", true).not("latitude", "is", null).limit(200);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const items = (data ?? []).map((c: any) => {
      const dLat = toRad(c.latitude - lat), dLng = toRad(c.longitude - lng);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat))*Math.cos(toRad(c.latitude))*Math.sin(dLng/2)**2;
      return { ...c, distance_km: Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 100)/100 };
    }).filter((c: any) => c.distance_km <= radiusKm).sort((a: any, b: any) => a.distance_km - b.distance_km);
    return json(200, { items, count: items.length }, requestId);
  }
  if (path === "/v1/maps/geofence" && req.method === "GET") {
    const { data, error } = await supabase.from("geofence_zones").select("*").eq("is_active", true);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [] }, requestId);
  }

  // ==================== APPOINTMENTS ====================
  if ((path === "/v1/bookings" || path === "/v1/appointments") && req.method === "POST") {
    let body: any = {}; try { body = await req.json(); } catch {}
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    const { data, error } = await supabase.from("appointments").insert({
      user_id: uid,
      clinic_id: body.clinic_id,
      doctor_id: body.doctor_id,
      service_id: body.service_id,
      appointment_date: body.date,
      appointment_time: body.time,
      patient_name: body.patient_name,
      patient_phone: body.patient_phone,
      notes: body.notes,
      status: "pending",
    }).select().maybeSingle();
    if (error) return json(400, { code: "insert_failed", message: error.message }, requestId);
    return json(201, data, requestId);
  }
  if (path === "/v1/appointments/history" && req.method === "GET") {
    const uid = req.headers.get("x-user-id") || partnerOwnerId;
    if (!uid) return json(401, { code: "no_user", message: "x-user-id header required" }, requestId);
    const { data, error } = await supabase.from("appointments").select("*").eq("user_id", uid).order("appointment_date", { ascending: false }).limit(limit);
    if (error) return json(500, { code: "db_error", message: error.message }, requestId);
    return json(200, { items: data ?? [] }, requestId);
  }
  const apptDelMatch = path.match(/^\/v1\/appointments\/([^/]+)$/);
  if (apptDelMatch && req.method === "DELETE") {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", apptDelMatch[1]);
    if (error) return json(400, { code: "cancel_failed", message: error.message }, requestId);
    return json(200, { cancelled: true, id: apptDelMatch[1] }, requestId);
  }
  const checkinMatch = path.match(/^\/v1\/appointments\/([^/]+)\/checkin$/);
  if (checkinMatch && req.method === "POST") {
    const { data, error } = await supabase.from("appointments").update({ status: "checked_in", checked_in_at: new Date().toISOString() }).eq("id", checkinMatch[1]).select().maybeSingle();
    if (error) return json(400, { code: "checkin_failed", message: error.message }, requestId);
    return json(200, data, requestId);
  }

  return json(501, { code: "not_implemented", message: `${path} handler pending` }, requestId);
}
