import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpDown, Bell, BellRing, CheckCheck, CheckCircle2, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ensureNotificationPermission, notificationStatus, playReminderChime, scheduleTestReminder, type NotifyStatus } from "@/lib/nativeHealth";
import { openAppSettings } from "@/lib/nativeHealth";
import { feedKind, FEED_FILTERS, fetchFeed, markFeedRead, requestWebNotify, safeFeedLink, showWebNotification, subscribeFeed, webNotifyGranted, webNotifySupported, type FeedItem, type FeedKind } from "@/lib/notificationsFeed";
import { cn } from "@/lib/utils";

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "hozir";
  if (m < 60) return `${m} daq oldin`;
  if (m < 1440) return `${Math.round(m / 60)} soat oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
};

const dayGroup = (iso: string) => {
  const d = new Date(iso); const start = new Date(); start.setHours(0, 0, 0, 0);
  const diff = (start.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5;
  if (diff <= 0) return "Bugun";
  if (diff === 1) return "Kecha";
  if (diff < 7) return "Shu hafta";
  if (diff < 31) return "Shu oy";
  return "Oldinroq";
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
  const [kind, setKind] = useState<FeedKind | "all">("all");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [newest, setNewest] = useState(true);

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
  const shown = useMemo(() => {
    const list = items.filter((i) => (kind === "all" || feedKind(i.type) === kind) && (!onlyUnread || !i.is_read));
    return newest ? list : [...list].reverse();
  }, [items, kind, onlyUnread, newest]);
  const groups = useMemo(() => {
    const map = new Map<string, FeedItem[]>();
    for (const n of shown) { const g = dayGroup(n.created_at); map.set(g, [...(map.get(g) ?? []), n]); }
    return [...map.entries()];
  }, [shown]);
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

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {FEED_FILTERS.map((f) => {
          const count = f.id === "all" ? items.length : items.filter((i) => feedKind(i.type) === f.id).length;
          return (
            <button key={f.id} type="button" onClick={() => setKind(f.id)} aria-pressed={kind === f.id}
              className={cn("flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium", kind === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
              <span aria-hidden>{f.emoji}</span>{f.label}<span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant={onlyUnread ? "default" : "outline"} onClick={() => setOnlyUnread((v) => !v)}>{onlyUnread ? "Faqat o‘qilmagan" : "Hammasi"}</Button>
        <Button size="sm" variant="outline" onClick={() => setNewest((v) => !v)}><ArrowUpDown /> {newest ? "Yangilari oldin" : "Eskilari oldin"}</Button>
      </div>

      {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : failed ? <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">Bildirishnomalarni yuklab bo‘lmadi. <Button variant="link" size="sm" onClick={() => void load()}>Qayta urinish</Button></div>
        : shown.length === 0 ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{items.length ? "Bu filtr bo‘yicha bildirishnoma yo‘q." : "Hozircha bildirishnoma yo‘q. Qabul, tahlil, e’lon, to‘lov va xavfsizlik xabarlari shu yerda chiqadi."}</p>
        : (
          <div className="space-y-4">
            {groups.map(([label, list]) => (
              <section key={label}>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <ul className="space-y-2">
                  {list.map((n) => {
                    const link = safeFeedLink(n.link);
                    const f = FEED_FILTERS.find((x) => x.id === feedKind(n.type));
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => { if (user && !n.is_read) { void markFeedRead(user.id, [n.id]); setItems((p) => p.map((i) => (i.id === n.id ? { ...i, is_read: true } : i))); } if (link) navigate(link); }}
                          className={cn("flex w-full gap-3 rounded-lg border p-3 text-left active:scale-[0.99]", n.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5", feedKind(n.type) === "security" && !n.is_read && "border-destructive/50 bg-destructive/5")}
                        >
                          <span aria-hidden className="mt-0.5 text-lg leading-none">{f?.emoji ?? "🔔"}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold">{n.title}</span>
                              <span className="shrink-0 text-[11px] text-muted-foreground">{ago(n.created_at)}</span>
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">{n.message}</span>
                            <span className="mt-1 block text-[10px] font-semibold uppercase text-primary">{f?.label ?? "Boshqa"}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
    </div>
  );
};
