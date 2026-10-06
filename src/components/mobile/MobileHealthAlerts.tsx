import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isNativeApp } from "@/lib/nativeApp";
import {
  getLabSeenAt, hasNotificationPermission, isLabAlertsEnabled, notifyNow, setLabSeenAt, syncAppointmentReminders,
} from "@/lib/nativeHealth";
import { fetchLabOrders, fetchPatientVisits, isVisitOpen, visitDate } from "@/lib/patientRecords";

const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * Background patient alerts while the app is open:
 * - lab result ready → phone notification (native) or in-app banner (web)
 * - appointment within 24h → reminder; native app also re-schedules OS reminders
 */
export const MobileHealthAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const apptWarned = useRef(new Set<string>());
  const synced = useRef(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    const run = async () => {
      if (!alive || document.visibilityState === "hidden") return;
      const native = isNativeApp();
      const allowed = native && (await hasNotificationPermission());

      // 1. Lab results that became ready since the last check.
      if (isLabAlertsEnabled()) {
        const seen = getLabSeenAt();
        const labs = await fetchLabOrders(user.id).catch(() => []);
        const fresh = labs.filter((l) => l.ready && (l.completedAt ?? "") > seen);
        setLabSeenAt(new Date().toISOString());
        if (fresh.length) {
          const title = "🧪 Tahlil natijasi tayyor";
          const body = fresh.length === 1 ? `${fresh[0].testName} natijasini ko‘rishingiz mumkin` : `${fresh.length} ta tahlil natijasi tayyor`;
          if (allowed) await notifyNow(title, body, "/mobile-appointments?panel=labs").catch(() => {});
          else toast(title, { description: body, action: { label: "Ko‘rish", onClick: () => navigate("/mobile-appointments?panel=labs") } });
        }
      }

      // 2. Upcoming visits.
      const { visits } = await fetchPatientVisits(user.id).catch(() => ({ visits: [] }));
      const upcoming = visits.filter((v) => isVisitOpen(v) && visitDate(v).getTime() > Date.now());
      if (allowed && !synced.current) {
        synced.current = true;
        await syncAppointmentReminders(upcoming.map((v) => ({ id: v.id, when: visitDate(v), label: v.title }))).catch(() => {});
      }
      upcoming
        .filter((v) => visitDate(v).getTime() - Date.now() < 24 * 3600e3 && !apptWarned.current.has(v.id))
        .forEach((v) => {
          apptWarned.current.add(v.id);
          if (allowed) return; // OS reminders already cover native users
          toast("🩺 Qabulingiz yaqinlashdi", {
            description: `${v.title} — ${visitDate(v).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}`,
            action: { label: "Ochish", onClick: () => navigate("/mobile-appointments?panel=upcoming") },
          });
        });
    };

    const t = window.setTimeout(run, 2500);
    const i = window.setInterval(run, CHECK_EVERY_MS);
    const onVis = () => { if (document.visibilityState === "visible") void run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; window.clearTimeout(t); window.clearInterval(i); document.removeEventListener("visibilitychange", onVis); };
  }, [user, navigate]);

  return null;
};
