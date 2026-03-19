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

    const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") || "5079601480";

    const { type, data } = await req.json();
    console.log(`Telegram notify: type=${type}`, JSON.stringify(data));

    let message = "";

    switch (type) {
      case "contact_message":
        message = `📩 <b>Yangi xabar!</b>\n\n👤 <b>Ism:</b> ${esc(data.full_name)}\n📞 <b>Tel:</b> ${esc(data.phone)}\n📧 <b>Email:</b> ${esc(data.email || "—")}\n📋 <b>Mavzu:</b> ${esc(data.subject)}\n💬 <b>Xabar:</b> ${esc(data.message)}\n📅 <b>Vaqt:</b> ${new Date().toISOString().slice(0, 16)}`;
        break;
      case "new_appointment":
        message = `📅 <b>Yangi qabul!</b>\n\n👤 <b>Bemor:</b> ${esc(data.patient_name)}\n📞 <b>Tel:</b> ${esc(data.patient_phone)}\n🏥 <b>Klinika:</b> ${esc(data.clinic_name || "—")}\n📅 <b>Sana:</b> ${esc(data.appointment_date)}\n⏰ <b>Vaqt:</b> ${esc(data.appointment_time)}`;
        break;
      case "new_registration":
        message = `🆕 <b>Yangi muassasa!</b>\n\n🏥 <b>Nomi:</b> ${esc(data.name)}\n📋 <b>Turi:</b> ${esc(data.type)}\n📞 <b>Tel:</b> ${esc(data.phone)}`;
        break;
      case "new_subscription":
        message = `💰 <b>Yangi obuna!</b>\n\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || data.user_id)}\n📦 <b>Tarif:</b> ${esc(data.plan)}\n💳 <b>Summa:</b> ${esc(String(data.amount))} so'm`;
        break;
      case "ai_payment":
        message = `💳 <b>AI to'lov!</b>\n\n👤 <b>ID:</b> ${esc(data.user_id)}\n📦 <b>Tarif:</b> ${esc(data.plan_id)}\n💰 <b>Summa:</b> ${esc(String(data.amount))} so'm\n🧾 <b>Invoice:</b> ${esc(data.invoice_id)}`;
        break;
      default:
        message = `🔔 <b>Bildirishnoma</b>\n\n${esc(JSON.stringify(data, null, 2))}`;
    }

    console.log(`Sending via gateway to chat_id: ${ADMIN_CHAT_ID}`);

    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const result = await res.json();
    console.log("Telegram gateway response:", JSON.stringify(result));

    if (!res.ok) {
      console.error(`Telegram gateway error [${res.status}]:`, JSON.stringify(result));
      throw new Error(`Telegram API call failed [${res.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, result }), {
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
