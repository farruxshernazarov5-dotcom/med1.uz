import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_clinics",
  title: "List active MED1.UZ clinics",
  description:
    "List active clinics registered on MED1.UZ, optionally filtered by category or city. Returns name, category, phone, address and specialties.",
  inputSchema: {
    category: z.string().optional().describe("Filter by clinic category (e.g. dental, diagnostics)."),
    city: z.string().optional().describe("Case-insensitive substring match on address."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, city, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("registered_clinics_public")
      .select("name, category, phone, address, specialties, website")
      .eq("is_active", true)
      .limit(limit ?? 10);
    if (category) q = q.eq("category", category);
    if (city) q = q.ilike("address", `%${city}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { clinics: data ?? [] },
    };
  },
});
