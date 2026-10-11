/**
 * Account-backed notification feed (the `notifications` table), shown in the
 * Qabullar → Bildirishnomalar panel. Rows are readable only by their owner.
 */
import { supabase } from "@/integrations/supabase/client";

export type FeedItem = { id: string; title: string; message: string; type: string | null; link: string | null; is_read: boolean; created_at: string };

const SAFE_LINK = /^\/(dashboard|mobile-appointments|mobile-profile|med1-top|mobile-classifieds)(?:[/?#]|$)/;
export const safeFeedLink = (link: string | null) => (link && SAFE_LINK.test(link) ? link : null);

export type FeedKind = "appointment" | "lab" | "classified" | "payment" | "security" | "other";
export const FEED_FILTERS: { id: FeedKind | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "Hammasi", emoji: "🔔" },
  { id: "appointment", label: "Qabullar", emoji: "🩺" },
  { id: "lab", label: "Tahlillar", emoji: "🧪" },
  { id: "classified", label: "E’lon va reklama", emoji: "📢" },
  { id: "payment", label: "To‘lovlar", emoji: "💳" },
  { id: "security", label: "Xavfsizlik", emoji: "🛡️" },
  { id: "other", label: "Boshqa", emoji: "✉️" },
];
/** Maps the free-form `type` column onto the filter chips. */
export function feedKind(type: string | null): FeedKind {
  const t = (type ?? "").toLowerCase();
  if (/appoint|visit|remind|booking|qabul/.test(t)) return "appointment";
  if (/lab|result|analysis/.test(t)) return "lab";
  if (/classified|^ad$|^ad_|med1_top|sponsor|promo/.test(t)) return "classified";
  if (/pay|wallet|coin|invoice|referral|subscription|credit/.test(t)) return "payment";
  if (/security|login|device|password/.test(t)) return "security";
  return "other";
}

export async function fetchFeed(userId: string): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,message,type,link,is_read,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as FeedItem[];
}

/** Adds a feed entry once: the same title + link is not repeated within 3 days. */
export async function pushFeedOnce(userId: string, title: string, message: string, link: string, type: string): Promise<boolean> {
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const { data } = await supabase.from("notifications").select("id").eq("user_id", userId).eq("title", title).eq("link", link).gte("created_at", since).limit(1);
  if (data?.length) return false;
  const { error } = await supabase.from("notifications").insert({ user_id: userId, title, message, link, type, is_read: false });
  return !error;
}

export async function markFeedRead(userId: string, ids?: string[]): Promise<void> {
  let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (ids?.length) q = q.in("id", ids);
  await q;
}

/** Live updates for the signed-in user's feed. */
let feedSeq = 0;
export function subscribeFeed(userId: string, onInsert: (item: FeedItem) => void): () => void {
  // Each subscriber gets its own channel name: reusing one name returns the
  // already-subscribed channel and Realtime throws "cannot add postgres_changes
  // callbacks after subscribe()" (the bell, the feed and the alerter all listen).
  feedSeq += 1;
  const ch = supabase
    .channel(`feed-${userId}-${feedSeq}-${Math.random().toString(36).slice(2, 8)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (p) => onInsert(p.new as FeedItem))
    .subscribe();
  return () => { void supabase.removeChannel(ch); };
}

/** Browser (website) notifications — asked only after a user tap. */
export const webNotifySupported = () => typeof window !== "undefined" && "Notification" in window;
export const webNotifyGranted = () => webNotifySupported() && Notification.permission === "granted";
export async function requestWebNotify(): Promise<boolean> {
  if (!webNotifySupported()) return false;
  return (await Notification.requestPermission()) === "granted";
}
export function showWebNotification(title: string, body: string, link: string | null): void {
  if (!webNotifyGranted()) return;
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico", tag: `${title}|${link ?? ""}` });
    n.onclick = () => { window.focus(); if (link) window.location.assign(link); n.close(); };
  } catch { /* some mobile browsers only allow service-worker notifications */ }
}
