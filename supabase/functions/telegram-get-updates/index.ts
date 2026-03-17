import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ error: "No bot token" }), { status: 500, headers: corsHeaders });
  }

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=10`);
  const data = await res.json();

  // Extract chat IDs from updates
  const chats = (data.result || []).map((u: any) => ({
    update_id: u.update_id,
    chat_id: u.message?.chat?.id,
    chat_type: u.message?.chat?.type,
    chat_title: u.message?.chat?.title || u.message?.chat?.first_name,
    text: u.message?.text,
  }));

  return new Response(JSON.stringify({ ok: data.ok, chats, raw: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
