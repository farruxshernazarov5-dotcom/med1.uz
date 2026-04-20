import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, FlaskConical, Pill, FileText, Activity, Heart, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className={cn("rounded-2xl border border-border p-5 bg-gradient-to-br", color)}>
    <Icon className="w-7 h-7 mb-3 text-foreground/80" />
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

const PatientOverview = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingAppts: 0, newResults: 0, prescriptions: 0, family: 0, healthLogs: 0, files: 0,
  });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [latestLog, setLatestLog] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sb = supabase as any;
      const today = new Date().toISOString().split("T")[0];
      const countOf = async (q: any) => (await q).count || 0;
      const [upc, results, presc, family, logs, files, upcomingList, lastLog] = await Promise.all([
        countOf(sb.from("appointments").select("id", { count: "exact", head: true }).eq("patient_id", user.id).gte("appointment_date", today).in("status", ["pending", "confirmed"])),
        countOf(sb.from("hms_lab_results").select("id", { count: "exact", head: true }).eq("patient_id", user.id).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())),
        countOf(sb.from("hms_prescriptions").select("id", { count: "exact", head: true }).eq("patient_id", user.id)),
        countOf(sb.from("family_members").select("id", { count: "exact", head: true }).eq("user_id", user.id)),
        countOf(sb.from("patient_health_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id)),
        countOf(sb.from("patient_documents").select("id", { count: "exact", head: true }).eq("user_id", user.id)),
        sb.from("appointments").select("*").eq("patient_id", user.id).gte("appointment_date", today).in("status", ["pending", "confirmed"]).order("appointment_date").limit(3),
        sb.from("patient_health_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setStats({ upcomingAppts: upc, newResults: results, prescriptions: presc, family, healthLogs: logs, files });
      setUpcoming(upcomingList.data || []);
      setLatestLog(lastLog.data);
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-foreground">Sog'liq paneli</h2>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <Button asChild size="sm" className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Link to="/clinics"><Plus className="w-4 h-4 mr-1" /> Qabulga yozilish</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/doctors"><Search className="w-4 h-4 mr-1" /> Shifokor topish</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onNavigate?.("workflow")}>
          <FlaskConical className="w-4 h-4 mr-1" /> Analizlar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label="Kutilayotgan qabullar" value={stats.upcomingAppts} color="from-secondary/20 to-secondary/5" />
        <StatCard icon={FlaskConical} label="Yangi natijalar (7 kun)" value={stats.newResults} color="from-amber-500/20 to-amber-500/5" />
        <StatCard icon={Pill} label="Retseptlar" value={stats.prescriptions} color="from-rose-500/20 to-rose-500/5" />
        <StatCard icon={FileText} label="Hujjatlar" value={stats.files} color="from-blue-500/20 to-blue-500/5" />
        <StatCard icon={Activity} label="Sog'liq yozuvlari" value={stats.healthLogs} color="from-emerald-500/20 to-emerald-500/5" />
        <StatCard icon={Heart} label="Oila a'zolari" value={stats.family} color="from-pink-500/20 to-pink-500/5" />
      </div>

      {/* Upcoming appointments */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Yaqin kunlardagi qabullar
        </h3>
        {upcoming.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
            Kutilayotgan qabullar yo'q
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{a.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.appointment_date).toLocaleDateString("uz-UZ")} • {a.appointment_time}
                  </p>
                </div>
                <span className={cn("text-[10px] px-2 py-1 rounded-full font-medium",
                  a.status === "confirmed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                )}>
                  {a.status === "confirmed" ? "Tasdiqlangan" : "Kutilmoqda"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest health log */}
      {latestLog && (
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Oxirgi sog'liq yozuvi
          </h3>
          <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {latestLog.weight_kg && <div><p className="text-xs text-muted-foreground">Vazn</p><p className="font-bold text-foreground">{latestLog.weight_kg} kg</p></div>}
            {latestLog.systolic && <div><p className="text-xs text-muted-foreground">Bosim</p><p className="font-bold text-foreground">{latestLog.systolic}/{latestLog.diastolic}</p></div>}
            {latestLog.heart_rate && <div><p className="text-xs text-muted-foreground">Puls</p><p className="font-bold text-foreground">{latestLog.heart_rate} bpm</p></div>}
            {latestLog.spo2 && <div><p className="text-xs text-muted-foreground">SpO2</p><p className="font-bold text-foreground">{latestLog.spo2}%</p></div>}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(latestLog.log_date).toLocaleDateString("uz-UZ")}
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientOverview;
