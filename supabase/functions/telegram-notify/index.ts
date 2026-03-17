import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not configured");
      throw new Error("Telegram credentials not configured: missing TELEGRAM_BOT_TOKEN");
    }
    if (!ADMIN_CHAT_ID) {
      console.error("TELEGRAM_ADMIN_CHAT_ID is not configured");
      throw new Error("Telegram credentials not configured: missing TELEGRAM_ADMIN_CHAT_ID");
    }

    const { type, data } = await req.json();
    console.log(`Telegram notify called: type=${type}`, JSON.stringify(data));

    let message = "";

    switch (type) {
      case "contact_message":
        message = `📩 <b>Yangi xabar!</b>\n\n👤 <b>Ism:</b> ${esc(data.full_name)}\n📞 <b>Tel:</b> ${esc(data.phone)}\n📧 <b>Email:</b> ${esc(data.email || "—")}\n📋 <b>Mavzu:</b> ${esc(data.subject)}\n💬 <b>Xabar:</b> ${esc(data.message)}\n📅 <b>Vaqt:</b> ${esc(new Date().toLocaleString("uz-UZ"))}`;
        break;
      case "new_appointment":
        message = `📅 <b>Yangi qabul yozilishi!</b>\n\n👤 <b>Bemor:</b> ${esc(data.patient_name)}\n📞 <b>Tel:</b> ${esc(data.patient_phone)}\n🏥 <b>Klinika:</b> ${esc(data.clinic_name || "—")}\n📅 <b>Sana:</b> ${esc(data.appointment_date)}\n⏰ <b>Vaqt:</b> ${esc(data.appointment_time)}`;
        break;
      case "new_registration":
        message = `🆕 <b>Yangi muassasa ro'yxatdan o'tdi!</b>\n\n🏥 <b>Nomi:</b> ${esc(data.name)}\n📋 <b>Turi:</b> ${esc(data.type)}\n📞 <b>Tel:</b> ${esc(data.phone)}\n📅 <b>Vaqt:</b> ${esc(new Date().toLocaleString("uz-UZ"))}`;
        break;
      case "new_subscription":
        message = `💰 <b>Yangi obuna!</b>\n\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || data.user_id)}\n📦 <b>Tarif:</b> ${esc(data.plan)}\n💳 <b>Summa:</b> ${esc(String(data.amount))}\n📅 <b>Vaqt:</b> ${esc(new Date().toLocaleString("uz-UZ"))}`;
        break;
      case "ai_payment":
        message = `💳 <b>AI to'lov amalga oshirildi!</b>\n\n👤 <b>ID:</b> ${esc(data.user_id)}\n📦 <b>Tarif:</b> ${esc(data.plan_id)}\n💰 <b>Summa:</b> ${esc(String(data.amount))}\n🧾 <b>Invoice:</b> ${esc(data.invoice_id)}`;
        break;
      default:
        message = `🔔 <b>Bildirishnoma</b>\n\n<pre>${esc(JSON.stringify(data, null, 2))}</pre>`;
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    console.log(`Sending to Telegram chat_id: ${ADMIN_CHAT_ID}`);
    
    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const result = await res.json();
    console.log("Telegram response:", JSON.stringify(result));

    if (!result.ok) {
      console.error("Telegram API error:", result.description);
    }

    return new Response(JSON.stringify({ success: result.ok, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Telegram notify error:", e.message);
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
