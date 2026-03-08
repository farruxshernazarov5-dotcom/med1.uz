import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendTelegramMessage(chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // Telegram webhook handler
    if (path === "webhook" && req.method === "POST") {
      const update = await req.json();
      const message = update.message;
      if (!message?.text) return new Response("ok");

      const chatId = message.chat.id;
      const text = message.text.trim();

      // /start command with phone
      if (text.startsWith("/start")) {
        await sendTelegramMessage(chatId,
          "🏥 <b>Med1.uz - Telegram orqali kirish</b>\n\n" +
          "Telefon raqamingizni quyidagi formatda yuboring:\n" +
          "<code>+998901234567</code>\n\n" +
          "Keyin saytda ko'rsatilgan kodni kiriting."
        );
        return new Response("ok");
      }

      // Phone number received
      if (text.startsWith("+998") && text.length >= 13) {
        const phone = text.replace(/\s/g, "");
        // Save/update chat_id for this phone
        const { error } = await supabase.from("telegram_otp").upsert(
          { phone, chat_id: chatId, is_verified: false, updated_at: new Date().toISOString() },
          { onConflict: "phone" }
        );
        if (error) {
          await sendTelegramMessage(chatId, "❌ Xatolik yuz berdi. Qayta urinib ko'ring.");
        } else {
          await sendTelegramMessage(chatId,
            `✅ <b>Telefon raqam saqlandi:</b> ${phone}\n\n` +
            "Endi saytda \"Telegram kod yuborish\" tugmasini bosing."
          );
        }
        return new Response("ok");
      }

      // Unknown command
      await sendTelegramMessage(chatId,
        "📱 Telefon raqamingizni yuboring:\n<code>+998901234567</code>"
      );
      return new Response("ok");
    }

    // Send OTP to user via Telegram
    if (path === "send-otp" && req.method === "POST") {
      const { phone } = await req.json();
      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if phone has chat_id
      const { data: record } = await supabase
        .from("telegram_otp")
        .select("chat_id")
        .eq("phone", phone)
        .maybeSingle();

      if (!record?.chat_id) {
        return new Response(JSON.stringify({
          error: "not_linked",
          message: "Bu telefon raqam Telegram botga ulanmagan. Avval @Med1UzBot ga telefon raqamingizni yuboring."
        }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from("telegram_otp").update({
        otp_code: otp,
        otp_expires_at: expiresAt,
        is_verified: false,
        updated_at: new Date().toISOString(),
      }).eq("phone", phone);

      await sendTelegramMessage(record.chat_id,
        `🔐 <b>Med1.uz kirish kodi:</b>\n\n<code>${otp}</code>\n\n⏱ Kod 5 daqiqa ichida amal qiladi.`
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify OTP
    if (path === "verify-otp" && req.method === "POST") {
      const { phone, otp } = await req.json();
      if (!phone || !otp) {
        return new Response(JSON.stringify({ error: "Phone and OTP required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: record } = await supabase
        .from("telegram_otp")
        .select("otp_code, otp_expires_at")
        .eq("phone", phone)
        .maybeSingle();

      if (!record || record.otp_code !== otp) {
        return new Response(JSON.stringify({ error: "Noto'g'ri kod" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(record.otp_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Kod muddati tugagan" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark verified
      await supabase.from("telegram_otp").update({
        is_verified: true,
        otp_code: null,
        updated_at: new Date().toISOString(),
      }).eq("phone", phone);

      // Check if user with this phone exists in profiles, sign them in
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", phone)
        .maybeSingle();

      if (profile?.user_id) {
        // Generate a magic link / session for the user
        const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: "", // we'll look up the email
        });

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
        if (userData?.user?.email) {
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: userData.user.email,
          });

          if (linkData && !linkError) {
            // Extract token from the link
            const linkUrl = new URL(linkData.properties.action_link);
            const token_hash = linkUrl.searchParams.get("token") || linkUrl.hash;

            return new Response(JSON.stringify({
              success: true,
              verified: true,
              has_account: true,
              email: userData.user.email,
              action_link: linkData.properties.action_link,
              hashed_token: linkData.properties.hashed_token,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        verified: true,
        has_account: false,
        message: "Kod tasdiqlandi. Lekin bu raqam bilan bog'langan hisob topilmadi."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
