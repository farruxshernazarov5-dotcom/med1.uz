// To'lov muvaffaqiyatli yakunlanganda Telegram (@Med1uzInfoBot) orqali push xabar yuborish.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function esc(t: unknown) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type SupabaseLike = {
  from: (t: string) => any;
};

export async function notifyPaymentPaid(
  admin: SupabaseLike,
  opts: {
    provider: "click" | "payme" | "uzum";
    amount: number;
    purpose?: string | null;
    paymentId: string;
    userId?: string | null;
    transactionId?: string | null;
  },
) {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
      console.warn("payment-notify: telegram konfiguratsiyasi yo'q");
      return;
    }

    const chatIds = new Set<string>();

    if (opts.userId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("telegram_chat_id")
        .eq("user_id", opts.userId)
        .maybeSingle();
      if (profile?.telegram_chat_id) chatIds.add(String(profile.telegram_chat_id));
    }

    const adminChat = (Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") ?? "").trim();
    if (adminChat) chatIds.add(adminChat);

    if (chatIds.size === 0) return;

    const text =
      `✅ <b>To'lov muvaffaqiyatli</b>\n\n` +
      `💳 <b>Tizim:</b> ${esc(opts.provider.toUpperCase())}\n` +
      `💵 <b>Summa:</b> ${Number(opts.amount).toLocaleString("uz-UZ")} so'm\n` +
      `📋 <b>Xizmat:</b> ${esc(opts.purpose ?? "MED1.UZ xizmati")}\n` +
      `🧾 <b>Buyurtma:</b> <code>${esc(opts.paymentId)}</code>\n` +
      (opts.transactionId ? `🔗 <b>Tranzaksiya:</b> <code>${esc(opts.transactionId)}</code>\n` : "") +
      `\nMED1.UZ xizmatidan foydalanganingiz uchun rahmat!`;

    await Promise.all(
      Array.from(chatIds).map(async (chat_id) => {
        const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chat_id, text, parse_mode: "HTML" }),
        });
        if (!res.ok) {
          console.error("payment-notify telegram failed", res.status, await res.text());
        }
      }),
    );
  } catch (e) {
    console.error("payment-notify error:", e instanceof Error ? e.message : String(e));
  }
}
