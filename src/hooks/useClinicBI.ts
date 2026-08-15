/**
 * useClinicBI — Klinika Business Intelligence uchun markaziy ma'lumot qatlami.
 * Barcha ma'lumot real bazadan olinadi (demo/soxta statistika yo'q).
 * Realtime: appointments / invoices / patients / finance o'zgarganda avtomatik yangilanadi.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface ClinicBIData {
  clinic: any | null;
  appointments: any[];
  doctors: any[];
  services: any[];
  departments: any[];
  invoices: any[];
  finance: any[];
  patients: any[];
  labOrders: any[];
  beds: any[];
  queue: any[];
  pharmacy: any[];
  prescriptions: any[];
  telemed: any[];
  reviews: any[];
  surgeries: any[];
  complaints: any[];
  emergencies: any[];
  insuranceClaims: any[];
  marketing: any[];
  aiUsage: any[];
  targets: any[];
}

const EMPTY: ClinicBIData = {
  clinic: null, appointments: [], doctors: [], services: [], departments: [], invoices: [],
  finance: [], patients: [], labOrders: [], beds: [], queue: [], pharmacy: [], prescriptions: [],
  telemed: [], reviews: [], surgeries: [], complaints: [], emergencies: [], insuranceClaims: [],
  marketing: [], aiUsage: [], targets: [],
};

const LIMIT = 5000;

export function useClinicBI(clinicId: string) {
  const [data, setData] = useState<ClinicBIData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!clinicId) return;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const c = (t: string) => db.from(t).select("*").eq("clinic_id", clinicId).limit(LIMIT);
      const [
        clinic, appointments, doctors, services, departments, invoices, finance, patients,
        labOrders, beds, queue, pharmacy, prescriptions, telemed, reviews, surgeries,
        complaints, emergencies, marketing, targets,
      ] = await Promise.all([
        db.from("registered_clinics").select("*").eq("id", clinicId).maybeSingle(),
        db.from("appointments").select("*").eq("clinic_id", clinicId).order("appointment_date", { ascending: false }).limit(LIMIT),
        c("doctors"), c("clinic_services"), c("hms_departments"), c("hms_invoices"), c("hms_finance"),
        c("hms_patients"), c("hms_lab_orders"), c("hms_beds"), c("hms_queue"), c("hms_pharmacy_stock"),
        c("hms_prescriptions"), c("hms_teleconsultations"), c("reviews"), c("hms_surgeries"),
        c("hms_complaints"), c("hms_emergency"), c("marketing_analytics"), c("clinic_bi_targets"),
      ]);

      const ownerId = clinic?.data?.owner_id;
      let insuranceClaims: any[] = [];
      let aiUsage: any[] = [];
      if (ownerId) {
        const [ic, au] = await Promise.all([
          db.from("insurance_claims").select("*").eq("owner_id", ownerId).limit(LIMIT),
          db.from("ai_usage").select("*").eq("user_id", ownerId).order("used_at", { ascending: false }).limit(1000),
        ]);
        insuranceClaims = ic?.data || [];
        aiUsage = au?.data || [];
      }

      setData({
        clinic: clinic?.data || null,
        appointments: appointments?.data || [],
        doctors: doctors?.data || [],
        services: services?.data || [],
        departments: departments?.data || [],
        invoices: invoices?.data || [],
        finance: finance?.data || [],
        patients: patients?.data || [],
        labOrders: labOrders?.data || [],
        beds: beds?.data || [],
        queue: queue?.data || [],
        pharmacy: pharmacy?.data || [],
        prescriptions: prescriptions?.data || [],
        telemed: telemed?.data || [],
        reviews: reviews?.data || [],
        surgeries: surgeries?.data || [],
        complaints: complaints?.data || [],
        emergencies: emergencies?.data || [],
        insuranceClaims,
        marketing: marketing?.data || [],
        aiUsage,
        targets: targets?.data || [],
      });
      setLastSync(new Date());
      setError(null);
    } catch (e: any) {
      console.error("useClinicBI load error", e);
      setError(e?.message || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  // Realtime — manual refresh talab qilinmaydi
  useEffect(() => {
    if (!clinicId) return;
    const bump = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => load(true), 1200);
    };
    const ch = supabase.channel(`clinic-bi-${clinicId}`);
    ["appointments", "hms_invoices", "hms_patients", "hms_finance", "hms_queue", "hms_beds", "reviews"].forEach((table) => {
      ch.on("postgres_changes" as any, { event: "*", schema: "public", table, filter: `clinic_id=eq.${clinicId}` }, bump);
    });
    ch.subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(ch);
    };
  }, [clinicId, load]);

  return { data, loading, refreshing, lastSync, error, reload: () => load(true) };
}

/** Hisobot ko'rish / eksport qilish auditi. */
export async function logReportAudit(clinicId: string, reportKey: string, action: "view" | "export" | "ai_query", filters: any = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await db.from("clinic_report_audit").insert({
      clinic_id: clinicId, user_id: user.id, report_key: reportKey, action, filters,
    });
  } catch (e) {
    console.warn("report audit skip", e);
  }
}
