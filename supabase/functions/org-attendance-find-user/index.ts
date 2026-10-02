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

    const admin = createClient(URL, SVC);

    // Only organisation (business) accounts may link staff.
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    const business = new Set(["admin", "clinic", "diagnostics", "maternity", "cosmetology", "doctor", "pharmacy", "bloodbank", "dental", "vendor"]);
    if (!(roles || []).some((r: any) => business.has(r.role))) return j({ error: "forbidden" }, 403);

    const { query } = await req.json();
    if (!query || typeof query !== "string") return j({ error: "Email yoki telefon kiriting" }, 400);
    const q = query.trim().toLowerCase().slice(0, 200);
    const results: any[] = [];

    // Exact match only (no partial directory search).
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q);
    const phoneDigits = q.replace(/\D/g, "");
    if (isEmail) {
      for (let page = 1; page <= 20 && results.length === 0; page++) {
        const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        const users = list?.users || [];
        const hit = users.find((au: any) => (au.email || "").toLowerCase() === q);
        if (hit) results.push({ user_id: hit.id, full_name: hit.user_metadata?.full_name || "", phone: null, email: hit.email });
        if (users.length < 1000) break;
      }
    } else if (phoneDigits.length >= 9 && phoneDigits.length <= 15) {
      const variants = Array.from(new Set([`+${phoneDigits}`, phoneDigits, `+998${phoneDigits.slice(-9)}`]));
      const { data: prof } = await admin.from("profiles").select("user_id, full_name, phone").in("phone", variants).limit(1);
      (prof || []).forEach((p: any) => results.push({ user_id: p.user_id, full_name: p.full_name, phone: p.phone, email: null }));
    } else {
      return j({ error: "To'liq email yoki telefon raqam kiriting" }, 400);
    }

    return j({ results });
  } catch (e: any) {
    return j({ error: "error" }, 500);
  }
});
function j(b: any, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
