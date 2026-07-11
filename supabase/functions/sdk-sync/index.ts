// sdk-sync — admin-only SDK registry + link verifier.
// Keeps api_sdk_versions synchronized with the SDK files served from med1.uz/sdk/*
// and enables repository links only after the configured GitHub URL becomes reachable.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LinkStatus = "available" | "missing" | "error" | "not_configured";

interface SdkManifestItem {
  language: string;
  version: string;
  changelog: string;
  downloadPath: string;
  repoPath: string;
}

const SITE_ORIGIN = (Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://med1.uz").replace(/\/$/, "");
const REPOSITORY_BASE_URL = (Deno.env.get("SDK_REPOSITORY_BASE_URL") || "https://github.com/med1uz/med1-sdk/tree/main").replace(/\/$/, "");

const SDK_MANIFEST: SdkManifestItem[] = [
  {
    language: "curl",
    version: "1.0.0",
    changelog: "REST API uchun tayyor cURL namunalari va HMAC signature flow.",
    downloadPath: "/sdk/curl-examples.md",
    repoPath: "curl",
  },
  {
    language: "javascript",
    version: "0.1.0",
    changelog: "Browser/Node JavaScript client with signed API requests.",
    downloadPath: "/sdk/med1-js.ts",
    repoPath: "javascript",
  },
  {
    language: "typescript",
    version: "0.1.0",
    changelog: "Typed TypeScript client exported from the JavaScript SDK source.",
    downloadPath: "/sdk/med1-js.ts",
    repoPath: "typescript",
  },
  {
    language: "flutter",
    version: "0.1.0",
    changelog: "Flutter package client for mobile API integrations.",
    downloadPath: "/sdk/flutter/med1_api/lib/med1_api.dart",
    repoPath: "flutter",
  },
  {
    language: "dart",
    version: "0.1.0",
    changelog: "Pure Dart client used by Flutter and server-side Dart apps.",
    downloadPath: "/sdk/flutter/med1_api/lib/med1_api.dart",
    repoPath: "dart",
  },
  {
    language: "kotlin",
    version: "0.1.0",
    changelog: "Android Kotlin client with HMAC signing helpers.",
    downloadPath: "/sdk/Med1Client.kt",
    repoPath: "kotlin",
  },
  {
    language: "swift",
    version: "0.1.0",
    changelog: "iOS Swift client with async URLSession support.",
    downloadPath: "/sdk/Med1Client.swift",
    repoPath: "swift",
  },
  {
    language: "python",
    version: "0.1.0",
    changelog: "Python requests-based client with signature helpers.",
    downloadPath: "/sdk/med1_client.py",
    repoPath: "python",
  },
  {
    language: "php",
    version: "0.1.0",
    changelog: "PHP cURL client with signed request utilities.",
    downloadPath: "/sdk/Med1Client.php",
    repoPath: "php",
  },
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

async function verifyUrl(url: string | null): Promise<{ status: LinkStatus; code: number | null; error: string | null }> {
  if (!url) return { status: "not_configured", code: null, error: null };
  try {
    let res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "MED1-SDK-Link-Verifier/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 405 || res.status === 403) {
      await res.body?.cancel().catch(() => {});
      res = await fetch(url, {
        method: "GET",
        headers: { "Range": "bytes=0-64", "User-Agent": "MED1-SDK-Link-Verifier/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
    }
    await res.body?.cancel().catch(() => {});
    if (res.ok) return { status: "available", code: res.status, error: null };
    if (res.status === 404 || res.status === 410) return { status: "missing", code: res.status, error: `HTTP ${res.status}` };
    return { status: "error", code: res.status, error: `HTTP ${res.status}` };
  } catch (e) {
    return { status: "error", code: null, error: e instanceof Error ? e.message.slice(0, 240) : String(e).slice(0, 240) };
  }
}

async function assertAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const client = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await client.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsErr || !userId) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  const { data: isAdmin, error } = await client.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !isAdmin) throw new Response(JSON.stringify({ error: "Forbidden — admins only" }), { status: 403, headers: corsHeaders });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    await assertAdmin(req);
  } catch (response) {
    if (response instanceof Response) return response;
    return json({ error: "Unauthorized" }, 401);
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return json({ error: "Backend service key unavailable" }, 500);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const checkedAt = new Date().toISOString();
  const nextRetryAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const items = [];

  for (const item of SDK_MANIFEST) {
    const downloadUrl = `${SITE_ORIGIN}${item.downloadPath}`;
    const repositoryCandidate = `${REPOSITORY_BASE_URL}/${item.repoPath}`;
    const [download, repository] = await Promise.all([
      verifyUrl(downloadUrl),
      verifyUrl(repositoryCandidate),
    ]);

    const repositoryUrl = repository.status === "available" ? repositoryCandidate : null;

    const payload = {
      language: item.language,
      version: item.version,
      is_latest: true,
      changelog: item.changelog,
      download_url: downloadUrl,
      repository_url: repositoryUrl,
      download_status: download.status,
      download_status_code: download.code,
      download_checked_at: checkedAt,
      download_error: download.error,
      repository_status: repository.status === "missing" && !repositoryUrl ? "not_configured" : repository.status,
      repository_status_code: repository.code,
      repository_checked_at: checkedAt,
      repository_error: repository.status === "available" ? null : repository.error,
      next_retry_at: download.status === "available" ? null : nextRetryAt,
    };

    await admin
      .from("api_sdk_versions")
      .update({ is_latest: false })
      .eq("language", item.language)
      .neq("version", item.version);

    const { error } = await admin
      .from("api_sdk_versions")
      .upsert(payload, { onConflict: "language,version" });

    if (error) {
      return json({ error: "SDK registry update failed", language: item.language, details: error.message }, 500);
    }

    items.push(payload);
  }

  return json({ ok: true, synced: items.length, checked_at: checkedAt, site_origin: SITE_ORIGIN, items });
});