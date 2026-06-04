import { supabase } from "@/integrations/supabase/client";

export type CoinThreshold = 50 | 25 | 10 | 0;

const MESSAGES: Record<CoinThreshold, { title: string; body: string; type: string }> = {
  50: {
    type: "medcoin_alert_50",
    title: "Med Coin balansingiz kamaymoqda",
    body: "Balansingiz 50% ga tushdi. To'ldirib qo'yishni unutmang.",
  },
  25: {
    type: "medcoin_alert_25",
    title: "Balansingiz tugashiga yaqin",
    body: "Med Coin balansingiz 25% qoldi. AI xizmatlardan uzilmaslik uchun to'ldiring.",
  },
  10: {
    type: "medcoin_alert_10",
    title: "Med Coin balansingiz juda kam qoldi",
    body: "Faqat 10% qoldi. Hozir to'ldirsangiz, xizmatlar uzilmaydi.",
  },
  0: {
    type: "medcoin_alert_0",
    title: "Med Coin tugadi",
    body: "AI xizmatlardan foydalanish uchun Med Coin sotib oling yoki obunangizni yangilang.",
  },
};

/**
 * In-app balance alert. Dedup: skip if same threshold notification already
 * exists for this user in the last 24h.
 */
export async function maybeNotifyBalanceThreshold(
  userId: string,
  threshold: CoinThreshold,
): Promise<boolean> {
  const cfg = MESSAGES[threshold];
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", cfg.type)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: cfg.type,
    title: cfg.title,
    message: cfg.body,
    link: "/dashboard?tab=wallet",
  });

  return !error;
}

/** Returns the highest threshold the current percentage triggers, or null. */
export function computeThreshold(balance: number, lifetime: number): CoinThreshold | null {
  if (balance <= 0) return 0;
  if (lifetime <= 0) return null;
  const pct = (balance / lifetime) * 100;
  if (pct <= 10) return 10;
  if (pct <= 25) return 25;
  if (pct <= 50) return 50;
  return null;
}
