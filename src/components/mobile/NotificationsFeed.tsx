import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, BellRing, CheckCheck, CheckCircle2, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ensureNotificationPermission, notificationStatus, playReminderChime, scheduleTestReminder, type NotifyStatus } from "@/lib/nativeHealth";
import { openAppSettings } from "@/lib/nativeHealth";
import { fetchFeed, markFeedRead, requestWebNotify, safeFeedLink, showWebNotification, subscribeFeed, webNotifyGranted, webNotifySupported, type FeedItem } from "@/lib/notificationsFeed";
import { cn } from "@/lib/utils";

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "hozir";
  if (m < 60) return `${m} daq oldin`;
  if (m < 1440) return `${Math.round(m / 60)} soat oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
};

/** Status check + the patient's notification history inside Qabullar. */
export const NotificationsFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<NotifyStatus | null>(null);
  const [web, setWeb] = useState(webNotifyGranted());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setFailed(false);
    try { setItems(await fetchFeed(user.id)); } catch { setFailed(true); }
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); void notificationStatus().then(setStatus); }, [load]);
  useEffect(() => (user ? subscribeFeed(user.id, (n) => setItems((prev) => [n, ...prev.filter((p) => p.id !== n.id)])) : undefined), [user]);

  const fix = async () => {
    if (await ensureNotificationPermission()) { await scheduleTestReminder(); setStatus(await notificationStatus()); }
    else void openAppSettings();
  };
  const testWeb = async () => {
    const ok = webNotifyGranted() || (await requestWebNotify());
    setWeb(ok);
    playReminderChime();
    if (ok) showWebNotification("🔔 Med1.uz sinov bildirishnomasi", "Bildirishnomalar ishlayapti", "/mobile-appointments?panel=notifications");
  };

  const unread = items.filter((i) => !i.is_read).length;
  const allGood = status?.native ? status.permission && status.exact : web;

  return (
    <div className="space-y-4">
      <section className={cn("rounded-xl border p-4", allGood ? "border-medical-green/40 bg-medical-green/5" : "border-medical-orange/40 bg-medical-orange/5")}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          {allGood ? <CheckCircle2 className="h-4 w-4 text-medical-green" /> : <AlertTriangle className="h-4 w-4 text-medical-orange" />}
          {allGood ? "Bildirishnomalar yoqilgan" : "Bildirishnomalar to‘liq yoqilmagan"}
        </p>
        {status?.native ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>{status.permission ? "✓" : "✗"} Bildirishnomalarga ruxsat</li>
            <li>{status.exact ? "✓" : "✗"} “Signal va eslatmalar” (aniq vaqtda kelishi uchun)</li>
            <li>• Rejalashtirilgan eslatmalar: {status.pending} ta</li>
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Saytda bildirishnoma brauzer ochiq bo‘lganda keladi. Telefonda o‘z vaqtida, ovoz bilan kelishi uchun Med ALL ilovasidan foydalaning.</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {status?.native
            ? <Button size="sm" onClick={() => void fix()}><BellRing /> Tekshirish (10 s)</Button>
            : webNotifySupported() && <Button size="sm" onClick={() => void testWeb()}><BellRing /> {web ? "Sinab ko‘rish" : "Yoqish"}</Button>}
          <Button size="sm" variant="outline" onClick={playReminderChime}><Volume2 /> Signalni eshitish</Button>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4 text-primary" /> Bildirishnomalar {unread > 0 && <span className="rounded-full bg-destructive px-2 text-xs text-destructive-foreground">{unread}</span>}</h3>
        {unread > 0 && user && <Button size="sm" variant="ghost" onClick={() => { void markFeedRead(user.id); setItems((p) => p.map((i) => ({ ...i, is_read: true }))); }}><CheckCheck /> Hammasi o‘qildi</Button>}
      </div>

      {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : failed ? <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">Bildirishnomalarni yuklab bo‘lmadi. <Button variant="link" size="sm" onClick={() => void load()}>Qayta urinish</Button></div>
        : items.length === 0 ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Hozircha bildirishnoma yo‘q. Qabul yaqinlashganda yoki tahlil tayyor bo‘lganda shu yerda chiqadi.</p>
        : (
          <ul className="space-y-2">
            {items.map((n) => {
              const link = safeFeedLink(n.link);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => { if (user && !n.is_read) { void markFeedRead(user.id, [n.id]); setItems((p) => p.map((i) => (i.id === n.id ? { ...i, is_read: true } : i))); } if (link) navigate(link); }}
                    className={cn("w-full rounded-lg border p-3 text-left active:scale-[0.99]", n.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{ago(n.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
};
