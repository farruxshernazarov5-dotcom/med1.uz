import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

async function sendTelegram(chatId: string, text: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !chatId) return false;
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return res.ok;
}

export interface PaymentNotice {
  userId: string;
  amount: number;
  product: string;
  coins: number;
  invoiceNumber: string;
  transactionId?: string | null;
  isTest?: boolean;
}

/** Foydalanuvchi + Super Admin'ga to'lov haqida xabar yuboradi. Xatolik jarayonni to'xtatmaydi. */
export async function notifyPaymentSuccess(admin: SupabaseClient, n: PaymentNotice) {
  const date = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
  const money = `${Number(n.amount).toLocaleString("uz-UZ")} so'm`;
  const prefix = n.isTest ? "🧪 <b>TEST</b>\n" : "";

  const userMsg =
    `${prefix}✅ <b>To'lov muvaffaqiyatli amalga oshirildi</b>\n\n` +
    `💰 Summa: ${money}\n` +
    `📦 Mahsulot: ${n.product}\n` +
    (n.coins > 0 ? `🪙 Med Coin: +${n.coins}\n` : "") +
    `🧾 Invoice: ${n.invoiceNumber}\n` +
    `📅 Sana: ${date}`;

  try {
    const { data: prof } = await admin
      .from("profiles")
      .select("telegram_chat_id, full_name")
      .eq("user_id", n.userId)
      .maybeSingle();
    if (prof?.telegram_chat_id) await sendTelegram(String(prof.telegram_chat_id), userMsg);

    const adminChat = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
    if (adminChat) {
      await sendTelegram(
        adminChat,
        `${prefix}💳 <b>Yangi to'lov (Click)</b>\n\n` +
          `👤 ${prof?.full_name || n.userId}\n` +
          `💰 ${money}\n📦 ${n.product}\n` +
          (n.coins > 0 ? `🪙 +${n.coins} Med Coin\n` : "") +
          `🧾 ${n.invoiceNumber}\n🆔 TX: ${n.transactionId || "-"}\n📅 ${date}`,
      );
    }
    return true;
  } catch (e) {
    console.error("notifyPaymentSuccess failed:", e);
    return false;
  }
}
