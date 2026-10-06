/**
 * Aggregates a patient's visits and lab orders across every booking module
 * (clinic, independent doctors, diagnostics, dental, cosmetology, maternity).
 * Data is read live under RLS — nothing is cached on the device.
 */
import { supabase } from "@/integrations/supabase/client";

export type PatientVisit = {
  id: string;
  source: string;
  sourceLabel: string;
  date: string;
  time: string | null;
  status: string | null;
  notes: string | null;
  title: string;
  subtitle?: string | null;
  address?: string | null;
  phone?: string | null;
  price?: number | null;
  cancellable: boolean;
};

export type LabOrder = {
  id: string;
  source: string;
  testName: string;
  status: string | null;
  orderedAt: string;
  completedAt: string | null;
  ready: boolean;
};

const sb = supabase as any;

type Source = { table: string; label: string; select: string; map: (r: any) => Partial<PatientVisit> };

const VISIT_SOURCES: Source[] = [
  {
    table: "appointments", label: "Klinika",
    select: "id, appointment_date, appointment_time, status, notes, total_price, registered_clinics(name, address, phone), doctors(full_name, specialty), clinic_services(name)",
    map: (r) => ({
      title: r.registered_clinics?.name || "Klinikadagi qabul",
      subtitle: [r.doctors?.full_name && `Dr. ${r.doctors.full_name}`, r.doctors?.specialty, r.clinic_services?.name].filter(Boolean).join(" · ") || null,
      address: r.registered_clinics?.address, phone: r.registered_clinics?.phone, price: r.total_price,
    }),
  },
  { table: "doctor_ext_appointments", label: "Shifokor", select: "id, appointment_date, appointment_time, status, notes, service_name, price", map: (r) => ({ title: "Shifokor qabuli", subtitle: r.service_name, price: r.price }) },
  { table: "diagnostics_appointments", label: "Diagnostika", select: "id, appointment_date, appointment_time, status, notes, service_name, staff_name", map: (r) => ({ title: "Diagnostika markazi", subtitle: [r.service_name, r.staff_name].filter(Boolean).join(" · ") || null }) },
  { table: "dental_appointments", label: "Stomatologiya", select: "id, appointment_date, appointment_time, status, notes, doctor_name", map: (r) => ({ title: "Stomatologiya", subtitle: r.doctor_name }) },
  { table: "cosmetology_appointments", label: "Kosmetologiya", select: "id, appointment_date, appointment_time, status, notes", map: () => ({ title: "Kosmetologiya" }) },
  { table: "maternity_appointments", label: "Tug‘ruqxona", select: "id, appointment_date, appointment_time, status, notes", map: () => ({ title: "Tug‘ruqxona" }) },
];

export async function fetchPatientVisits(userId: string): Promise<{ visits: PatientVisit[]; failed: number }> {
  const results = await Promise.all(
    VISIT_SOURCES.map((s) => sb.from(s.table).select(s.select).eq("patient_id", userId).order("appointment_date", { ascending: false }).limit(50)),
  );
  let failed = 0;
  const visits: PatientVisit[] = [];
  results.forEach((res: any, i: number) => {
    const s = VISIT_SOURCES[i];
    if (res.error) { failed++; return; }
    (res.data ?? []).forEach((r: any) => {
      visits.push({
        id: r.id, source: s.table, sourceLabel: s.label,
        date: r.appointment_date, time: r.appointment_time ?? null, status: r.status ?? null, notes: r.notes ?? null,
        title: s.label, cancellable: s.table === "appointments" && r.status === "pending",
        ...s.map(r),
      } as PatientVisit);
    });
  });
  visits.sort((a, b) => `${b.date}${b.time ?? ""}`.localeCompare(`${a.date}${a.time ?? ""}`));
  return { visits, failed };
}

const CLOSED = new Set(["cancelled", "canceled", "completed", "no_show", "rejected", "done"]);
export const isVisitOpen = (v: PatientVisit) => !CLOSED.has((v.status ?? "").toLowerCase());
export const visitDate = (v: PatientVisit) => new Date(`${v.date}T${(v.time ?? "09:00").slice(0, 5)}:00`);

const READY = new Set(["completed", "ready", "approved", "done", "delivered"]);

export async function fetchLabOrders(userId: string): Promise<LabOrder[]> {
  const [hms, diag] = await Promise.all([
    sb.from("hms_lab_orders").select("id, test_name, status, ordered_at, completed_at").eq("patient_id", userId).order("ordered_at", { ascending: false }).limit(50),
    sb.from("diagnostics_lab_orders").select("id, test_name, status, created_at, completed_at").eq("patient_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  const rows: LabOrder[] = [
    ...((hms.data ?? []) as any[]).map((r) => ({ id: r.id, source: "Klinika", testName: r.test_name || "Tahlil", status: r.status, orderedAt: r.ordered_at, completedAt: r.completed_at, ready: READY.has((r.status ?? "").toLowerCase()) || !!r.completed_at })),
    ...((diag.data ?? []) as any[]).map((r) => ({ id: r.id, source: "Diagnostika", testName: r.test_name || "Tahlil", status: r.status, orderedAt: r.created_at, completedAt: r.completed_at, ready: READY.has((r.status ?? "").toLowerCase()) || !!r.completed_at })),
  ];
  return rows.sort((a, b) => (b.completedAt ?? b.orderedAt).localeCompare(a.completedAt ?? a.orderedAt));
}

export const VISIT_STATUS: Record<string, string> = {
  pending: "Kutilmoqda", confirmed: "Tasdiqlangan", scheduled: "Rejalashtirilgan", booked: "Band qilingan",
  completed: "Yakunlangan", done: "Yakunlangan", cancelled: "Bekor qilingan", canceled: "Bekor qilingan", no_show: "Kelmagan", in_progress: "Jarayonda",
};
