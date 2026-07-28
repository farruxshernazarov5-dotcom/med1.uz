import { supabase } from "@/integrations/supabase/client";

export interface AvailabilityRow {
  doctor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";
const DEFAULT_SLOT = 30;

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const toTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Generate the raw slot grid for one day from an availability row (or defaults). */
export function buildSlots(row?: Partial<AvailabilityRow> | null): string[] {
  const start = toMinutes(String(row?.start_time ?? DEFAULT_START).slice(0, 5));
  const end = toMinutes(String(row?.end_time ?? DEFAULT_END).slice(0, 5));
  const step = row?.slot_minutes ?? DEFAULT_SLOT;
  const out: string[] = [];
  for (let m = start; m + step <= end; m += step) out.push(toTime(m));
  return out;
}

export interface DayAvailability {
  date: string;
  weekday: number;
  slots: { time: string; taken: boolean; past: boolean }[];
  freeCount: number;
  closed: boolean;
}

/** Fetch availability + booked slots for a doctor across the next `days` days. */
export async function fetchDoctorCalendar(doctorId: string, days = 14): Promise<DayAvailability[]> {
  const today = new Date();
  const from = dateKey(today);
  const last = new Date(today);
  last.setDate(last.getDate() + days - 1);

  const [{ data: avail }, { data: booked }] = await Promise.all([
    supabase
      .from("doctor_ext_availability")
      .select("weekday, start_time, end_time, slot_minutes")
      .eq("doctor_id", doctorId)
      .eq("is_active", true),
    supabase
      .from("doctor_ext_appointments")
      .select("appointment_date, appointment_time, status")
      .eq("doctor_id", doctorId)
      .gte("appointment_date", from)
      .lte("appointment_date", dateKey(last))
      .neq("status", "cancelled"),
  ]);

  const availByDay = new Map<number, any>();
  (avail || []).forEach((r: any) => availByDay.set(r.weekday, r));
  const hasCustom = (avail || []).length > 0;

  const takenSet = new Set(
    (booked || []).map((b: any) => `${b.appointment_date}|${String(b.appointment_time).slice(0, 5)}`)
  );

  const nowMin = today.getHours() * 60 + today.getMinutes();
  const out: DayAvailability[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const wd = d.getDay();
    const key = dateKey(d);
    const row = availByDay.get(wd);
    // Without configured availability fall back to Mon–Sat default hours
    const closed = hasCustom ? !row : wd === 0;
    const slots = closed
      ? []
      : buildSlots(row).map((time) => ({
          time,
          taken: takenSet.has(`${key}|${time}`),
          past: i === 0 && toMinutes(time) <= nowMin,
        }));
    out.push({
      date: key,
      weekday: wd,
      slots,
      closed,
      freeCount: slots.filter((s) => !s.taken && !s.past).length,
    });
  }
  return out;
}

export const WEEKDAY_UZ = ["Yak", "Du", "Se", "Chor", "Pay", "Jum", "Shan"];
