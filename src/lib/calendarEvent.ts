import type { CreateEventWithPromptOptions } from "@ebarooni/capacitor-calendar";
import { isNativeApp } from "./nativeApp";
import { type PatientVisit } from "./patientRecords";

export function appointmentCalendarEvent(v: Pick<PatientVisit, "id" | "source" | "date" | "time" | "title" | "subtitle" | "address"> & { duration?: number }): CreateEventWithPromptOptions {
  const start = new Date(`${v.date}T${(v.time ?? "09:00").slice(0, 5)}:00+05:00`);
  if (!Number.isFinite(start.getTime())) throw new Error("Qabul sanasi noto‘g‘ri");
  return {
    title: `Med ALL · ${v.title}`, description: v.subtitle ?? "Shifokor qabuli",
    location: v.address ?? "", startDate: start.getTime(), endDate: start.getTime() + (v.duration ?? 30) * 60_000,
    alerts: [-1440, -60], isAllDay: false, skipPrompt: true,
    icsFileName: `medall-${v.source}-${v.id}.ics`,
  };
}

export function reminderCalendarEvent(r: { id: number; title: string; body: string; at?: string; time?: string }, now = new Date()): CreateEventWithPromptOptions {
  let start = r.at ? new Date(r.at) : new Date(now);
  if (r.time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) throw new Error("Eslatma vaqti noto‘g‘ri");
    const [hour, minute] = r.time.split(":").map(Number);
    start = new Date(now); start.setHours(hour, minute, 0, 0);
    if (start <= now) start.setDate(start.getDate() + 1);
  }
  if (!r.time && !r.at || !Number.isFinite(start.getTime())) throw new Error("Eslatma sanasi yo‘q");
  return { title: r.title, description: r.body, startDate: start.getTime(), endDate: start.getTime() + 15 * 60_000,
    alerts: [0], ...(r.time ? { recurrence: { frequency: "daily" as const } } : {}),
    skipPrompt: true, icsFileName: `medall-reminder-${r.id}.ics` };
}

/** Calendar editor needs an explicit user gesture; it never silently writes patient data. */
export async function openCalendarEvent(event: CreateEventWithPromptOptions): Promise<void> {
  const { CapacitorCalendar } = await import("@ebarooni/capacitor-calendar");
  if (isNativeApp()) {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isPluginAvailable("CapacitorCalendar")) throw new Error("Kalendar uchun ilovaning yangi versiyasini o‘rnating");
  }
  await CapacitorCalendar.createEventWithPrompt(event);
}