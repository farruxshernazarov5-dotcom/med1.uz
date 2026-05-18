// Generates public/sitemap.xml from app routes + static data files.
// Runs before `vite dev` and `vite build` via predev/prebuild hooks.

import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://med1.uz";

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
];

// ---- Dynamic routes (mirror page data loaders) ----
const dynamicEntries: Entry[] = [];

async function loadDynamic() {
  // Diseases: /diseases/:categoryId/:slug
  try {
    const { diseaseCategories } = await import("../src/data/diseases");
    for (const cat of diseaseCategories) {
      for (const d of cat.diseases ?? []) {
        dynamicEntries.push({
          path: `/diseases/${cat.id}/${d.slug}`,
          changefreq: "monthly",
          priority: "0.7",
        });
      }
    }
  } catch (e) { console.warn("diseases load failed:", (e as Error).message); }

  // Articles: /articles/:categoryId and /articles/:categoryId/:slug
  try {
    const mod: any = await import("../src/data/articles");
    const cats = mod.articleCategories ?? [];
    for (const cat of cats) {
      dynamicEntries.push({
        path: `/articles/${cat.id ?? cat.slug}`,
        changefreq: "weekly",
        priority: "0.7",
      });
      for (const a of cat.articles ?? []) {
        dynamicEntries.push({
          path: `/articles/${cat.id ?? cat.slug}/${a.slug}`,
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
