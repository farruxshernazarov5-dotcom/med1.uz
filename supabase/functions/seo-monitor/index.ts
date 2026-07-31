// SEO monitoring: sitemap health, robots.txt, structured data and Google Search
// Console indexing state. Admin-only. Sends a Telegram alert when issues appear.
//
// POST /functions/v1/seo-monitor  { "alert": true }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.med1.uz";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

type Issue = { severity: "error" | "warning"; area: string; message: string };

async function checkSitemaps(issues: Issue[]) {
  const result: { file: string; urls: number; status: number }[] = [];
  const indexRes = await fetch(`${SITE}/sitemap.xml`, { headers: { "User-Agent": "Med1-SEO-Monitor" } });
  if (!indexRes.ok) {
    issues.push({ severity: "error", area: "sitemap", message: `sitemap.xml HTTP ${indexRes.status}` });
    return result;
  }
  const xml = await indexRes.text();
  if (!xml.includes("<sitemapindex") && !xml.includes("<urlset")) {
    issues.push({ severity: "error", area: "sitemap", message: "sitemap.xml is not valid XML sitemap markup" });
    return result;
  }
  const children = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  result.push({ file: "sitemap.xml", urls: children.length, status: 200 });

  for (const child of children.slice(0, 20)) {
    try {
      const res = await fetch(child, { headers: { "User-Agent": "Med1-SEO-Monitor" } });
      const body = res.ok ? await res.text() : "";
      const count = (body.match(/<loc>/g) || []).length;
      result.push({ file: child.replace(`${SITE}/`, ""), urls: count, status: res.status });
      if (!res.ok) issues.push({ severity: "error", area: "sitemap", message: `${child} HTTP ${res.status}` });
      else if (count === 0) issues.push({ severity: "warning", area: "sitemap", message: `${child} has 0 URLs` });
      else if (count > 50000) issues.push({ severity: "error", area: "sitemap", message: `${child} exceeds 50 000 URLs` });
    } catch (e) {
      issues.push({ severity: "error", area: "sitemap", message: `${child}: ${(e as Error).message}` });
    }
  }
  return result;
}

async function checkRobots(issues: Issue[]) {
  const res = await fetch(`${SITE}/robots.txt`);
  if (!res.ok) {
    issues.push({ severity: "error", area: "robots", message: `robots.txt HTTP ${res.status}` });
    return { ok: false, hasSitemap: false };
  }
  const txt = await res.text();
  const hasSitemap = /Sitemap:\s*https?:\/\//i.test(txt);
  if (!hasSitemap) issues.push({ severity: "warning", area: "robots", message: "robots.txt has no Sitemap: directive" });
  if (/^\s*User-agent:\s*\*\s*[\r\n]+\s*Disallow:\s*\/\s*$/im.test(txt)) {
    issues.push({ severity: "error", area: "robots", message: "robots.txt blocks all crawlers (Disallow: /)" });
  }
  return { ok: true, hasSitemap };
}

async function checkStructuredData(urls: string[], issues: Issue[]) {
  const out: { url: string; types: string[]; canonical: string | null; title: string | null }[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Med1-SEO-Monitor" } });
      const html = await res.text();
      const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)];
      const types: string[] = [];
      for (const b of blocks) {
        try {
          const parsed = JSON.parse(b[1].trim());
          for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
            if (node?.["@type"]) types.push(String(node["@type"]));
          }
        } catch {
          issues.push({ severity: "error", area: "structured-data", message: `${url}: invalid JSON-LD block` });
        }
      }
      const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1] ?? null;
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;
      if (!types.length) issues.push({ severity: "warning", area: "structured-data", message: `${url}: no JSON-LD found` });
      if (!canonical) issues.push({ severity: "warning", area: "canonical", message: `${url}: canonical tag missing` });
      out.push({ url, types, canonical, title });
    } catch (e) {
      issues.push({ severity: "error", area: "structured-data", message: `${url}: ${(e as Error).message}` });
    }
  }
  return out;
}

async function gsc(path: string, init?: RequestInit) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovableKey || !connKey) return null;
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`GSC ${path} failed [${res.status}]: ${text}`);
    return { error: true, status: res.status, body: text };
  }
  try { return JSON.parse(text); } catch { return { error: true, status: res.status, body: text }; }
}

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try { return target.href.startsWith(new URL(siteUrl).href); } catch { return false; }
}

async function checkSearchConsole(issues: Issue[], selectedSiteUrl?: string) {
  const list = await gsc("/webmasters/v3/sites");
  if (!list) return { available: false as const, reason: "Google Search Console ulanmagan" };
  if ((list as any).error) {
    issues.push({ severity: "error", area: "search-console", message: `Sites list failed (${(list as any).status})` });
    return { available: false as const, reason: (list as any).body?.slice(0, 300) };
  }
  const target = new URL(SITE);
  const matches = ((list as any).siteEntry ?? [])
    .filter((e: any) => e.permissionLevel !== "siteUnverifiedUser" && coversTarget(e.siteUrl, target))
    .map((e: any) => e.siteUrl as string);

  if (!matches.length) {
    issues.push({ severity: "warning", area: "search-console", message: "med1.uz uchun tasdiqlangan property topilmadi" });
    return { available: false as const, reason: "no_verified_property" };
  }
  if (matches.length > 1 && !selectedSiteUrl) {
    return { available: false as const, selection_required: true, candidates: matches };
  }
  const siteUrl = selectedSiteUrl && matches.includes(selectedSiteUrl) ? selectedSiteUrl : matches[0];

  const sitemaps = await gsc(`/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`);
  const sitemapRows = (sitemaps as any)?.sitemap ?? [];
  for (const s of sitemapRows) {
    const errs = Number(s.errors ?? 0);
    const warns = Number(s.warnings ?? 0);
    if (errs > 0) issues.push({ severity: "error", area: "search-console", message: `${s.path}: ${errs} indeksatsiya xatosi` });
    else if (warns > 0) issues.push({ severity: "warning", area: "search-console", message: `${s.path}: ${warns} ogohlantirish` });
  }

  const inspections: any[] = [];
  for (const url of [SITE + "/", SITE + "/doctors", SITE + "/dental"]) {
    const r = await gsc("/v1/urlInspection/index:inspect", {
      method: "POST",
      body: JSON.stringify({ inspectionUrl: url, siteUrl }),
    });
    const idx = (r as any)?.inspectionResult?.indexStatusResult;
    if (idx) {
      inspections.push({
        url,
        verdict: idx.verdict,
        coverageState: idx.coverageState,
        lastCrawl: idx.lastCrawlTime ?? null,
        richResults: (r as any)?.inspectionResult?.richResultsResult?.verdict ?? null,
      });
      if (idx.verdict && idx.verdict !== "PASS") {
        issues.push({ severity: "error", area: "indexing", message: `${url}: ${idx.coverageState ?? idx.verdict}` });
      }
      const rich = (r as any)?.inspectionResult?.richResultsResult?.verdict;
      if (rich && rich === "FAIL") {
        issues.push({ severity: "error", area: "structured-data", message: `${url}: rich results FAIL` });
      }
    }
  }
  return { available: true as const, siteUrl, sitemaps: sitemapRows, inspections };
}

async function sendTelegramAlert(text: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const tgKey = Deno.env.get("TELEGRAM_API_KEY");
  const chatId = Deno.env.get("SEO_ALERT_TELEGRAM_CHAT_ID");
  if (!lovableKey || !tgKey || !chatId) return { sent: false, reason: "telegram_not_configured" };
  const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const body = await res.text();
  if (!res.ok) console.error(`Telegram alert failed [${res.status}]: ${body}`);
  return { sent: res.ok, status: res.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- admin-only ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const issues: Issue[] = [];

    const [sitemaps, robots, structured, searchConsole] = await Promise.all([
      checkSitemaps(issues),
      checkRobots(issues),
      checkStructuredData(
        [`${SITE}/`, `${SITE}/doctors`, `${SITE}/dental`, `${SITE}/knowledge`],
        issues,
      ),
      checkSearchConsole(issues, payload.selectedSiteUrl),
    ]);

    const errors = issues.filter((i) => i.severity === "error");
    const report = {
      checked_at: new Date().toISOString(),
      status: errors.length ? "error" : issues.length ? "warning" : "ok",
      issues,
      sitemaps,
      robots,
      structured,
      search_console: searchConsole,
    };

    let alert: unknown = { sent: false, reason: "not_requested" };
    if (payload.alert !== false && errors.length) {
      alert = await sendTelegramAlert(
        `🚨 <b>MED1.UZ SEO monitoring</b>\n${errors.length} ta xato aniqlandi:\n` +
          errors.slice(0, 10).map((e) => `• [${e.area}] ${e.message}`).join("\n"),
      );
    }

    return new Response(JSON.stringify({ ...report, alert }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-monitor error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
