const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") {
    return json({ ok: true, endpoint: "click-complete", expected_action: 1 });
  }
  if (req.method !== "POST") return json({ error: -3, error_note: "Action not found" });

  const target = `${Deno.env.get("SUPABASE_URL")}/functions/v1/click-webhook`;
  const contentType = req.headers.get("content-type") || "application/x-www-form-urlencoded";
  const body = await req.arrayBuffer();
  const response = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: { ...corsHeaders, "Content-Type": response.headers.get("content-type") || "application/json" },
  });
});