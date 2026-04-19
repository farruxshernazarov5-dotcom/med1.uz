import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props { doctorId: string }

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Kutilmoqda", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  confirmed: { label: "Tasdiqlangan", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed: { label: "Tugallangan", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled: { label: "Bekor qilingan", color: "bg-muted text-muted-foreground" },
};

const DocAppointments = ({ doctorId }: Props) => {
  const [appts, setAppts] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("appointments").select("*")
      .eq("doctor_id", doctorId).order("appointment_date", { ascending: false }).limit(50);
    setAppts(data || []);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("doc-appts")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${doctorId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [doctorId]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast({ title: "Status yangilandi" });
  };

  // Auto-add to doctor_patients on completion
  const completeAndAdd = async (appt: any) => {
    await supabase.from("appointments").update({ status: "completed" }).eq("id", appt.id);
    await supabase.from("doctor_patients").upsert({
      doctor_id: doctorId,
      patient_user_id: appt.patient_id,
      full_name: appt.patient_name,
      phone: appt.patient_phone,
      source: "appointment",
      appointment_id: appt.id,
      last_visit_date: new Date().toISOString(),
    }, { onConflict: "doctor_id,phone", ignoreDuplicates: false });
    toast({ title: "✅ Tugallandi va bemorlar ro'yxatiga qo'shildi" });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-xl text-foreground">Qabullar (real-time)</h2>

      {appts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" /> Hali qabullar yo'q
        </div>
      ) : (
        <div className="space-y-3">
          {appts.map((a) => {
            const s = STATUS[a.status] || STATUS.pending;
            return (
              <div key={a.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{a.patient_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.appointment_date).toLocaleDateString("uz-UZ")}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.appointment_time}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.patient_phone}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={s.color}>{s.label}</Badge>
                </div>
                {a.notes && <p className="text-sm text-muted-foreground mb-2">{a.notes}</p>}
                <div className="flex gap-2">
                  {a.status === "pending" && <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "confirmed")}>Tasdiqlash</Button>}
                  {(a.status === "pending" || a.status === "confirmed") && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => completeAndAdd(a)}>Tugallash</Button>}
                  {a.status !== "cancelled" && a.status !== "completed" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(a.id, "cancelled")}>Bekor</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocAppointments;
