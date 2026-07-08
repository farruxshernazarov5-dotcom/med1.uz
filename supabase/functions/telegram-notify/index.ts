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
    // Require authenticated user (prevents anyone from spamming Telegram)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await authClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") || "1826388740";

    const { type, data } = await req.json();
    console.log(`Telegram notify: type=${type} user=${userData.user.id}`);

    let message = "";

    switch (type) {
      case "contact_message":
        message = `📩 <b>YANGI XABAR</b>\n\n👤 <b>Ism:</b> ${esc(data.full_name)}\n📞 <b>Tel:</b> ${esc(data.phone)}\n📧 <b>Email:</b> ${esc(data.email || "—")}\n📋 <b>Mavzu:</b> ${esc(data.subject)}\n💬 <b>Xabar:</b> ${esc(data.message)}\n\n📅 ${ts()}`;
        break;

      case "new_appointment":
        message = `📅 <b>YANGI QABUL</b>\n\n👤 <b>Bemor:</b> ${esc(data.patient_name)}\n📞 <b>Tel:</b> ${esc(data.patient_phone)}\n🏥 <b>Klinika:</b> ${esc(data.clinic_name || "—")}\n👨‍⚕️ <b>Shifokor:</b> ${esc(data.doctor_name || "—")}\n🔬 <b>Xizmat:</b> ${esc(data.service_name || "Konsultatsiya")}\n📅 <b>Sana:</b> ${esc(data.appointment_date)}\n⏰ <b>Vaqt:</b> ${esc(data.appointment_time)}\n💰 <b>Narx:</b> ${esc(data.total_price ? data.total_price + " so'm" : "Bepul")}\n\n📌 <b>Holat:</b> Kutilmoqda\n📅 ${ts()}`;
        break;

      case "new_registration":
        message = `🆕 <b>YANGI MUASSASA RO'YXATDAN O'TDI</b>\n\n🏥 <b>Nomi:</b> ${esc(data.name)}\n📋 <b>Turi:</b> ${esc(data.type)}\n📞 <b>Tel:</b> ${esc(data.phone)}\n📧 <b>Email:</b> ${esc(data.email || "—")}\n📍 <b>Manzil:</b> ${esc(data.address || "—")}\n\n📅 ${ts()}`;
        break;

      case "new_subscription":
        message = `💎 <b>YANGI OBUNA</b>\n\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || data.user_id)}\n📦 <b>Tarif:</b> ${esc(data.plan)}\n💳 <b>Summa:</b> ${esc(String(data.amount))} so'm\n📅 <b>Davr:</b> ${esc(data.billing_period || "—")}\n\n📌 <b>Holat:</b> Faol\n📅 ${ts()}`;
        break;

      case "ai_payment":
        message = `💳 <b>AI TO'LOV</b>\n\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || data.user_id)}\n📦 <b>Tarif:</b> ${esc(data.plan_id)}\n💰 <b>Summa:</b> ${esc(String(data.amount))} so'm\n🧾 <b>Invoice:</b> ${esc(data.invoice_id)}\n💳 <b>To'lov usuli:</b> ${esc(data.payment_method || "—")}\n\n📌 <b>Holat:</b> ✅ To'landi\n📅 ${ts()}`;
        break;

      case "clinic_booking":
        message = `🏥 <b>KLINIKAGA YOZILISH</b>\n\n👤 <b>Bemor:</b> ${esc(data.patient_name)}\n📞 <b>Tel:</b> ${esc(data.patient_phone)}\n🏥 <b>Klinika:</b> ${esc(data.clinic_name)}\n👨‍⚕️ <b>Shifokor:</b> ${esc(data.doctor_name || "—")}\n🔬 <b>Xizmat:</b> ${esc(data.service_name || "—")}\n💰 <b>Narx:</b> ${esc(data.price || "—")}\n📅 <b>Sana:</b> ${esc(data.date)}\n⏰ <b>Vaqt:</b> ${esc(data.time)}\n\n📅 ${ts()}`;
        break;

      case "lab_order":
        message = `🔬 <b>LABORATORIYA BUYURTMASI</b>\n\n👤 <b>Bemor:</b> ${esc(data.patient_name)}\n📞 <b>Tel:</b> ${esc(data.patient_phone)}\n🏥 <b>Markaz:</b> ${esc(data.center_name)}\n📋 <b>Xizmat:</b> ${esc(data.service_name)}\n💰 <b>Narx:</b> ${esc(data.price || "—")}\n\n📅 ${ts()}`;
        break;

      case "pharmacy_order":
        message = `💊 <b>DORIXONA BUYURTMASI</b>\n\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || data.user_id)}\n📞 <b>Tel:</b> ${esc(data.phone)}\n🏪 <b>Dorixona:</b> ${esc(data.pharmacy_name || "—")}\n📋 <b>Buyurtma:</b> ${esc(data.items || "—")}\n💰 <b>Summa:</b> ${esc(data.amount || "—")}\n\n📅 ${ts()}`;
        break;

      case "cosmetology_booking":
        message = `💆 <b>KOSMETOLOGIYA QABULI</b>\n\n👤 <b>Bemor:</b> ${esc(data.patient_name)}\n📞 <b>Tel:</b> ${esc(data.patient_phone)}\n🏥 <b>Markaz:</b> ${esc(data.center_name)}\n💅 <b>Xizmat:</b> ${esc(data.service_name || "—")}\n📅 <b>Sana:</b> ${esc(data.date)}\n⏰ <b>Vaqt:</b> ${esc(data.time)}\n\n📅 ${ts()}`;
        break;

      case "diagnostics_booking":
        message = `🩺 <b>DIAGNOSTIKA QABULI</b>\n\n👤 <b>Bemor:</b> ${esc(data.patient_name)}\n📞 <b>Tel:</b> ${esc(data.patient_phone)}\n🏥 <b>Markaz:</b> ${esc(data.center_name)}\n🔬 <b>Xizmat:</b> ${esc(data.service_name || "—")}\n📅 <b>Sana:</b> ${esc(data.date)}\n⏰ <b>Vaqt:</b> ${esc(data.time)}\n\n📅 ${ts()}`;
        break;

      case "blood_donation":
        message = `🩸 <b>YANGI DONOR RO'YXATDAN O'TDI</b>\n\n👤 <b>Donor:</b> ${esc(data.full_name)}\n📞 <b>Tel:</b> ${esc(data.phone)}\n🩸 <b>Guruh:</b> ${esc(data.blood_group)} ${esc(data.rh_factor)}\n🏥 <b>Qon banki:</b> ${esc(data.blood_bank_name || "—")}\n\n📅 ${ts()}`;
        break;

      case "user_registration":
        message = `🆕 <b>YANGI FOYDALANUVCHI</b>\n\n👤 <b>Ism:</b> ${esc(data.full_name || "—")}\n📞 <b>Tel:</b> ${esc(data.phone || "—")}\n📧 <b>Email:</b> ${esc(data.email || "—")}\n👤 <b>Rol:</b> ${esc(data.role || "patient")}\n\n📅 ${ts()}`;
        break;

      case "invoice_created":
        message = `🧾 <b>YANGI INVOICE YARATILDI</b>\n\n🆔 <b>Invoice:</b> ${esc(data.invoice_number)}\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || data.user_id)}\n📋 <b>Xizmat:</b> ${esc(data.service_name || "—")}\n🏷️ <b>Turi:</b> ${esc(data.invoice_type || "—")}\n💰 <b>Summa:</b> ${esc(String(data.amount))} so'm\n💳 <b>To'lov usuli:</b> ${esc(data.payment_method || "—")}\n\n📌 <b>Holat:</b> ${data.status === "paid" ? "✅ To'landi" : "⏳ Kutilmoqda"}\n📅 ${ts()}`;
        break;

      case "premium_service":
        message = `⭐ <b>PREMIUM XIZMAT</b>\n\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || data.user_id)}\n📋 <b>Xizmat:</b> ${esc(data.service_name)}\n💰 <b>Summa:</b> ${esc(String(data.amount || 0))} so'm\n🧾 <b>Invoice:</b> ${esc(data.invoice_number || "—")}\n\n📅 ${ts()}`;
        break;

      case "service_order":
        message = `📋 <b>XIZMATGA BUYURTMA</b>\n\n👤 <b>Foydalanuvchi:</b> ${esc(data.user_name || "—")}\n📞 <b>Tel:</b> ${esc(data.phone || "—")}\n🏥 <b>Muassasa:</b> ${esc(data.org_name || "—")}\n📋 <b>Xizmat:</b> ${esc(data.service_name)}\n💰 <b>Narx:</b> ${esc(data.price || "—")}\n\n📅 ${ts()}`;
        break;

      case "lab_result_direct": {
        // Admin-only: caller must have admin role. Target chat_id must belong to a
        // registered profile (no arbitrary Telegram sends). Message is server-composed.
        const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: isAdmin } = await serviceClient.rpc("has_role", {
          _user_id: userData.user.id,
          _role: "admin",
        });
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const targetChatId = String(data?.chat_id ?? "");
        if (!targetChatId) {
          return new Response(JSON.stringify({ error: "chat_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: prof } = await serviceClient
          .from("profiles")
          .select("user_id")
          .eq("telegram_chat_id", targetChatId)
          .maybeSingle();
        if (!prof) {
          return new Response(JSON.stringify({ error: "chat_id not registered" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const safeText = `🔬 <b>Laboratoriya natijasi</b>\n\n${esc(String(data?.message ?? ""))}`;
        const directRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chat_id: targetChatId, text: safeText, parse_mode: "HTML" }),
        });
        const directResult = await directRes.json();
        return new Response(JSON.stringify({ success: directRes.ok, result: directResult }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        message = `🔔 <b>BILDIRISHNOMA</b>\n\n📋 <b>Tur:</b> ${esc(type)}\n\n${esc(JSON.stringify(data, null, 2))}\n\n📅 ${ts()}`;
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
    console.error("Telegram notify error:", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function esc(text: string): string {
  if (!text) return "—";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ts(): string {
  const now = new Date();
  return `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 16)}`;
}
