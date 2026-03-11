import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");

    if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {
      throw new Error("Telegram credentials not configured");
    }

    const { type, data } = await req.json();

    let message = "";

    switch (type) {
      case "contact_message":
        message = `📩 *Yangi xabar!*\n\n👤 *Ism:* ${data.full_name}\n📞 *Tel:* ${data.phone}\n📧 *Email:* ${data.email || "—"}\n📋 *Mavzu:* ${data.subject}\n💬 *Xabar:* ${data.message}\n📅 *Vaqt:* ${new Date().toLocaleString("uz-UZ")}`;
        break;
      case "new_appointment":
        message = `📅 *Yangi qabul yozilishi!*\n\n👤 *Bemor:* ${data.patient_name}\n📞 *Tel:* ${data.patient_phone}\n🏥 *Klinika:* ${data.clinic_name || "—"}\n📅 *Sana:* ${data.appointment_date}\n⏰ *Vaqt:* ${data.appointment_time}`;
        break;
      case "new_registration":
        message = `🆕 *Yangi muassasa ro'yxatdan o'tdi!*\n\n🏥 *Nomi:* ${data.name}\n📋 *Turi:* ${data.type}\n📞 *Tel:* ${data.phone}\n📅 *Vaqt:* ${new Date().toLocaleString("uz-UZ")}`;
        break;
      case "new_subscription":
        message = `💰 *Yangi obuna!*\n\n👤 *Foydalanuvchi:* ${data.user_name || data.user_id}\n📦 *Tarif:* ${data.plan}\n💳 *Summa:* ${data.amount}\n📅 *Vaqt:* ${new Date().toLocaleString("uz-UZ")}`;
        break;
      case "ai_payment":
        message = `💳 *AI to'lov amalga oshirildi!*\n\n👤 *ID:* ${data.user_id}\n📦 *Tarif:* ${data.plan_id}\n💰 *Summa:* ${data.amount}\n🧾 *Invoice:* ${data.invoice_id}`;
        break;
      default:
        message = `🔔 *Bildirishnoma*\n\n${JSON.stringify(data, null, 2)}`;
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ success: result.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Telegram notify error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
