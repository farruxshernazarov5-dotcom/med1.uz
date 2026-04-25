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

    const { lab_result_id, patient_id, channels, email_data } = await req.json();

    if (!lab_result_id && !patient_id) {
      throw new Error("lab_result_id or patient_id is required");
    }

    const activeChannels = channels || ["telegram", "email"];
    const results: Record<string, { success: boolean; error?: string }> = {};

    // === TELEGRAM via profiles (for patient dashboard users) ===
    if (activeChannels.includes("telegram") && patient_id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, telegram_chat_id")
          .eq("user_id", patient_id)
          .maybeSingle();

        let chatId = profile?.telegram_chat_id;

        // Fallback: check telegram_otp by phone
        if (!chatId && profile?.phone) {
          const { data: otpRecord } = await supabase
            .from("telegram_otp")
            .select("chat_id")
            .eq("phone", profile.phone)
            .maybeSingle();
          chatId = otpRecord?.chat_id;
        }

        if (chatId) {
          const message = `🧾 <b>ANALIZ NATIJASI TAYYOR</b>\n\n` +
            `👤 <b>Bemor:</b> ${esc(profile?.full_name || "")}\n` +
            `🧪 <b>Analiz:</b> ${esc(lab_result_id)}\n` +
            `📅 <b>Sana:</b> ${new Date().toISOString().slice(0, 10)}\n\n` +
            `🔗 <b>Natijani ko'rish:</b> https://med1-uz.lovable.app/dashboard\n\n` +
            `⚠️ <i>Bu xabar avtomatik yuborilgan.</i>`;

          const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": TELEGRAM_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
          });
          const data = await res.json();
          results.telegram = { success: res.ok };
          if (!res.ok) results.telegram.error = JSON.stringify(data);
        } else {
          results.telegram = { success: false, error: "No telegram chat_id found" };
        }
      } catch (e) {
        results.telegram = { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    }

    // === EMAIL via transactional email system ===
    if (activeChannels.includes("email") && email_data?.recipient_email) {
      try {
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "lab-result-notification",
            recipientEmail: email_data.recipient_email,
            idempotencyKey: `lab-result-${lab_result_id}-${Date.now()}`,
            templateData: {
              patientName: email_data.patient_name,
              testName: email_data.test_name,
              testCategory: email_data.test_category,
              resultsCount: email_data.results_count,
              abnormalCount: email_data.abnormal_count,
              resultsSummary: email_data.results_summary,
              date: email_data.date,
            },
          },
        });
        if (error) throw error;
        results.email = { success: true };
      } catch (e) {
        results.email = { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    }

    // Notify admin
    const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") || "1826388740";
    const adminMsg = `📊 <b>ANALIZ NATIJASI YUBORILDI</b>\n\n` +
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function esc(text: string): string {
  if (!text) return "—";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
