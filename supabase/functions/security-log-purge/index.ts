import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, srv);

    const body = await req.json().catch(() => ({}));
    const cronSecret = Deno.env.get("CRON_SECRET");
    const isCron = cronSecret && req.headers.get("x-cron-secret") === cronSecret;

    let updatedDays: number | null = null;

    if (!isCron) {
      const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
      const { data: ures } = await admin.auth.getUser(token);
      if (!ures?.user) {
        return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: ures.user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Optional: admin can update retention
      if (typeof body.retentionDays === "number") {
        const days = Math.max(7, Math.min(365, body.retentionDays));
        await admin.from("security_log_retention").update({
          retention_days: days, updated_by: ures.user.id, updated_at: new Date().toISOString(),
        }).eq("id", 1);
        updatedDays = days;
      }
    }

    const days = typeof body.days === "number" ? Math.max(1, body.days) : null;
    const { data, error } = await admin.rpc("purge_security_logs", { _days: days });
    if (error) throw error;

    return new Response(JSON.stringify({ purged: data, retentionDays: updatedDays }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
