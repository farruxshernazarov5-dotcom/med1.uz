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
        message = `📩 *Yangi xabar\\!*\n\n👤 *Ism:* ${escapeMarkdown(data.full_name)}\n📞 *Tel:* ${escapeMarkdown(data.phone)}\n📧 *Email:* ${escapeMarkdown(data.email || "—")}\n📋 *Mavzu:* ${escapeMarkdown(data.subject)}\n💬 *Xabar:* ${escapeMarkdown(data.message)}\n📅 *Vaqt:* ${escapeMarkdown(new Date().toLocaleString("uz-UZ"))}`;
        break;
      case "new_appointment":
        message = `📅 *Yangi qabul yozilishi\\!*\n\n👤 *Bemor:* ${escapeMarkdown(data.patient_name)}\n📞 *Tel:* ${escapeMarkdown(data.patient_phone)}\n🏥 *Klinika:* ${escapeMarkdown(data.clinic_name || "—")}\n📅 *Sana:* ${escapeMarkdown(data.appointment_date)}\n⏰ *Vaqt:* ${escapeMarkdown(data.appointment_time)}`;
        break;
      case "new_registration":
        message = `🆕 *Yangi muassasa ro'yxatdan o'tdi\\!*\n\n🏥 *Nomi:* ${escapeMarkdown(data.name)}\n📋 *Turi:* ${escapeMarkdown(data.type)}\n📞 *Tel:* ${escapeMarkdown(data.phone)}\n📅 *Vaqt:* ${escapeMarkdown(new Date().toLocaleString("uz-UZ"))}`;
        break;
      case "new_subscription":
        message = `💰 *Yangi obuna\\!*\n\n👤 *Foydalanuvchi:* ${escapeMarkdown(data.user_name || data.user_id)}\n📦 *Tarif:* ${escapeMarkdown(data.plan)}\n💳 *Summa:* ${escapeMarkdown(String(data.amount))}\n📅 *Vaqt:* ${escapeMarkdown(new Date().toLocaleString("uz-UZ"))}`;
        break;
      case "ai_payment":
        message = `💳 *AI to'lov amalga oshirildi\\!*\n\n👤 *ID:* ${escapeMarkdown(data.user_id)}\n📦 *Tarif:* ${escapeMarkdown(data.plan_id)}\n💰 *Summa:* ${escapeMarkdown(String(data.amount))}\n🧾 *Invoice:* ${escapeMarkdown(data.invoice_id)}`;
        break;
      default:
        message = `🔔 *Bildirishnoma*\n\n${escapeMarkdown(JSON.stringify(data, null, 2))}`;
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    console.log(`Sending to Telegram chat_id: ${ADMIN_CHAT_ID}`);
    
    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "MarkdownV2",
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

function escapeMarkdown(text: string): string {
  if (!text) return "—";
  return String(text).replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
