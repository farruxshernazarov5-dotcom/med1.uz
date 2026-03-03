import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Calendar, DollarSign, Stethoscope, Pill, Droplets, Wrench, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [stats, setStats] = useState({
    clinics: 0,
    doctors: 0,
    appointments: 0,
    users: 0,
    services: 0,
    revenue: 0,
  });
  const [recentAppts, setRecentAppts] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "clinics" | "appointments">("overview");

  useEffect(() => {
    const fetchAll = async () => {
      const [clinicRes, doctorRes, apptRes, userRes, srvRes] = await Promise.all([
        supabase.from("registered_clinics").select("*", { count: "exact" }),
        supabase.from("doctors").select("id", { count: "exact" }),
        supabase.from("appointments").select("*, registered_clinics(name)").order("created_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("clinic_services").select("id", { count: "exact" }),
      ]);

      const appts = apptRes.data || [];
      const revenue = appts.filter((a) => a.status === "completed").reduce((s, a) => s + Number(a.total_price || 0), 0);

      setStats({
        clinics: clinicRes.count || 0,
        doctors: doctorRes.count || 0,
        appointments: appts.length,
        users: userRes.count || 0,
        services: srvRes.count || 0,
        revenue,
      });
      setRecentAppts(appts);
      setClinics(clinicRes.data || []);
    };
    fetchAll();
  }, []);

  const tabs = [
    { id: "overview", label: "Umumiy", icon: Building2 },
    { id: "clinics", label: "Klinikalar", icon: Building2 },
    { id: "appointments", label: "Qabullar", icon: Calendar },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Panel 🛡️</h1>
          <p className="text-muted-foreground text-sm">Platformani boshqarish</p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users, label: "Foydalanuvchilar", value: stats.users },
            { icon: Building2, label: "Klinikalar", value: stats.clinics },
            { icon: Stethoscope, label: "Shifokorlar", value: stats.doctors },
            { icon: DollarSign, label: "Xizmatlar", value: stats.services },
            { icon: Calendar, label: "Qabullar", value: stats.appointments },
            { icon: DollarSign, label: "Daromad", value: `${stats.revenue.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <s.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "clinics" && (
        <div className="space-y-3">
          {clinics.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Klinikalar yo'q</p>
          ) : clinics.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.address || "Manzil ko'rsatilmagan"} • {c.phone || ""}</p>
              </div>
              <Badge className={c.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {c.is_active ? "Faol" : "Nofaol"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {tab === "appointments" && (
        <div className="space-y-2">
          {recentAppts.map((a) => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{a.patient_name}</p>
                <p className="text-xs text-muted-foreground">{a.registered_clinics?.name} • {a.appointment_date}</p>
              </div>
              <Badge className={cn("text-[10px]",
                a.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                a.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
              )}>{a.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
