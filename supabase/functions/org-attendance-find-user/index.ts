// Lookup user_id by email or phone for staff linking. Owner-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const URL = Deno.env.get("SUPABASE_URL")!;
    const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "unauthorized" }, 401);

    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 3) return j({ error: "query > 3 belgi bo'lishi kerak" }, 400);
    const q = query.trim();

    const admin = createClient(URL, SVC);
    const results: any[] = [];

    // Search profiles by phone/full_name
    const { data: byProfile } = await admin
      .from("profiles")
      .select("user_id, full_name, phone")
      .or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(10);
    (byProfile || []).forEach((p: any) => results.push({ user_id: p.user_id, full_name: p.full_name, phone: p.phone, email: null }));

    // Search auth.users by email via admin
    if (q.includes("@") || /^[\w.+-]+@/.test(q)) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 });
      (list?.users || [])
        .filter((au: any) => au.email && au.email.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 10)
        .forEach((au: any) => {
          if (!results.find((r) => r.user_id === au.id)) {
            results.push({ user_id: au.id, full_name: au.user_metadata?.full_name || "", phone: au.phone || "", email: au.email });
          }
        });
    } else {
      // also try matching email containing
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
      (list?.users || [])
        .filter((au: any) => (au.email && au.email.toLowerCase().includes(q.toLowerCase())) || (au.phone && au.phone.includes(q)))
        .slice(0, 10)
        .forEach((au: any) => {
          if (!results.find((r) => r.user_id === au.id)) {
            results.push({ user_id: au.id, full_name: au.user_metadata?.full_name || "", phone: au.phone || "", email: au.email });
          }
        });
    }

    return j({ results: results.slice(0, 15) });
  } catch (e: any) {
    return j({ error: e?.message || "error" }, 500);
  }
});
function j(b: any, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
