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
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(url, srv);
    const { data: ures, error: uerr } = await admin.auth.getUser(token);
    if (uerr || !ures?.user) {
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: ures.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(200, Math.max(10, Number(body.pageSize) || 50));
    const from = body.from ? new Date(body.from).toISOString() : null;
    const to = body.to ? new Date(body.to).toISOString() : null;
    const level = body.level && body.level !== "all" ? String(body.level) : null;
    const scope = body.scope ? String(body.scope) : null;
    const column = body.column ? String(body.column) : null;
    const sortBy = body.sortBy === "level" ? "level" : "created_at";
    const sortDir = body.sortDir === "asc" ? true : false;

    let q = admin.from("security_debug_log").select("*", { count: "exact" });
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", to);
    if (level) q = q.eq("level", level);
    if (scope) q = q.ilike("scope", `%${scope}%`);
    if (column) q = q.ilike("column_name", `%${column}%`);
    q = q.order(sortBy, { ascending: sortDir }).range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await q;
    if (error) throw error;

    return new Response(JSON.stringify({ data: data ?? [], total: count ?? 0, page, pageSize }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
