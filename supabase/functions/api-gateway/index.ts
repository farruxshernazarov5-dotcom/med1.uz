// MED-ALL AI Enterprise API Gateway
// Single entry point for all partner API calls. Authenticates via x-api-key,
// enforces scopes, IP/domain restrictions, logs every request, and proxies
// to internal handlers (clinic, doctor, lab, pharmacy, emr, ai, payment).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAiUsageEvent, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

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
    const allowedModels = new Set([
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
      "google/gemini-2.5-pro",
      "openai/gpt-5-mini",
      "openai/gpt-5-nano",
    ]);
    const model = typeof body?.model === "string" && allowedModels.has(body.model)
      ? body.model
      : "google/gemini-3-flash-preview";
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

  return json(501, { code: "not_implemented", message: `${path} handler pending` }, requestId);
}
