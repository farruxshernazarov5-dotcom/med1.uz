// Redeems a QR pairing token on the phone: validates the single-use token,
// then issues a one-time sign-in token for the token owner's account.
// The app completes sign-in with supabase.auth.verifyOtp({ type: "email", ... }).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN_RE = /^[a-f0-9]{48}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { token } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || !TOKEN_RE.test(token)) return j({ error: "invalid_token" }, 400);

    const URL = Deno.env.get("SUPABASE_URL")!;
    const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(URL, SVC);

    // Atomically claim the token: only the first redeem of an unexpired row succeeds.
    const { data: row, error } = await admin
      .from("device_link_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("user_id")
      .maybeSingle();
    if (error) return j({ error: error.message }, 500);
    if (!row) return j({ error: "token_expired_or_used" }, 410);

    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(row.user_id);
    if (userErr || !userData?.user?.email) return j({ error: "user_not_found" }, 404);

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
    });
    if (linkErr || !link?.properties?.hashed_token) return j({ error: "link_failed" }, 500);

    return j({ email: userData.user.email, token_hash: link.properties.hashed_token });
  } catch (e: any) {
    return j({ error: e?.message || "error" }, 500);
  }
});

function j(b: any, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
