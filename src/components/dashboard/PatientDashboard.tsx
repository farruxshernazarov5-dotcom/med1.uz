import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, Clock, Building2, User, FileText, Heart, Settings, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};
const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  cancelled: "Bekor qilingan",
  completed: "Yakunlangan",
};

const PatientDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("appointments")
      .select("*, registered_clinics(name), doctors(full_name, specialty), clinic_services(name, price)")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        setAppointments(data || []);
        setLoading(false);
      });
  }, [user]);

  const upcoming = appointments.filter((a) => a.status === "pending" || a.status === "confirmed");
  const history = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Salom, {profile?.full_name || "Foydalanuvchi"} 👋
          </h1>
          <p className="text-muted-foreground">Bemor paneli — qabullaringizni boshqaring</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-hero-gradient text-primary-foreground border-0">
            <Link to="/booking"><Plus className="w-4 h-4 mr-1" /> Qabulga yozilish</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Calendar, label: "Jami qabullar", value: appointments.length, color: "text-primary" },
          { icon: Clock, label: "Kutilmoqda", value: upcoming.length, color: "text-yellow-600" },
          { icon: Heart, label: "Yakunlangan", value: history.filter((a) => a.status === "completed").length, color: "text-green-600" },
          { icon: FileText, label: "Bekor qilingan", value: history.filter((a) => a.status === "cancelled").length, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <s.icon className={cn("w-6 h-6 mb-2", s.color)} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Kelgusi qabullar</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Hozircha qabullaringiz yo'q</p>
            <Button asChild className="bg-hero-gradient text-primary-foreground border-0">
              <Link to="/booking">Qabulga yozilish</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">{a.registered_clinics?.name || "Klinika"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.doctors?.full_name && `Dr. ${a.doctors.full_name} • `}
                    {a.clinic_services?.name || "Konsultatsiya"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{a.appointment_date}</p>
                    <p className="text-xs text-muted-foreground">{a.appointment_time?.slice(0, 5)}</p>
                  </div>
                  <Badge className={cn("text-[10px]", statusColors[a.status])}>{statusLabels[a.status]}</Badge>
                  {a.total_price > 0 && <span className="text-sm font-bold text-primary">{Number(a.total_price).toLocaleString()} so'm</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Tarix</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((a) => (
              <div key={a.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 opacity-70">
                <div className="flex-1">
                  <span className="text-sm text-foreground">{a.registered_clinics?.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{a.appointment_date}</span>
                </div>
                <Badge className={cn("text-[10px]", statusColors[a.status])}>{statusLabels[a.status]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
