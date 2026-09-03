// To'lov havolasini (Click + Payme) foydalanuvchining Telegram botiga yuborish.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function esc(t: string) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await authClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount ?? 0);
    const purpose = String(body?.purpose ?? "med1_payment");
    const referenceId = body?.reference_id ? String(body.reference_id) : undefined;
    const returnUrl = typeof body?.return_url === "string" ? body.return_url : "https://med1.uz/payment/success";
    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Noto'g'ri summa" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await service
      .from("profiles")
      .select("telegram_chat_id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const chatId = profile?.telegram_chat_id ? String(profile.telegram_chat_id) : "";
    if (!chatId) {
      return new Response(JSON.stringify({ error: "Telegram bot ulanmagan. @Med1uzInfoBot orqali ro'yxatdan o'ting." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invoke = async (fn: string) => {
      const res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ amount, purpose, reference_id: referenceId, return_url: returnUrl }),
      });
      const json = await res.json().catch(() => null);
      return res.ok && json?.checkout_url ? String(json.checkout_url) : null;
    };

    const [clickUrl, paymeUrl] = await Promise.all([
      invoke("click-create-invoice"),
      invoke("payme-create-invoice"),
    ]);

    if (!clickUrl && !paymeUrl) {
      return new Response(JSON.stringify({ error: "To'lov havolasi yaratilmadi" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buttons: { text: string; url: string }[][] = [];
    if (clickUrl) buttons.push([{ text: "💳 Click orqali to'lash", url: clickUrl }]);
    if (paymeUrl) buttons.push([{ text: "🟢 Payme orqali to'lash", url: paymeUrl }]);

    const text =
      `💰 <b>MED1.UZ — to'lov havolasi</b>\n\n` +
      `📋 <b>Xizmat:</b> ${esc(purpose)}\n` +
      `💵 <b>Summa:</b> ${amount.toLocaleString("uz-UZ")} so'm\n\n` +
      `Quyidagi tugmalardan birini tanlab to'lovni yakunlang.`;

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!TELEGRAM_API_KEY || !LOVABLE_API_KEY) throw new Error("Telegram konfiguratsiyasi topilmadi");

    const tgRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      }),
    });
    const tgJson = await tgRes.json().catch(() => null);
    if (!tgRes.ok) {
      console.error("Telegram send failed", JSON.stringify(tgJson));
      return new Response(JSON.stringify({ error: "Telegramga yuborilmadi" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, click_url: clickUrl, payme_url: paymeUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telegram-payment-link error:", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
