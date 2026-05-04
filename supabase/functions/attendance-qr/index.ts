// Generates a fresh rotating QR token for a clinic. Owners/admins only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return j({ error: "unauthorized" }, 401);

    const { clinic_id } = await req.json();
    if (!clinic_id) return j({ error: "clinic_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Verify ownership or admin
    const [{ data: clinic }, { data: roles }] = await Promise.all([
      admin.from("registered_clinics").select("owner_id").eq("id", clinic_id).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", userData.user.id),
    ]);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    if (!isAdmin && clinic?.owner_id !== userData.user.id) return j({ error: "forbidden" }, 403);

    const { data: settings } = await admin.from("hms_attendance_settings").select("qr_rotate_seconds").eq("clinic_id", clinic_id).maybeSingle();
    const ttl = settings?.qr_rotate_seconds ?? 60;

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const expires_at = new Date(Date.now() + ttl * 1000).toISOString();

    const { data: tok, error } = await admin.from("hms_attendance_qr_tokens").insert({ clinic_id, token, expires_at }).select().single();
    if (error) return j({ error: error.message }, 500);

    return j({ token: tok.token, expires_at: tok.expires_at, ttl });
  } catch (e: any) {
    return j({ error: e?.message || "error" }, 500);
  }
});

function j(b: any, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
