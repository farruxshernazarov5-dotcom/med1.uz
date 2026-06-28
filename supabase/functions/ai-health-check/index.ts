// Aggregated health endpoint for all AI edge functions.
// GET  /functions/v1/ai-health-check        -> summary of each function
// GET  /functions/v1/ai-health-check?deep=1 -> also pings AI gateway with the function's default model
//
// Output is intentionally lightweight: this is a status surface
// for admins / monitoring, not a real load test. Each function entry
// includes: name, reachable (HEAD/OPTIONS round-trip), latency_ms,
// configured_model (best-effort), and error string if anything failed.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ALLOWED_MODELS, DEFAULT_MODEL } from "../_shared/model-map.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Service id -> (default model, tier label). Defaults to flash unless noted.
const SERVICES: Record<string, { model: string; tier: "flash" | "pro" }> = {
  "symptom-checker":      { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-doctor-chat":       { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-report-analysis":   { model: "google/gemini-2.5-pro",   tier: "pro"   },
  "ai-health-risk":       { model: "google/gemini-2.5-pro",   tier: "pro"   },
  "ai-radiology":         { model: "google/gemini-2.5-pro",   tier: "pro"   },
  "ai-health-assistant":  { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-pregnancy":         { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-baby-care":         { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-cosmetology":       { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-dietolog":          { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-psixolog":          { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-farmatsevt":        { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-fitness":           { model: "google/gemini-2.5-flash", tier: "flash" },
  "ai-smart-search":      { model: "google/gemini-2.5-flash", tier: "flash" },
  "smart-match":          { model: "google/gemini-2.5-flash", tier: "flash" },
  "legal-assistant":      { model: "google/gemini-2.5-flash", tier: "flash" },
  "dental-ai-chat":       { model: "google/gemini-2.5-flash", tier: "flash" },
  "diag-ai-workflow":     { model: "google/gemini-2.5-flash", tier: "flash" },
  "doctor-ai-assistant":  { model: "google/gemini-2.5-flash", tier: "flash" },
};

interface FunctionStatus {
  name: string;
  configured_model: string;
  tier: "flash" | "pro";
  model_allowed: boolean;
  reachable: boolean;
  http_status: number | null;
  latency_ms: number;
  error: string | null;
}

async function pingFunction(baseUrl: string, name: string): Promise<{ ok: boolean; status: number | null; ms: number; error: string | null }> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/${name}`, {
      method: "OPTIONS",
      headers: { "Access-Control-Request-Method": "POST" },
      signal: AbortSignal.timeout(3000),
    });
    // Consume body to avoid resource leak
    await res.text().catch(() => "");
    return { ok: res.status < 500, status: res.status, ms: Date.now() - start, error: null };
  } catch (e) {
    return { ok: false, status: null, ms: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
  }
}

async function pingGateway(model: string): Promise<{ ok: boolean; status: number | null; ms: number; error: string | null }> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { ok: false, status: null, ms: 0, error: "LOVABLE_API_KEY missing" };
  const start = Date.now();
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_completion_tokens: 1,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const txt = await res.text().catch(() => "");
    return {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - start,
      error: res.ok ? null : txt.slice(0, 200),
    };
  } catch (e) {
    return { ok: false, status: null, ms: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "1";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const baseUrl = `${SUPABASE_URL}/functions/v1`;

  // Admin-only gate: validate JWT and check has_role(_, 'admin').
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden — admins only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (_) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }



  const results: FunctionStatus[] = [];
  // Run in parallel — total time stays under ~3s
  await Promise.all(Object.entries(SERVICES).map(async ([name, cfg]) => {
    const ping = await pingFunction(baseUrl, name);
    results.push({
      name,
      configured_model: cfg.model,
      tier: cfg.tier,
      model_allowed: ALLOWED_MODELS.has(cfg.model),
      reachable: ping.ok,
      http_status: ping.status,
      latency_ms: ping.ms,
      error: ping.error,
    });
  }));

  results.sort((a, b) => a.name.localeCompare(b.name));

  let gateway: { ok: boolean; status: number | null; ms: number; error: string | null; model: string } | null = null;
  if (deep) {
    const g = await pingGateway(DEFAULT_MODEL);
    gateway = { ...g, model: DEFAULT_MODEL };
  }

  const summary = {
    healthy_count: results.filter(r => r.reachable && r.model_allowed).length,
    total: results.length,
    invalid_models: results.filter(r => !r.model_allowed).map(r => r.name),
    unreachable: results.filter(r => !r.reachable).map(r => r.name),
  };

  return new Response(JSON.stringify({
    ok: summary.invalid_models.length === 0 && summary.unreachable.length === 0,
    checked_at: new Date().toISOString(),
    summary,
    services: results,
    gateway,
    allowed_models: Array.from(ALLOWED_MODELS),
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
