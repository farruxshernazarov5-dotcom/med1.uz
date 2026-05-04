// Universal QR generator for any organization owner.
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

    const { owner_id } = await req.json();
    const ownerId = owner_id || u.user.id;
    const admin = createClient(URL, SVC);

    if (ownerId !== u.user.id) {
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
      const isAdmin = (roles || []).some((r: any) => r.role === "admin");
      if (!isAdmin) return j({ error: "forbidden" }, 403);
    }

    const { data: settings } = await admin.from("org_attendance_settings").select("qr_rotate_seconds").eq("owner_id", ownerId).maybeSingle();
    const ttl = settings?.qr_rotate_seconds ?? 60;
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const expires_at = new Date(Date.now() + ttl * 1000).toISOString();

    const { data, error } = await admin.from("org_attendance_qr_tokens").insert({ owner_id: ownerId, token, expires_at }).select().single();
    if (error) return j({ error: error.message }, 500);
    return j({ token: data.token, expires_at: data.expires_at, ttl });
  } catch (e: any) { return j({ error: e?.message || "error" }, 500); }
});
function j(b: any, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
