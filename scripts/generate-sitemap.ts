// Generates public/sitemap.xml from app routes + static data files.
// Runs before `vite dev` and `vite build` via predev/prebuild hooks.

import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.med1.uz";

interface Entry {
  path: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
  lastmod?: string;
}

const today = new Date().toISOString().slice(0, 10);

// ---- Static routes ----
const staticEntries: Entry[] = [
  { path: "/",                    changefreq: "daily",   priority: "1.0" },
  { path: "/medicine",            changefreq: "weekly",  priority: "0.9" },
  { path: "/health",              changefreq: "weekly",  priority: "0.9" },
  { path: "/diseases",            changefreq: "weekly",  priority: "0.9" },
  { path: "/articles",            changefreq: "weekly",  priority: "0.8" },
  { path: "/news",                changefreq: "daily",   priority: "0.8" },
  { path: "/clinics",             changefreq: "daily",   priority: "0.9" },
  { path: "/diagnostics",         changefreq: "weekly",  priority: "0.8" },
  { path: "/pharmacies",          changefreq: "weekly",  priority: "0.8" },
  { path: "/blood-banks",         changefreq: "weekly",  priority: "0.7" },
  { path: "/maternity",           changefreq: "weekly",  priority: "0.7" },
  { path: "/cosmetology",         changefreq: "weekly",  priority: "0.7" },
  { path: "/dental",              changefreq: "weekly",  priority: "0.8" },
  { path: "/med-tech",            changefreq: "weekly",  priority: "0.7" },
  { path: "/knowledge",           changefreq: "weekly",  priority: "0.8" },
  { path: "/ai-services",         changefreq: "weekly",  priority: "0.8" },
  { path: "/referral",            changefreq: "monthly", priority: "0.5" },
  { path: "/about",               changefreq: "monthly", priority: "0.5" },
  { path: "/contact",             changefreq: "monthly", priority: "0.5" },
  { path: "/terms",               changefreq: "yearly",  priority: "0.3" },
  { path: "/privacy",             changefreq: "yearly",  priority: "0.3" },
  { path: "/disclaimer",          changefreq: "yearly",  priority: "0.3" },
  { path: "/saas-terms",          changefreq: "yearly",  priority: "0.3" },
  { path: "/referral-terms",      changefreq: "yearly",  priority: "0.3" },
  { path: "/api-docs",            changefreq: "monthly", priority: "0.4" },
  { path: "/auth",                changefreq: "monthly", priority: "0.5" },
  { path: "/check-in",            changefreq: "monthly", priority: "0.4" },
  { path: "/dashboard",           changefreq: "weekly",  priority: "0.5" },
  { path: "/booking",             changefreq: "weekly",  priority: "0.5" },
  // Registration flows (previously missing from sitemap)
  { path: "/clinic-register",       changefreq: "monthly", priority: "0.4" },
  { path: "/vendor-register",       changefreq: "monthly", priority: "0.4" },
  { path: "/diagnostics-register",  changefreq: "monthly", priority: "0.4" },
  { path: "/maternity-register",    changefreq: "monthly", priority: "0.4" },
  { path: "/dental-register",       changefreq: "monthly", priority: "0.4" },
  { path: "/pharmacy-register",     changefreq: "monthly", priority: "0.4" },
  { path: "/doctor-register",       changefreq: "monthly", priority: "0.4" },
  { path: "/blood-donor-register",  changefreq: "monthly", priority: "0.4" },
  // Common dashboard role landings (covers /dashboard/:type)
  { path: "/dashboard/patient",     changefreq: "weekly",  priority: "0.4" },
  { path: "/dashboard/doctor",      changefreq: "weekly",  priority: "0.4" },
  { path: "/dashboard/clinic",      changefreq: "weekly",  priority: "0.4" },
  { path: "/dashboard/pharmacy",    changefreq: "weekly",  priority: "0.4" },
  { path: "/dashboard/diagnostics", changefreq: "weekly",  priority: "0.4" },
  { path: "/dashboard/maternity",   changefreq: "weekly",  priority: "0.4" },
  { path: "/dashboard/dental",      changefreq: "weekly",  priority: "0.4" },
  { path: "/dashboard/cosmetology", changefreq: "weekly",  priority: "0.4" },
];

// ---- Dynamic routes (mirror page data loaders) ----
const dynamicEntries: Entry[] = [];

async function loadDynamic() {
  // Diseases: /diseases/:categoryId/:slug — split source by category blocks
  try {
    const src = readFileSync(resolve("src/data/diseases.ts"), "utf8");
    // Split on top-level category id markers
    const parts = src.split(/(?=\{\s*id:\s*")/);
    for (const part of parts) {
      const catMatch = part.match(/^\{\s*id:\s*"([^"]+)"/);
      if (!catMatch) continue;
      const catId = catMatch[1];
      if (!/diseases:\s*\[/.test(part)) continue;
      const slugRe = /slug:\s*"([^"]+)"/g;
      let sm: RegExpExecArray | null;
      while ((sm = slugRe.exec(part)) !== null) {
        dynamicEntries.push({
          path: `/diseases/${catId}/${sm[1]}`,
          changefreq: "monthly",
          priority: "0.7",
        });
      }
    }
  } catch (e) { console.warn("diseases load failed:", (e as Error).message); }

  // Articles: /articles/:categoryId and /articles/:categoryId/:slug
  try {
    const src = readFileSync(resolve("src/data/articles.ts"), "utf8");
    const parts = src.split(/(?=\{\s*id:\s*")/);
    for (const part of parts) {
      const catMatch = part.match(/^\{\s*id:\s*"([^"]+)"/);
      if (!catMatch) continue;
      const catId = catMatch[1];
      if (!/title:\s*"/.test(part)) continue;
      dynamicEntries.push({
        path: `/articles/${catId}`,
        changefreq: "weekly",
        priority: "0.7",
      });
      const slugRe = /slug:\s*"([^"]+)"/g;
      let sm: RegExpExecArray | null;
      while ((sm = slugRe.exec(part)) !== null) {
        dynamicEntries.push({
          path: `/articles/${catId}/${sm[1]}`,
          changefreq: "monthly",
          priority: "0.6",
        });
      }
    }
  } catch (e) { console.warn("articles load failed:", (e as Error).message); }

  // Medical terms: /medicine/term/:termId
  try {
    const mod: any = await import("../src/data/medicalTerms");
    const all = mod.default ?? mod.allTerms ?? [];
    const flat = Array.isArray(all) ? all : Object.values(all).flat();
    for (const t of flat as any[]) {
      const id = t?.id ?? t?.slug;
      if (id) dynamicEntries.push({
        path: `/medicine/term/${id}`,
        changefreq: "yearly",
        priority: "0.5",
      });
    }
  } catch (e) { console.warn("medicalTerms load failed:", (e as Error).message); }

  // Clinics: /clinics/:clinicId
  try {
    const mod: any = await import("../src/data/clinicsExternal");
    const list = mod.externalClinics ?? [];
    for (const c of list) {
      if (c.id) dynamicEntries.push({
        path: `/clinics/${c.id}`,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  } catch (e) { console.warn("clinics load failed:", (e as Error).message); }

  // News: /news/:newsId — regex parse to avoid loading image assets via tsx
  try {
    const src = readFileSync(resolve("src/data/news.ts"), "utf8");
    const idRe = /id:\s*"([^"]+)"/g;
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = idRe.exec(src)) !== null) {
      const id = m[1];
      // skip category ids (short slugs like "research"); news ids look like "news-..." in this dataset
      if (seen.has(id)) continue;
      seen.add(id);
      dynamicEntries.push({
        path: `/news/${id}`,
        changefreq: "monthly",
        priority: "0.6",
      });
    }
  } catch (e) { console.warn("news load failed:", (e as Error).message); }

  // Dental clinics: /dental/:slug (static JSON dataset)
  try {
    const raw = JSON.parse(readFileSync(resolve("src/data/dental-clinics.json"), "utf8"));
    const list: any[] = Array.isArray(raw) ? raw : (raw.clinics ?? raw.items ?? []);
    const seen = new Set<string>();
    for (const c of list) {
      const slug = c?.slug;
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      dynamicEntries.push({ path: `/dental/${slug}`, changefreq: "weekly", priority: "0.6" });
    }
  } catch (e) { console.warn("dental clinics load failed:", (e as Error).message); }

  // Doctors: /doctors/ext/:slug (from Lovable Cloud database, public read)
  try {
    const env = readFileSync(resolve(".env"), "utf8");
    const pick = (k: string) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim().replace(/^["']|["']$/g, "");
    const url = pick("VITE_SUPABASE_URL");
    const key = pick("VITE_SUPABASE_PUBLISHABLE_KEY");
    if (url && key) {
      const seen = new Set<string>();
      const PAGE = 1000;
      for (let offset = 0; offset < 20000; offset += PAGE) {
        const res = await fetch(
          `${url}/rest/v1/doctors_external?select=slug&order=slug.asc&limit=${PAGE}&offset=${offset}`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` } },
        );
        if (!res.ok) { console.warn("doctors fetch failed:", res.status); break; }
        const rows: any[] = await res.json();
        for (const r of rows) {
          if (!r?.slug || seen.has(r.slug)) continue;
          seen.add(r.slug);
          dynamicEntries.push({ path: `/doctors/ext/${r.slug}`, changefreq: "weekly", priority: "0.6" });
        }
        if (rows.length < PAGE) break;
      }
      console.log(`doctors: ${seen.size} entries`);
    }
  } catch (e) { console.warn("doctors load failed:", (e as Error).message); }


  // MedTech: /med-tech/:equipmentId
  try {
    const src = readFileSync(resolve("src/data/medtech.ts"), "utf8");
    // Capture ids inside medTechEquipment block only
    const block = src.split("medTechEquipment")[1] ?? "";
    const idRe = /id:\s*"([^"]+)"/g;
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = idRe.exec(block)) !== null) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      dynamicEntries.push({
        path: `/med-tech/${id}`,
        changefreq: "monthly",
        priority: "0.5",
      });
    }
  } catch (e) { console.warn("medtech load failed:", (e as Error).message); }
}

function build(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${e.lastmod ?? today}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  await loadDynamic();
  const all = [...staticEntries, ...dynamicEntries];
  writeFileSync(resolve("public/sitemap.xml"), build(all));
  console.log(`sitemap.xml written (${all.length} entries: ${staticEntries.length} static + ${dynamicEntries.length} dynamic)`);
})();
