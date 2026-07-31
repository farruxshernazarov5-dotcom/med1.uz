// Local/CI SEO health check: validates sitemap files, robots.txt and canonical
// consistency before a deploy. Exits with code 1 when errors are found.
//
//   bunx tsx scripts/seo-healthcheck.ts            # checks generated files in public/
//   bunx tsx scripts/seo-healthcheck.ts --live     # also fetches the live site

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const SITE = "https://www.med1.uz";
const errors: string[] = [];
const warnings: string[] = [];

function checkRobots() {
  const p = resolve("public/robots.txt");
  if (!existsSync(p)) return errors.push("public/robots.txt missing");
  const txt = readFileSync(p, "utf8");
  if (!/Sitemap:\s*https?:\/\//i.test(txt)) warnings.push("robots.txt has no Sitemap: directive");
  if (/User-agent:\s*\*\s*[\r\n]+Disallow:\s*\/\s*$/im.test(txt)) errors.push("robots.txt blocks all crawlers");
}

function checkSitemaps() {
  const indexPath = resolve("public/sitemap.xml");
  if (!existsSync(indexPath)) return errors.push("public/sitemap.xml missing (run predev/prebuild)");
  const xml = readFileSync(indexPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) errors.push("sitemap.xml contains no <loc> entries");

  let total = 0;
  for (const loc of locs) {
    if (!loc.startsWith(SITE)) errors.push(`sitemap entry uses wrong domain: ${loc}`);
    const file = resolve("public", loc.replace(`${SITE}/`, ""));
    if (loc.includes("sitemap") && loc.endsWith(".xml")) {
      if (!existsSync(file)) { errors.push(`referenced sitemap file missing: ${file}`); continue; }
      const child = readFileSync(file, "utf8");
      const urls = (child.match(/<loc>/g) || []).length;
      total += urls;
      if (urls === 0) warnings.push(`${loc} has 0 URLs`);
      if (urls > 50000) errors.push(`${loc} exceeds 50 000 URLs (${urls})`);
      const bad = [...child.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !u.startsWith(SITE));
      if (bad.length) errors.push(`${loc}: ${bad.length} URLs with wrong domain`);
    }
  }
  console.log(`sitemap: ${locs.length} files, ${total} URLs`);
}

async function checkLive() {
  const targets = ["/", "/doctors", "/dental", "/knowledge"];
  for (const t of targets) {
    try {
      const res = await fetch(`${SITE}${t}`, { headers: { "User-Agent": "Med1-SEO-Healthcheck" } });
      if (!res.ok) { errors.push(`${t}: HTTP ${res.status}`); continue; }
      const html = await res.text();
      if (!/<link[^>]+rel="canonical"/.test(html)) warnings.push(`${t}: canonical missing in static HTML`);
      const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)];
      for (const b of ld) {
        try { JSON.parse(b[1].trim()); } catch { errors.push(`${t}: invalid JSON-LD`); }
      }
    } catch (e) {
      errors.push(`${t}: ${(e as Error).message}`);
    }
  }
}

(async () => {
  checkRobots();
  checkSitemaps();
  if (process.argv.includes("--live")) await checkLive();

  for (const w of warnings) console.warn(`⚠️  ${w}`);
  for (const e of errors) console.error(`❌ ${e}`);
  if (!errors.length && !warnings.length) console.log("✅ SEO healthcheck passed");
  process.exit(errors.length ? 1 : 0);
})();
