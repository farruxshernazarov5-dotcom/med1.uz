import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_knowledge",
  title: "Search medical knowledge base",
  description:
    "Full-text search over MED1.UZ's published medical knowledge articles (Uzbek, Russian, English). Returns title, excerpt, category, language and slug.",
  inputSchema: {
    query: z.string().min(2).describe("Search query (medical term, symptom, disease name)."),
    language: z.enum(["uz", "ru", "en"]).optional().describe("Filter by article language."),
    limit: z.number().int().min(1).max(20).optional().describe("Max results (default 5)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, language, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("knowledge_articles")
      .select("title, excerpt, category, language, slug")
      .eq("published", true)
      .textSearch("search_vector", query, { type: "websearch" })
      .limit(limit ?? 5);
    if (language) q = q.eq("language", language);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
