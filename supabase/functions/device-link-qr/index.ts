// Creates a short-lived, single-use token for pairing the Med ALL phone app
// with the account signed in on this device. The token is shown as a QR code;
// the app scans it and redeems it via `device-link-redeem`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TTL_SECONDS = 300; // 5 minutes

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const URL = Deno.env.get("SUPABASE_URL")!;
    const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(URL, SVC);
    const body = await req.json().catch(() => ({}));
    const source_slug = body.source_slug === 'click' ? 'click' : null;
    // Housekeeping: drop this user's expired or already-used tokens.
    await admin.from("device_link_tokens").delete()
      .eq("user_id", u.user.id)
      .or(`expires_at.lt.${new Date().toISOString()},used_at.not.is.null`);

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const expires_at = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();

    const { error } = await admin.from("device_link_tokens").insert({ token, user_id: u.user.id, expires_at, source_slug });
    if (error) return j({ error: error.message }, 500);
    return j({ token, expires_at, ttl: TTL_SECONDS });
  } catch (e: any) {
    return j({ error: e?.message || "error" }, 500);
  }
});

function j(b: any, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
