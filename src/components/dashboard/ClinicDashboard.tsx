import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Users, Calendar, DollarSign, Plus, LogOut,
  Stethoscope, CheckCircle, XCircle, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ClinicProfileEditor from "./ClinicProfileEditor";

const ClinicDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [clinic, setClinic] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "profile" | "services" | "doctors" | "appointments">("overview");

  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration_minutes: "30" });
  const [newDoctor, setNewDoctor] = useState({ full_name: "", specialty: "", experience_years: "", consultation_price: "", bio: "" });
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const { data: clinicData } = await supabase
      .from("registered_clinics")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (clinicData) {
      setClinic(clinicData);
      const [srvRes, docRes, apptRes] = await Promise.all([
        supabase.from("clinic_services").select("*").eq("clinic_id", clinicData.id).order("created_at"),
        supabase.from("doctors").select("*").eq("clinic_id", clinicData.id).order("created_at"),
        supabase.from("appointments").select("*").eq("clinic_id", clinicData.id).order("appointment_date", { ascending: false }),
      ]);
      setServices(srvRes.data || []);
      setDoctors(docRes.data || []);
      setAppointments(apptRes.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateClinic = async () => {
    if (!user) return;
    const { error } = await supabase.from("registered_clinics").insert({
      owner_id: user.id,
      name: profile?.full_name ? `${profile.full_name} klinikasi` : "Yangi klinika",
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Klinika yaratildi!" }); fetchData(); }
  };

  const addService = async () => {
    if (!clinic || !newService.name || !newService.price) return;
    const { error } = await supabase.from("clinic_services").insert({
      clinic_id: clinic.id, name: newService.name, description: newService.description,
      price: Number(newService.price), duration_minutes: Number(newService.duration_minutes) || 30,
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Xizmat qo'shildi!" });
      setNewService({ name: "", description: "", price: "", duration_minutes: "30" });
      setServiceDialogOpen(false); fetchData();
    }
  };

  const addDoctor = async () => {
    if (!clinic || !newDoctor.full_name || !newDoctor.specialty) return;
    const { error } = await supabase.from("doctors").insert({
      clinic_id: clinic.id, full_name: newDoctor.full_name, specialty: newDoctor.specialty,
      experience_years: Number(newDoctor.experience_years) || 0,
      consultation_price: Number(newDoctor.consultation_price) || 0, bio: newDoctor.bio,
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Shifokor qo'shildi!" });
      setNewDoctor({ full_name: "", specialty: "", experience_years: "", consultation_price: "", bio: "" });
      setDoctorDialogOpen(false); fetchData();
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast({ title: `Qabul ${status === "confirmed" ? "tasdiqlandi" : "bekor qilindi"}` });
    fetchData();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>;

  if (!clinic) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Klinikangizni yarating</h2>
        <p className="text-muted-foreground mb-6">Platformada klinikangizni ro'yxatdan o'tkazing</p>
        <Button onClick={handleCreateClinic} className="bg-hero-gradient text-primary-foreground border-0">
          <Plus className="w-4 h-4 mr-2" /> Klinika yaratish
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Umumiy", icon: Building2 },
    { id: "profile", label: "Profil", icon: Settings },
    { id: "services", label: "Xizmatlar", icon: DollarSign },
    { id: "doctors", label: "Shifokorlar", icon: Stethoscope },
    { id: "appointments", label: "Qabullar", icon: Calendar },
  ] as const;

  const pendingAppts = appointments.filter((a) => a.status === "pending");
  const totalRevenue = appointments.filter((a) => a.status === "completed").reduce((s, a) => s + Number(a.total_price || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{clinic.name}</h1>
          <p className="text-muted-foreground text-sm">Klinika boshqaruv paneli</p>
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

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Stethoscope, label: "Shifokorlar", value: doctors.length, color: "text-primary" },
            { icon: DollarSign, label: "Xizmatlar", value: services.length, color: "text-green-600" },
            { icon: Calendar, label: "Kutilmoqda", value: pendingAppts.length, color: "text-yellow-600" },
            { icon: Users, label: "Daromad", value: `${totalRevenue.toLocaleString()} so'm`, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <s.icon className={cn("w-6 h-6 mb-2", s.color)} />
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Profile Editor */}
      {tab === "profile" && (
        <ClinicProfileEditor clinic={clinic} onSaved={fetchData} />
      )}

      {/* Services */}
      {tab === "services" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold text-foreground">Xizmatlar ro'yxati</h2>
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-hero-gradient text-primary-foreground border-0">
                  <Plus className="w-4 h-4 mr-1" /> Xizmat qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yangi xizmat</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Nomi *</Label><Input value={newService.name} onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
                  <div><Label className="text-xs">Tavsif</Label><Input value={newService.description} onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))} className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Narxi (so'm) *</Label><Input type="number" value={newService.price} onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))} className="mt-1" /></div>
                    <div><Label className="text-xs">Davomiyligi (daqiqa)</Label><Input type="number" value={newService.duration_minutes} onChange={(e) => setNewService((p) => ({ ...p, duration_minutes: e.target.value }))} className="mt-1" /></div>
                  </div>
                  <Button onClick={addService} className="w-full bg-hero-gradient text-primary-foreground border-0">Saqlash</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {services.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Hozircha xizmatlar yo'q</p>
          ) : (
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.description} • {s.duration_minutes} daqiqa</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{Number(s.price).toLocaleString()} so'm</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Doctors */}
      {tab === "doctors" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold text-foreground">Shifokorlar</h2>
            <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-hero-gradient text-primary-foreground border-0">
                  <Plus className="w-4 h-4 mr-1" /> Shifokor qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yangi shifokor</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">To'liq ism *</Label><Input value={newDoctor.full_name} onChange={(e) => setNewDoctor((p) => ({ ...p, full_name: e.target.value }))} className="mt-1" /></div>
                  <div><Label className="text-xs">Mutaxassisligi *</Label><Input value={newDoctor.specialty} onChange={(e) => setNewDoctor((p) => ({ ...p, specialty: e.target.value }))} className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Tajriba (yil)</Label><Input type="number" value={newDoctor.experience_years} onChange={(e) => setNewDoctor((p) => ({ ...p, experience_years: e.target.value }))} className="mt-1" /></div>
                    <div><Label className="text-xs">Konsultatsiya narxi</Label><Input type="number" value={newDoctor.consultation_price} onChange={(e) => setNewDoctor((p) => ({ ...p, consultation_price: e.target.value }))} className="mt-1" /></div>
                  </div>
                  <Button onClick={addDoctor} className="w-full bg-hero-gradient text-primary-foreground border-0">Saqlash</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {doctors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Hozircha shifokorlar yo'q</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctors.map((d) => (
                <div key={d.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">{d.specialty} • {d.experience_years} yil tajriba</p>
                  {d.consultation_price > 0 && <p className="text-sm font-bold text-primary mt-1">{Number(d.consultation_price).toLocaleString()} so'm</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments */}
      {tab === "appointments" && (
        <div>
          <h2 className="font-heading font-bold text-foreground mb-4">Qabullar</h2>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Hozircha qabullar yo'q</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((a) => (
                <div key={a.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{a.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{a.patient_phone} • {a.appointment_date} {a.appointment_time?.slice(0, 5)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.total_price > 0 && <span className="text-sm font-bold text-primary">{Number(a.total_price).toLocaleString()}</span>}
                    <Badge className={cn("text-[10px]", a.status === "pending" ? "bg-yellow-100 text-yellow-800" : a.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>{a.status}</Badge>
                    {a.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => updateAppointmentStatus(a.id, "confirmed")}><CheckCircle className="w-4 h-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateAppointmentStatus(a.id, "cancelled")}><XCircle className="w-4 h-4 text-red-500" /></Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicDashboard;
