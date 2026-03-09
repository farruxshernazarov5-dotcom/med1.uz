import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Users, Calendar, DollarSign, Plus, LogOut,
  Stethoscope, CheckCircle, XCircle, Settings, BarChart3,
  Crown, Monitor, FlaskConical, Wallet, Pill, BedDouble, Bell, FileText, Heart,
  Scissors, Receipt, Wrench, ListOrdered, Siren, ShieldCheck, PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import ClinicProfileEditor from "./ClinicProfileEditor";
import DoctorEditor from "./DoctorEditor";
import ClinicAnalytics from "./ClinicAnalytics";
import ClinicServicesManager from "./ClinicServicesManager";
import ClinicSubscription from "./ClinicSubscription";
import HMSPatients from "@/components/hms/HMSPatients";
import HMSLaboratory from "@/components/hms/HMSLaboratory";
import HMSPayroll from "@/components/hms/HMSPayroll";
import HMSPharmacy from "@/components/hms/HMSPharmacy";
import HMSBeds from "@/components/hms/HMSBeds";
import HMSDepartments from "@/components/hms/HMSDepartments";
import HMSCommunication from "@/components/hms/HMSCommunication";
import HMSFilesAndDonors from "@/components/hms/HMSFilesAndDonors";
import HMSSurgery from "@/components/hms/HMSSurgery";
import HMSInsurance from "@/components/hms/HMSInsurance";
import HMSEMR from "@/components/hms/HMSEMR";
import HMSEquipment from "@/components/hms/HMSEquipment";

type TabId = "overview" | "profile" | "services" | "doctors" | "appointments" | "analytics" | "subscription" | "hms-patients" | "hms-lab" | "hms-payroll" | "hms-pharmacy" | "hms-beds" | "hms-departments" | "hms-communication" | "hms-files" | "hms-surgery" | "hms-insurance" | "hms-emr" | "hms-equipment";

const ClinicDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [clinic, setClinic] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");

  const fetchData = async () => {
    if (!user) return;
    const { data: clinicData } = await supabase
      .from("registered_clinics").select("*").eq("owner_id", user.id).maybeSingle();

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
    { id: "overview" as const, label: "Umumiy", icon: Building2 },
    { id: "profile" as const, label: "Profil", icon: Settings },
    { id: "services" as const, label: "Xizmatlar", icon: DollarSign },
    { id: "doctors" as const, label: "Shifokorlar", icon: Stethoscope },
    { id: "appointments" as const, label: "Qabullar", icon: Calendar },
    { id: "analytics" as const, label: "Analitika", icon: BarChart3 },
    { id: "subscription" as const, label: "Obuna", icon: Crown },
    { id: "hms-patients" as const, label: "Bemorlar", icon: Users },
    { id: "hms-lab" as const, label: "Laboratoriya", icon: FlaskConical },
    { id: "hms-payroll" as const, label: "Xodimlar/Maosh", icon: Wallet },
    { id: "hms-pharmacy" as const, label: "Dorixona", icon: Pill },
    { id: "hms-beds" as const, label: "To'shaklar", icon: BedDouble },
    { id: "hms-departments" as const, label: "Bo'limlar", icon: Building2 },
    { id: "hms-communication" as const, label: "Aloqa", icon: Bell },
    { id: "hms-files" as const, label: "Fayllar/Donor", icon: FileText },
    { id: "hms-surgery" as const, label: "Operatsiya", icon: Scissors },
    { id: "hms-insurance" as const, label: "Moliya", icon: Receipt },
    { id: "hms-emr" as const, label: "EMR", icon: FileText },
    { id: "hms-equipment" as const, label: "Jihozlar", icon: Wrench },
  ];

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

      {tab === "profile" && <ClinicProfileEditor clinic={clinic} onSaved={fetchData} />}

      {tab === "services" && <ClinicServicesManager clinicId={clinic.id} services={services} onRefresh={fetchData} />}

      {tab === "doctors" && <DoctorEditor clinicId={clinic.id} doctors={doctors} onRefresh={fetchData} />}

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
                    <Badge className={cn("text-[10px]",
                      a.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      a.status === "confirmed" ? "bg-green-100 text-green-800" :
                      "bg-muted text-muted-foreground"
                    )}>{a.status}</Badge>
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

      {tab === "analytics" && <ClinicAnalytics clinicId={clinic.id} />}

      {tab === "subscription" && <ClinicSubscription />}

      {tab === "hms-patients" && <HMSPatients clinicId={clinic.id} />}
      {tab === "hms-lab" && <HMSLaboratory clinicId={clinic.id} />}
      {tab === "hms-payroll" && <HMSPayroll clinicId={clinic.id} />}
      {tab === "hms-pharmacy" && <HMSPharmacy clinicId={clinic.id} />}
      {tab === "hms-beds" && <HMSBeds clinicId={clinic.id} />}
      {tab === "hms-departments" && <HMSDepartments clinicId={clinic.id} />}
      {tab === "hms-communication" && <HMSCommunication clinicId={clinic.id} />}
      {tab === "hms-files" && <HMSFilesAndDonors clinicId={clinic.id} />}
      {tab === "hms-surgery" && <HMSSurgery clinicId={clinic.id} />}
      {tab === "hms-insurance" && <HMSInsurance clinicId={clinic.id} />}
      {tab === "hms-emr" && <HMSEMR clinicId={clinic.id} />}
      {tab === "hms-equipment" && <HMSEquipment clinicId={clinic.id} />}
    </div>
  );
};

export default ClinicDashboard;
