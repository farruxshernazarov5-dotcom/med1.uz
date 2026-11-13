// reels-media — issues short-lived signed URLs only for approved Med Reels files.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (p: unknown, s = 200) => new Response(JSON.stringify(p), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const paths = Array.isArray(body?.paths) ? body.paths.filter((p: unknown) => typeof p === "string" && p.length < 300).slice(0, 50) : [];
    if (!paths.length) return json({ urls: {} });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await admin.from("medical_reels").select("storage_path, owner_id").eq("status", "approved").in("storage_path", paths);
    const urls: Record<string, string> = {};
    for (const r of data ?? []) {
      if (!r.storage_path || r.storage_path.split("/")[0] !== String(r.owner_id)) continue;
      const { data: s } = await admin.storage.from("medical-reels").createSignedUrl(r.storage_path, 300);
      if (s?.signedUrl) urls[r.storage_path] = s.signedUrl;
    }
    return json({ urls });
  } catch (e) { console.error("reels-media", e); return json({ error: "failed" }, 500); }
});
