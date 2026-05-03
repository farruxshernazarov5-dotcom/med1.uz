import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  kasallik: ["kasallik", "disease", "syndrome", "sindrom", "infection", "infeksiya"],
  simptom: ["simptom", "symptom", "alomat", "belgisi", "og'riq", "pain"],
  davolash: ["davolash", "treatment", "therapy", "terapiya", "operatsiya", "surgery"],
  dori: ["dori", "drug", "medication", "medicine"],
  diagnostika: ["diagnostika", "diagnosis", "test", "analiz", "skrining"],
  profilaktika: ["profilaktika", "prevention"],
  anatomiya: ["anatomiya", "anatomy"],
  pediatriya: ["bola", "child", "pediatric"],
  ginekologiya: ["homilador", "pregnan", "ginekolog"],
};

const MED_TAGS = [
  "diabet", "yurak", "heart", "saraton", "cancer", "qon", "blood", "o'pka",
  "lung", "buyrak", "kidney", "jigar", "liver", "miya", "brain", "ko'z",
  "eye", "teri", "skin", "bola", "child", "homilador", "pregnan", "insult",
  "stroke", "gripp", "flu", "allergiya", "allergy", "astma", "asthma",
];

function slugify(s: string, salt: string): string {
  let r = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  r = r.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  r = r.slice(0, 90).replace(/^-+|-+$/g, "") || "article";
  // simple hash
  let h = 0;
  for (let i = 0; i < salt.length; i++) h = ((h << 5) - h + salt.charCodeAt(i)) | 0;
  return `${r}-${Math.abs(h).toString(16).slice(0, 6)}`;
}

function categorize(title: string, content: string): string {
  const t = (title + " " + content.slice(0, 500)).toLowerCase();
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keys.some((k) => t.includes(k))) return cat;
  }
  return "ensiklopediya";
}

function extractTags(title: string, content: string): string[] {
  const t = (title + " " + content.slice(0, 300)).toLowerCase();
  const tags = new Set<string>();
  for (const term of MED_TAGS) {
    if (t.includes(term)) tags.add(term.replace(/'/g, "").replace(/\s+/g, "-"));
  }
  return [...tags].slice(0, 8);
}

function parse(raw: string, lang: string) {
  const parts = raw.split(/\n###\s+/);
  const articles: any[] = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const nl = chunk.indexOf("\n");
    if (nl < 0) continue;
    const title = chunk.slice(0, nl).trim();
    let body = chunk.slice(nl + 1);
    const srcMatch = body.match(/\[Source:\s*([^|]+)\|\s*([^\]]+)\]/);
    const sourceName = srcMatch ? srcMatch[1].trim() : null;
    const sourceUrl = srcMatch ? srcMatch[2].trim() : null;
    body = body.replace(/\[Source:[^\]]+\]/g, "").replace(/---\s*(O'ZBEK|ENGLISH)\s*---/g, "");
    body = body.split("\n----------------------------------------")[0].trim();
    if (body.length < 30 || title.length < 3) continue;
    articles.push({
      language: lang,
      slug: slugify(title, `${lang}-${i}-${title.slice(0, 30)}`),
      title,
      content: body,
      excerpt: body.slice(0, 240).replace(/\n/g, " "),
      category: categorize(title, body),
      tags: extractTags(title, body),
      source_name: sourceName,
      source_url: sourceUrl,
    });
  }
  return articles;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    // verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { filename, language, content } = await req.json();
    if (!["uz", "en"].includes(language)) {
      return new Response(JSON.stringify({ error: "Invalid language" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Empty content" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const articles = parse(content, language);
    let inserted = 0, updated = 0;

    // dedupe by slug within batch
    const map = new Map<string, any>();
    articles.forEach((a) => map.set(a.slug, a));
    const unique = [...map.values()];

    // chunked upsert
    const CHUNK = 500;
    for (let i = 0; i < unique.length; i += CHUNK) {
      const slice = unique.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from("knowledge_articles")
        .upsert(slice, { onConflict: "language,slug", ignoreDuplicates: false })
        .select("id");
      if (error) throw error;
      inserted += data?.length || 0;
    }

    await supabase.from("knowledge_imports").insert({
      filename: filename || "upload.txt",
      language,
      total_parsed: articles.length,
      total_inserted: inserted,
      total_updated: updated,
      status: "completed",
      uploaded_by: user.id,
    });

    return new Response(JSON.stringify({ parsed: articles.length, inserted, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("knowledge-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
