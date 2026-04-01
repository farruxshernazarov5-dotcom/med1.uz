import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Users, Calendar, DollarSign, Plus, Settings, BarChart3,
  CheckCircle, X, Clock, Activity, Heart, ArrowLeft
} from "lucide-react";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import { writeAuditLog } from "@/utils/auditLog";

// Interactive tooth chart data
const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const TOOTH_STATUSES: Record<string, { label: string; color: string }> = {
  healthy: { label: "Sog'lom", color: "bg-green-500" },
  caries: { label: "Kariyes", color: "bg-yellow-500" },
  filled: { label: "Plomba", color: "bg-blue-500" },
  crown: { label: "Koronka", color: "bg-purple-500" },
  missing: { label: "Yo'q", color: "bg-red-500" },
  implant: { label: "Implant", color: "bg-cyan-500" },
};

const DentalDashboard = () => {
  const { user, profile } = useAuth();
  const [clinic, setClinic] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  // Patient form
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [pForm, setPForm] = useState({ full_name: "", phone: "", date_of_birth: "", gender: "male" });

  // Tooth chart
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [toothChart, setToothChart] = useState<Record<number, string>>({});

  const fetchData = async () => {
    if (!user) return;
    const { data: c } = await supabase.from("registered_dental_clinics").select("*").eq("owner_id", user.id).maybeSingle();
    if (c) {
      setClinic(c);
      const [p, a, s, t] = await Promise.all([
        supabase.from("dental_patients").select("*").eq("clinic_id", c.id).order("created_at", { ascending: false }),
        supabase.from("dental_appointments").select("*").eq("clinic_id", c.id).order("appointment_date", { ascending: false }),
        supabase.from("dental_services").select("*").eq("clinic_id", c.id),
        supabase.from("dental_treatments").select("*").eq("clinic_id", c.id).order("created_at", { ascending: false }),
      ]);
      setPatients(p.data || []);
      setAppointments(a.data || []);
      setServices(s.data || []);
      setTreatments(t.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddPatient = async () => {
    if (!clinic || !pForm.full_name || !pForm.phone) return;
    const { error } = await supabase.from("dental_patients").insert({
      clinic_id: clinic.id, full_name: pForm.full_name, phone: pForm.phone,
      date_of_birth: pForm.date_of_birth || null, gender: pForm.gender,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ action: "create", entity_type: "dental_patient", module: "dental", details: { name: pForm.full_name } });
    toast({ title: "Bemor qo'shildi" });
    setPForm({ full_name: "", phone: "", date_of_birth: "", gender: "male" });
    setShowAddPatient(false);
    fetchData();
  };

  const openToothChart = (patient: any) => {
    setSelectedPatient(patient);
    setToothChart(patient.tooth_chart || {});
    setTab("tooth-chart");
  };

  const setToothStatus = async (toothNum: number, status: string) => {
    const updated = { ...toothChart, [toothNum]: status };
    setToothChart(updated);
    if (selectedPatient) {
      await supabase.from("dental_patients").update({ tooth_chart: updated } as any).eq("id", selectedPatient.id);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const completedTreatments = treatments.filter(t => t.status === "completed");

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Umumiy", icon: BarChart3 },
    { id: "patients", label: "Bemorlar", icon: Users },
    { id: "tooth-chart", label: "Tish xaritasi", icon: Heart },
    { id: "appointments", label: "Qabullar", icon: Calendar },
    { id: "treatments", label: "Davolash", icon: Activity },
    { id: "services", label: "Xizmatlar", icon: Stethoscope },
    { id: "settings", label: "Sozlamalar", icon: Settings },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!clinic) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Stomatologiya klinikangiz topilmadi</div>;

  return (
    <DashboardShell
      title={`🦷 ${clinic.name}`}
      subtitle="Stomatologiya boshqaruv paneli"
      icon={Stethoscope}
      sidebarItems={sidebarItems}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Bemorlar", value: patients.length, icon: Users, color: "text-blue-600" },
              { label: "Bugungi qabullar", value: todayAppts.length, icon: Calendar, color: "text-green-600" },
              { label: "Davolashlar", value: treatments.length, icon: Activity, color: "text-purple-600" },
              { label: "Xizmatlar", value: services.length, icon: Stethoscope, color: "text-primary" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                <s.icon className={cn("w-6 h-6 mb-2", s.color)} />
                <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Bugungi qabullar</h3>
            {todayAppts.length === 0 ? <p className="text-muted-foreground text-sm">Bugun qabul yo'q</p> :
              todayAppts.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">{a.appointment_time}</span>
                  <span className="text-sm text-muted-foreground">{a.doctor_name || "Shifokor"}</span>
                  <Badge variant="outline">{a.status}</Badge>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {tab === "patients" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-xl font-bold text-foreground">Bemorlar</h2>
            <Button onClick={() => setShowAddPatient(true)}><Plus className="w-4 h-4 mr-1" /> Yangi bemor</Button>
          </div>
          {showAddPatient && (
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <Input placeholder="Ism familiya" value={pForm.full_name} onChange={e => setPForm(p => ({ ...p, full_name: e.target.value }))} />
              <Input placeholder="Telefon" value={pForm.phone} onChange={e => setPForm(p => ({ ...p, phone: e.target.value }))} />
              <Input type="date" value={pForm.date_of_birth} onChange={e => setPForm(p => ({ ...p, date_of_birth: e.target.value }))} />
              <div className="flex gap-2">
                <Button onClick={handleAddPatient}>Saqlash</Button>
                <Button variant="outline" onClick={() => setShowAddPatient(false)}>Bekor</Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {patients.map(p => (
              <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone} {p.date_of_birth && `• ${p.date_of_birth}`}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openToothChart(p)}>🦷 Tish xaritasi</Button>
              </div>
            ))}
            {patients.length === 0 && <p className="text-center py-8 text-muted-foreground">Bemorlar topilmadi</p>}
          </div>
        </div>
      )}

      {tab === "tooth-chart" && (
        <div className="space-y-6">
          {selectedPatient ? (
            <>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setTab("patients"); }}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
                </Button>
                <h2 className="font-heading text-xl font-bold text-foreground">🦷 {selectedPatient.full_name} — Tish xaritasi</h2>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <div className={cn("w-3 h-3 rounded-full", v.color)} />
                    <span className="text-xs text-muted-foreground">{v.label}</span>
                  </div>
                ))}
              </div>
              {/* Upper teeth */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <p className="text-xs text-muted-foreground mb-3 text-center">Yuqori jag'</p>
                <div className="flex justify-center gap-1 flex-wrap">
                  {TEETH_UPPER.map(t => {
                    const status = toothChart[t] || "healthy";
                    return (
                      <div key={t} className="relative group">
                        <button
                          className={cn("w-9 h-9 rounded-lg border-2 border-border text-xs font-bold flex items-center justify-center transition-all hover:scale-110",
                            TOOTH_STATUSES[status]?.color || "bg-muted", "text-white"
                          )}
                        >
                          {t}
                        </button>
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg z-50 p-1 min-w-[100px]">
                          {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
                            <button key={k} onClick={() => setToothStatus(t, k)} className="text-xs px-2 py-1 text-left hover:bg-muted rounded flex items-center gap-1">
                              <div className={cn("w-2 h-2 rounded-full", v.color)} /> {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4 mb-3 text-center">Pastki jag'</p>
                <div className="flex justify-center gap-1 flex-wrap">
                  {TEETH_LOWER.map(t => {
                    const status = toothChart[t] || "healthy";
                    return (
                      <div key={t} className="relative group">
                        <button
                          className={cn("w-9 h-9 rounded-lg border-2 border-border text-xs font-bold flex items-center justify-center transition-all hover:scale-110",
                            TOOTH_STATUSES[status]?.color || "bg-muted", "text-white"
                          )}
                        >
                          {t}
                        </button>
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg z-50 p-1 min-w-[100px]">
                          {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
                            <button key={k} onClick={() => setToothStatus(t, k)} className="text-xs px-2 py-1 text-left hover:bg-muted rounded flex items-center gap-1">
                              <div className={cn("w-2 h-2 rounded-full", v.color)} /> {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Bemorlar bo'limidan bemor tanlab tish xaritasini oching</p>
            </div>
          )}
        </div>
      )}

      {tab === "appointments" && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-bold text-foreground">Qabullar</h2>
          {appointments.length === 0 ? <p className="text-muted-foreground text-center py-8">Qabullar topilmadi</p> :
            appointments.map(a => (
              <div key={a.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{a.appointment_date} {a.appointment_time}</p>
                  <p className="text-xs text-muted-foreground">{a.doctor_name} {a.notes && `— ${a.notes}`}</p>
                </div>
                <Badge variant={a.status === "completed" ? "default" : "outline"}>{a.status}</Badge>
              </div>
            ))
          }
        </div>
      )}

      {tab === "treatments" && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-bold text-foreground">Davolash rejalari</h2>
          {treatments.length === 0 ? <p className="text-muted-foreground text-center py-8">Davolash topilmadi</p> :
            treatments.map(t => (
              <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{t.treatment_type} {t.tooth_number && `(Tish #${t.tooth_number})`}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={t.status === "completed" ? "default" : "outline"}>{t.status}</Badge>
                    {t.price > 0 && <p className="text-xs text-muted-foreground mt-1">{Number(t.price).toLocaleString()} so'm</p>}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === "services" && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-bold text-foreground">Xizmatlar</h2>
          {services.length === 0 ? <p className="text-muted-foreground text-center py-8">Xizmatlar topilmadi</p> :
            services.map(s => (
              <div key={s.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.category} • {s.duration_minutes} daqiqa</p>
                </div>
                <p className="font-bold text-foreground">{Number(s.price).toLocaleString()} so'm</p>
              </div>
            ))
          }
        </div>
      )}

      {tab === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">Klinika sozlamalari</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Nom:</strong> {clinic.name}</p>
            <p><strong>Telefon:</strong> {clinic.phone}</p>
            <p><strong>Manzil:</strong> {clinic.address}, {clinic.city}</p>
            {clinic.email && <p><strong>Email:</strong> {clinic.email}</p>}
            {clinic.inn && <p><strong>INN:</strong> {clinic.inn}</p>}
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default DentalDashboard;
