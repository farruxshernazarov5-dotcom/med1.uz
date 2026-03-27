import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lab_result_id, patient_id, channels } = await req.json();

    if (!lab_result_id || !patient_id) {
      throw new Error("lab_result_id and patient_id are required");
    }

    // Get patient profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, notification_channels, telegram_chat_id")
      .eq("user_id", patient_id)
      .maybeSingle();

    if (!profile) throw new Error("Patient profile not found");

    const activeChannels = channels || profile.notification_channels || ["telegram", "email"];
    const results: Record<string, { success: boolean; error?: string }> = {};

    // Telegram notification
    if (activeChannels.includes("telegram") && profile.telegram_chat_id) {
      try {
        const message = `🧾 <b>ANALIZ NATIJASI TAYYOR</b>\n\n` +
          `👤 <b>Bemor:</b> ${esc(profile.full_name)}\n` +
          `🧪 <b>Analiz:</b> ${esc(lab_result_id)}\n` +
          `📅 <b>Sana:</b> ${new Date().toISOString().slice(0, 10)}\n` +
          `⏰ <b>Vaqt:</b> ${new Date().toISOString().slice(11, 16)}\n\n` +
          `🔗 <b>Natijani ko'rish:</b> https://med1-uz.lovable.app/dashboard\n\n` +
          `⚠️ <i>Bu xabar avtomatik yuborilgan. Savollar uchun shifokoringizga murojaat qiling.</i>`;

        const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: profile.telegram_chat_id,
            text: message,
            parse_mode: "HTML",
          }),
        });

        const data = await res.json();
        results.telegram = { success: res.ok };
        if (!res.ok) results.telegram.error = JSON.stringify(data);
      } catch (e) {
        results.telegram = { success: false, error: e.message };
      }
    }

    // SMS notification (placeholder — needs Twilio connector)
    if (activeChannels.includes("sms") && profile.phone) {
      // For now, log the intent. Twilio integration can be added when connector is linked.
      console.log(`SMS would be sent to ${profile.phone}: Analiz natijangiz tayyor. Med1.uz orqali ko'ring.`);
      results.sms = { success: true, error: "SMS connector not yet configured — logged only" };
    }

    // Email notification (placeholder — needs email infrastructure)
    if (activeChannels.includes("email")) {
      console.log(`Email would be sent to patient ${patient_id} with lab result PDF`);
      results.email = { success: true, error: "Email infrastructure pending — logged only" };
    }

    // Notify admin too
    const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") || "1826388740";
    const adminMsg = `📊 <b>ANALIZ NATIJASI YUBORILDI</b>\n\n` +
      `👤 <b>Bemor:</b> ${esc(profile.full_name)}\n` +
      `🧪 <b>Analiz ID:</b> ${esc(lab_result_id)}\n` +
      `📡 <b>Kanallar:</b> ${activeChannels.join(", ")}\n` +
      `✅ <b>Natija:</b> ${JSON.stringify(results)}\n\n📅 ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;

    await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: adminMsg, parse_mode: "HTML" }),
    });

    return new Response(JSON.stringify({ success: true, channels: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Lab notify error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function esc(text: string): string {
  if (!text) return "—";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
