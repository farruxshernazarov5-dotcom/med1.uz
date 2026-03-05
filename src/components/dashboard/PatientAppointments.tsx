import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, Clock, Building2, User, Phone, MapPin, FileText, Plus, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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

const PatientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "history">("upcoming");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("appointments")
      .select("*, registered_clinics(name, address, phone), doctors(full_name, specialty, photo_url), clinic_services(name, price, duration_minutes)")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        setAppointments(data || []);
        setLoading(false);
      });

    // Realtime
    const ch = supabase
      .channel("patient-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        supabase
          .from("appointments")
          .select("*, registered_clinics(name, address, phone), doctors(full_name, specialty, photo_url), clinic_services(name, price, duration_minutes)")
          .eq("patient_id", user.id)
          .order("appointment_date", { ascending: false })
          .then(({ data }) => setAppointments(data || []));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Qabul bekor qilindi" });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    }
  };

  const filtered = appointments.filter((a) => {
    if (filter === "upcoming") return a.status === "pending" || a.status === "confirmed";
    if (filter === "history") return a.status === "completed" || a.status === "cancelled";
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">📅 Qabullarim</h2>
        <Button asChild className="bg-hero-gradient text-primary-foreground border-0">
          <Link to="/booking"><Plus className="w-4 h-4 mr-1" /> Yangi qabul</Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 w-fit">
        {([["upcoming", "Kelgusi"], ["history", "Tarix"], ["all", "Hammasi"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Qabullar yo'q</h3>
          <p className="text-muted-foreground text-sm mb-4">Onlayn qabulga yoziling</p>
          <Button asChild className="bg-hero-gradient text-primary-foreground border-0">
            <Link to="/booking">Qabulga yozilish</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <div key={a.id} className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Doctor photo */}
                <div className="shrink-0">
                  {a.doctors?.photo_url ? (
                    <img src={a.doctors.photo_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground truncate">{a.registered_clinics?.name || "Klinika"}</span>
                    <Badge className={cn("text-[10px] shrink-0", statusColors[a.status])}>{statusLabels[a.status]}</Badge>
                  </div>

                  {a.doctors?.full_name && (
                    <p className="text-sm text-muted-foreground">
                      Dr. {a.doctors.full_name}{a.doctors.specialty ? ` • ${a.doctors.specialty}` : ""}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.appointment_date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.appointment_time?.slice(0, 5)}</span>
                    {a.clinic_services?.name && (
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {a.clinic_services.name}</span>
                    )}
                    {a.registered_clinics?.address && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.registered_clinics.address}</span>
                    )}
                  </div>

                  {a.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{a.notes}"</p>}
                </div>

                {/* Price & Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {a.total_price > 0 && (
                    <span className="text-lg font-bold text-primary">{Number(a.total_price).toLocaleString()} so'm</span>
                  )}
                  {a.status === "pending" && (
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => cancelAppointment(a.id)}>
                      <XCircle className="w-3 h-3 mr-1" /> Bekor qilish
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
