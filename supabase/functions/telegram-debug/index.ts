import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    // Get bot info
    const meRes = await fetch(`${GATEWAY_URL}/getMe`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const meData = await meRes.json();

    // Get updates to find chat IDs
    const updatesRes = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 10 }),
    });
    const updatesData = await updatesRes.json();

    // Extract chat info from updates
    const chats = (updatesData.result || []).map((u: any) => ({
      update_id: u.update_id,
      chat_id: u.message?.chat?.id,
      chat_type: u.message?.chat?.type,
      from_id: u.message?.from?.id,
      from_name: `${u.message?.from?.first_name || ""} ${u.message?.from?.last_name || ""}`.trim(),
      text: u.message?.text,
    }));

    return new Response(JSON.stringify({
      bot: meData.result,
      chats,
      raw_updates_count: (updatesData.result || []).length,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
