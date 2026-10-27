import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isNativeApp } from "@/lib/nativeApp";
import {
  getLabSeenAt, hasNotificationPermission, isLabAlertsEnabled, notifyNow, playReminderChime, setLabSeenAt, syncAppointmentReminders,
} from "@/lib/nativeHealth";
import { fetchLabOrders, fetchPatientVisits, isVisitOpen, visitDate } from "@/lib/patientRecords";
import { pushFeedOnce, safeFeedLink, showWebNotification, subscribeFeed } from "@/lib/notificationsFeed";

const CHECK_EVERY_MS = 2 * 60 * 1000;

/**
 * Background patient alerts while the app is open:
 * - lab result ready / appointment within 24h → saved to the Bildirishnomalar feed
 * - every new feed entry (also from clinics and the server) → sound + banner,
 *   and a phone notification in the native app
 * - native app re-schedules OS reminders for upcoming visits
 */
export const MobileHealthAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lastSync = useRef("");

  // Live feed: any new notification row rings and shows immediately.
  useEffect(() => {
    if (!user) return;
    return subscribeFeed(user.id, (n) => {
      const link = safeFeedLink(n.link) ?? "/mobile-appointments?panel=notifications";
      playReminderChime();
      void import("@/lib/voiceNotify").then(m => m.speakNotification(n.id, n.title, n.message)).catch(() => {});
      if (isNativeApp()) void hasNotificationPermission().then((ok) => ok && notifyNow(n.title, n.message, link).catch(() => {}));
      else if (document.visibilityState === "hidden") showWebNotification(n.title, n.message, link);
      toast(n.title, { description: n.message, duration: 10000, action: { label: "Ko‘rish", onClick: () => navigate(link) } });
    });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    lastSync.current = "";

    const run = async () => {
      if (!alive || document.visibilityState === "hidden") return;
      const allowed = isNativeApp() && (await hasNotificationPermission());

      // 1. Lab results that became ready since the last check.
      if (isLabAlertsEnabled()) {
        const seen = getLabSeenAt();
        const labs = await fetchLabOrders(user.id).catch(() => null);
        if (!alive) return;
        if (labs) {
          setLabSeenAt(new Date().toISOString());
          for (const l of labs.filter((x) => x.ready && (x.completedAt ?? "") > seen)) {
            await pushFeedOnce(user.id, "🧪 Tahlil natijasi tayyor", `${l.testName} natijasini ko‘rishingiz mumkin`, `/mobile-appointments?panel=labs&lab=${l.id}`, "lab_ready");
          }
        }
      }

      // 2. Upcoming visits.
      const { visits } = await fetchPatientVisits(user.id).catch(() => ({ visits: [] }));
      if (!alive) return;
      const upcoming = visits.filter((v) => isVisitOpen(v) && visitDate(v).getTime() > Date.now());
      const signature = upcoming.map((v) => `${v.id}@${visitDate(v).getTime()}`).join("|");
      if (allowed && signature !== lastSync.current) {
        await syncAppointmentReminders(upcoming.map((v) => ({ id: v.id, when: visitDate(v), label: v.title }))).then(() => { lastSync.current = signature; }).catch(() => {});
      }
      for (const v of upcoming.filter((x) => visitDate(x).getTime() - Date.now() < 24 * 3600e3)) {
        const when = visitDate(v).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" });
        await pushFeedOnce(user.id, "🩺 Qabulingiz yaqinlashdi", `${v.title} — ${when}`, `/mobile-appointments?panel=upcoming&visit=${v.id}`, "appointment_soon");
      }
    };

    const t = window.setTimeout(run, 2500);
    const i = window.setInterval(run, CHECK_EVERY_MS);
    const onVis = () => { if (document.visibilityState === "visible") void run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; window.clearTimeout(t); window.clearInterval(i); document.removeEventListener("visibilitychange", onVis); };
  }, [user]);

  return null;
};
