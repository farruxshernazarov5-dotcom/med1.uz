import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Returns true when the request comes from a trusted caller:
 *  - the service role key (other edge functions / scheduled jobs), or
 *  - a signed-in platform admin.
 */
export async function isTrustedCaller(req: Request): Promise<boolean> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (srv && token === srv) return true;
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await client.auth.getClaims(token);
    const uid = data?.claims?.sub;
    if (!uid) return false;
    const { data: isAdmin } = await client.rpc("has_role", { _user_id: uid, _role: "admin" });
    return isAdmin === true;
  } catch {
    return false;
  }
}
