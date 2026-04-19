import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, FlaskConical, Pill, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { doctorId: string }

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className={cn("rounded-2xl border border-border p-5 bg-gradient-to-br", color)}>
    <Icon className="w-7 h-7 mb-3 text-foreground/80" />
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

const DocOverview = ({ doctorId }: Props) => {
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, pendingLabs: 0, activePlans: 0, records: 0, prescriptions: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const [p, a, l, pl, r, pr] = await Promise.all([
        supabase.from("doctor_patients").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("appointment_date", today),
        supabase.from("doctor_lab_orders").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("status", "pending"),
        supabase.from("doctor_treatment_plans").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("status", "active"),
        supabase.from("doctor_records").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId),
        supabase.from("hms_prescriptions").select("id", { count: "exact", head: true } as any).eq("doctor_id" as any, doctorId),
      ]);
      setStats({
        patients: p.count || 0,
        todayAppts: a.count || 0,
        pendingLabs: l.count || 0,
        activePlans: pl.count || 0,
        records: r.count || 0,
        prescriptions: pr.count || 0,
      });
    })();
  }, [doctorId]);

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">Bugungi ko'rinish</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Bemorlar" value={stats.patients} color="from-secondary/20 to-secondary/5" />
        <StatCard icon={Calendar} label="Bugungi qabullar" value={stats.todayAppts} color="from-accent/20 to-accent/5" />
        <StatCard icon={FlaskConical} label="Kutayotgan analizlar" value={stats.pendingLabs} color="from-amber-500/20 to-amber-500/5" />
        <StatCard icon={Activity} label="Faol davolash kurslari" value={stats.activePlans} color="from-emerald-500/20 to-emerald-500/5" />
        <StatCard icon={FileText} label="Tibbiy yozuvlar" value={stats.records} color="from-blue-500/20 to-blue-500/5" />
        <StatCard icon={Pill} label="Retseptlar" value={stats.prescriptions} color="from-rose-500/20 to-rose-500/5" />
      </div>
    </div>
  );
};

export default DocOverview;
