import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarClock, Loader2, XCircle, RefreshCw, BellRing, CreditCard } from "lucide-react";
import { fetchDoctorCalendar, WEEKDAY_UZ, type DayAvailability } from "@/lib/doctorAvailability";

interface Props {
  doctorId: string;
  doctorName?: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Kutilmoqda", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  confirmed: { label: "Tasdiqlangan", cls: "bg-medical-green/10 text-medical-green border-medical-green/20" },
  completed: { label: "Yakunlangan", cls: "bg-primary/10 text-primary border-primary/20" },
  cancelled: { label: "Bekor qilingan", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const PAY: Record<string, { label: string; cls: string }> = {
  pending: { label: "To'lov kutilmoqda", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  paid: { label: "To'langan", cls: "bg-medical-green/10 text-medical-green border-medical-green/20" },
  failed: { label: "To'lov muvaffaqiyatsiz", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  refunded: { label: "Qaytarilgan", cls: "bg-muted text-muted-foreground" },
};

export default function MyDoctorAppointments({ doctorId, doctorName }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [reschedTarget, setReschedTarget] = useState<any>(null);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [dayIdx, setDayIdx] = useState(0);
  const [calLoading, setCalLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("doctor_ext_appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false })
      .limit(10);
    setRows(data || []);
    setLoading(false);
  }, [user, doctorId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!reschedTarget) return;
    setCalLoading(true);
    fetchDoctorCalendar(doctorId, 14)
      .then((d) => { setDays(d); setDayIdx(Math.max(0, d.findIndex((x) => x.freeCount > 0))); })
      .finally(() => setCalLoading(false));
  }, [reschedTarget, doctorId]);

  const cancel = async () => {
    if (!cancelTarget) return;
    setBusy(cancelTarget.id);
    const { error } = await supabase.rpc("cancel_doctor_ext_appointment", {
      _appointment_id: cancelTarget.id,
      _reason: reason.trim() || null,
    });
    setBusy(null);
    if (error) { toast({ title: "Bekor qilinmadi", description: error.message, variant: "destructive" }); return; }
    toast({
      title: "Bron bekor qilindi",
      description: cancelTarget.payment_status === "paid"
        ? "To'lov qaytarilishi 1-3 ish kunida amalga oshiriladi."
        : "Eslatmalar ham o'chirildi.",
    });
    setCancelTarget(null); setReason(""); load();
  };

  const reschedule = async (date: string, time: string) => {
    if (!reschedTarget) return;
    setBusy(reschedTarget.id);
    const { error } = await supabase.rpc("reschedule_doctor_ext_slot", {
      _appointment_id: reschedTarget.id,
      _new_date: date,
      _new_time: time,
      _reason: reason.trim() || null,
    });
    setBusy(null);
    if (error) {
      const msg = error.message.includes("slot_taken") ? "Bu slot band bo'lib qoldi"
        : error.message.includes("reschedule_limit_reached") ? "Qayta bron limiti (3 marta) tugadi"
        : error.message;
      toast({ title: "Qayta bron qilinmadi", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Qabul ko'chirildi", description: `${date} ${time} — eslatmalar yangilandi` });
    setReschedTarget(null); setReason(""); load();
  };

  if (!user || (!loading && rows.length === 0)) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" /> Mening bronlarim{doctorName ? ` — ${doctorName}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          rows.map((r) => {
            const active = r.status !== "cancelled" && r.status !== "completed";
            const st = STATUS[r.status] || STATUS.pending;
            const pay = PAY[r.payment_status] || PAY.pending;
            return (
              <div key={r.id} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.appointment_date} · {String(r.appointment_time).slice(0, 5)} · {r.booking_code}
                    </p>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                    <Badge variant="outline" className={`${pay.cls} gap-1 block`}>
                      <CreditCard className="w-3 h-3 inline" /> {pay.label}
                    </Badge>
                  </div>
                </div>

                {r.status === "confirmed" && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <BellRing className="w-3 h-3 text-primary" /> Eslatma: tasdiqlash + qabuldan 1 soat oldin (SMS/Email/Telegram)
                  </p>
                )}
                {r.status === "cancelled" && r.cancelled_reason && (
                  <p className="text-[11px] text-muted-foreground">Sabab: {r.cancelled_reason}</p>
                )}
                {r.payment_status === "failed" && active && (
                  <p className="text-[11px] text-destructive">
                    To'lov amalga oshmadi — bron avtomatik bekor qilinadi. Qayta to'lang yoki boshqa vaqtga ko'chiring.
                  </p>
                )}

                {active && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                      disabled={busy === r.id || r.reschedule_count >= 3}
                      onClick={() => setReschedTarget(r)}>
                      <RefreshCw className="w-3.5 h-3.5" /> Qayta bron
                      {r.reschedule_count > 0 ? ` (${r.reschedule_count}/3)` : ""}
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-xs text-destructive"
                      disabled={busy === r.id} onClick={() => setCancelTarget(r)}>
                      <XCircle className="w-3.5 h-3.5" /> Bekor qilish
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={!!cancelTarget} onOpenChange={(v) => { if (!v) { setCancelTarget(null); setReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Bronni bekor qilish</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">
            {cancelTarget?.payment_status === "paid"
              ? "Bu qabul to'langan. Bekor qilinsa, to'lov 1-3 ish kunida qaytariladi."
              : "To'lov amalga oshmagan — bron darhol bo'shatiladi."}
          </p>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Bekor qilish sababi (ixtiyoriy)" />
          <Button variant="destructive" onClick={cancel} disabled={!!busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Tasdiqlash
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reschedTarget} onOpenChange={(v) => { if (!v) { setReschedTarget(null); setReason(""); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Boshqa vaqtga ko'chirish</DialogTitle></DialogHeader>
          {calLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((d, i) => {
                  const dt = new Date(`${d.date}T00:00:00`);
                  return (
                    <button key={d.date} onClick={() => setDayIdx(i)}
                      className={`shrink-0 w-16 rounded-xl border px-2 py-2 text-center ${i === dayIdx ? "border-primary bg-primary/10" : "hover:bg-muted/50"} ${d.freeCount === 0 ? "opacity-50" : ""}`}>
                      <p className="text-[10px] text-muted-foreground">{WEEKDAY_UZ[d.weekday]}</p>
                      <p className="text-sm font-bold">{dt.getDate()}</p>
                      <p className="text-[10px] text-medical-green">{d.closed ? "—" : `${d.freeCount}`}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(days[dayIdx]?.slots || []).map((s) => (
                  <Button key={s.time} size="sm" variant="outline" disabled={s.taken || s.past || !!busy}
                    className={`h-8 text-xs ${s.taken || s.past ? "line-through opacity-40" : ""}`}
                    onClick={() => reschedule(days[dayIdx].date, s.time)}>
                    {s.time}
                  </Button>
                ))}
                {(days[dayIdx]?.slots || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Bu kuni bo'sh slot yo'q.</p>
                )}
              </div>
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ko'chirish sababi (ixtiyoriy)" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
