import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query = "", lang = "uz", limit = 20 } = await req.json().catch(() => ({}));
    const q = String(query).trim();
    if (q.length < 1) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Local DB search (offline ICD-10)
    const { data: local } = await supa
      .from("icd10_codes")
      .select("code, name_uz, name_ru, name_en, category")
      .or(`code.ilike.${q}%,name_uz.ilike.%${q}%,name_ru.ilike.%${q}%,name_en.ilike.%${q}%`)
      .limit(limit);

    let results = (local || []).map((r: any) => ({
      code: r.code,
      name: r[`name_${lang}`] || r.name_uz || r.name_en,
      category: r.category,
      source: "ICD-10 (local)",
    }));

    // 2) Fallback to NLM Clinical Tables (free, no auth) for ICD-10-CM if results sparse
    if (results.length < 5) {
      try {
        const url = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(q)}&maxList=${limit}`;
        const resp = await fetch(url);
        const data = await resp.json();
        // [total, codes, extra, [[code, name], ...]]
        const items = Array.isArray(data?.[3]) ? data[3] : [];
        const seen = new Set(results.map((r) => r.code));
        for (const it of items) {
          if (!seen.has(it[0])) {
            results.push({
              code: it[0],
              name: it[1],
              category: null,
              source: "ICD-10-CM (NLM)",
            });
          }
        }
      } catch (e) {
        console.error("NLM ICD search fallback failed:", e);
      }
    }

    return new Response(JSON.stringify({ results: results.slice(0, limit) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("icd-search error:", e);
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
