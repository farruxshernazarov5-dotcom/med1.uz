import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DoctorDialogContent from "./DoctorDialogContent";
import { Button } from "@/components/ui/button";
import CalendarEventButton from "./CalendarEventButton";
import { appointmentCalendarEvent } from "@/lib/calendarEvent";
import { VISIT_STATUS } from "@/lib/patientRecords";
import { signInDestination } from "@/lib/authDestination";
import { nasiyaThreeMonthQuote } from "@/lib/nasiyaPricing";

type Booking = { id: string; booking_code: string; appointment_date: string; appointment_time: string; service_name: string; duration_minutes: number; patient_name: string; price: number; payment_method: string; payment_status: string; status: string };
const PAYMENT: Record<string, string> = { pending: "To‘lov kutilmoqda", paid: "To‘langan", completed: "To‘langan", failed: "To‘lov amalga oshmagan", refunded: "Qaytarilgan", cancelled: "Bekor qilingan" };
const METHODS: Record<string, string> = { cash: "Klinikada naqd/karta", click: "Click", payme: "Payme", uzum_nasiya: "Uzum Nasiya · 3 oy" };

export default function BookingDetailsDialog({ code, doctorId, doctorName, slug, specialty, address, onClose }: { code: string | null; doctorId: string; doctorName: string; slug: string; specialty?: string | null; address?: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const [row, setRow] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<{ amount: number; status: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    setRow(null); setPayment(null); setError("");
    if (!code || !user) return;
    if (!/^[A-Fa-f0-9]{10}$/.test(code)) { setError("Bron kodi noto‘g‘ri"); return; }
    let active = true; setBusy(true);
    void (async () => {
      const result = await supabase.from("doctor_ext_appointments").select("id,booking_code,appointment_date,appointment_time,service_name,duration_minutes,patient_name,price,payment_method,payment_status,status").eq("doctor_id", doctorId).eq("booking_code", code.toUpperCase()).maybeSingle();
      if (!active) return;
      if (result.error || !result.data) { setError("Qabul topilmadi yoki bu hisobga uni ko‘rish ruxsati yo‘q."); setBusy(false); return; }
      setRow(result.data as Booking);
      const paid = await supabase.from("platform_payments").select("amount,status").eq("reference_id", result.data.id).eq("purpose", "doctor_appointment").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!active) return;
      if (paid.error) setError("To‘lovning batafsil ma’lumoti yuklanmadi; qabuldagi oxirgi holat ko‘rsatilmoqda.");
      else setPayment(paid.data);
      setBusy(false);
    })().catch(() => { if (active) { setError("Qabul ma’lumoti yuklanmadi"); setBusy(false); } });
    return () => { active = false; };
  }, [code, doctorId, user?.id, reload]);
  return <Dialog open={!!code} onOpenChange={open => { if (!open) onClose(); }}><DoctorDialogContent className="max-w-lg overflow-y-auto max-sm:block max-sm:space-y-4">
    <DialogTitle>Qabul ma’lumotlari</DialogTitle><DialogDescription className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Faqat ruxsatli hisobda ko‘rinadi.</DialogDescription>
    {!user ? <Button asChild><Link to={signInDestination(`/doctors/ext/${slug}?booking=${code ?? ""}`)}>Qabulni ko‘rish uchun kirish</Link></Button> : busy ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : <>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {row && <div className="space-y-4 text-sm">
        <div><h2 className="text-lg font-bold">{doctorName}</h2><p className="text-muted-foreground">{specialty}</p>{address && <p>{address}</p>}</div>
        <dl className="space-y-3">{[["Bron kodi", row.booking_code], ["Bemor", row.patient_name], ["Xizmat", row.service_name], ["Sana / vaqt", `${row.appointment_date} · ${row.appointment_time.slice(0, 5)}`], ["Davomiyligi", `${row.duration_minutes} daqiqa`], ["Qabul holati", VISIT_STATUS[row.status] ?? row.status], ["To‘lov usuli", METHODS[row.payment_method] ?? row.payment_method], ["To‘lov summasi", `${Number(payment?.amount ?? (row.payment_method === "uzum_nasiya" ? nasiyaThreeMonthQuote(row.price).total : row.price)).toLocaleString("uz-UZ")} so‘m`], ["To‘lov holati", PAYMENT[payment?.status ?? row.payment_status] ?? row.payment_status]].map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 border-b border-border pb-2"><dt className="text-muted-foreground">{label}</dt><dd className="break-words text-right font-medium">{value}</dd></div>)}</dl>
        <CalendarEventButton event={() => appointmentCalendarEvent({ id: row.id, source: "doctor_ext_appointments", title: doctorName, subtitle: row.service_name, date: row.appointment_date, time: row.appointment_time, duration: row.duration_minutes, address })} />
      </div>}
      <Button variant="outline" onClick={() => setReload(n => n + 1)}><RefreshCw className="h-4 w-4" />Yangilash</Button>
    </>}
  </DoctorDialogContent></Dialog>;
}