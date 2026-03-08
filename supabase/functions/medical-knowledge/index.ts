import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// PubMed E-utilities base URL (free, no API key required)
const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const MEDLINEPLUS_BASE = "https://connect.medlineplus.gov/service";

async function searchPubMed(query: string, maxResults = 5): Promise<any[]> {
  try {
    // Search for article IDs
    const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`;
    const searchResp = await fetch(searchUrl);
    const searchData = await searchResp.json();
    const ids = searchData?.esearchresult?.idlist || [];

    if (ids.length === 0) return [];

    // Fetch article summaries
    const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryResp = await fetch(summaryUrl);
    const summaryData = await summaryResp.json();

    const articles: any[] = [];
    for (const id of ids) {
      const article = summaryData?.result?.[id];
      if (article) {
        articles.push({
          pmid: id,
          title: article.title || "",
          authors: (article.authors || []).slice(0, 3).map((a: any) => a.name).join(", "),
          journal: article.fulljournalname || article.source || "",
          pubDate: article.pubdate || "",
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        });
      }
    }
    return articles;
  } catch (err) {
    console.error("PubMed search error:", err);
    return [];
  }
}

async function searchMedlinePlus(query: string): Promise<any[]> {
  try {
    const url = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(query)}&retmax=5`;
    const resp = await fetch(url);
    const text = await resp.text();

    // Parse XML response - extract titles and URLs
    const results: any[] = [];
    const docMatches = text.matchAll(/<document[^>]*url="([^"]*)"[^>]*>[\s\S]*?<content name="title">([^<]*)<\/content>/g);
    for (const match of docMatches) {
      results.push({
        url: match[1],
        title: match[2],
        source: "MedlinePlus",
      });
    }
    return results.slice(0, 5);
  } catch (err) {
    console.error("MedlinePlus search error:", err);
    return [];
  }
}

// ICD-10 lookup via WHO API (free)
async function lookupICD10(code: string): Promise<any | null> {
  try {
    const url = `https://icd.who.int/browse10/2019/en#/${code}`;
    return { code, url, source: "WHO ICD-10" };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, diseaseNames, icdCodes, type } = await req.json();

    if (!query && !diseaseNames?.length && !icdCodes?.length) {
      return new Response(
        JSON.stringify({ error: "Query yoki kasallik nomi kerak" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchTerm = query || (diseaseNames || []).join(" OR ");

    // Parallel fetches to PubMed and MedlinePlus
    const [pubmedArticles, medlinePlusResults] = await Promise.all([
      searchPubMed(`${searchTerm} diagnosis treatment`, 5),
      searchMedlinePlus(searchTerm),
    ]);

    // ICD-10 references
    const icdReferences = (icdCodes || []).map((code: string) => ({
      code,
      url: `https://icd.who.int/browse10/2019/en#/${code}`,
      source: "WHO ICD-10",
    }));

    const result = {
      pubmedArticles,
      medlinePlusResults,
      icdReferences,
      totalResults: pubmedArticles.length + medlinePlusResults.length,
      searchQuery: searchTerm,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("medical-knowledge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
