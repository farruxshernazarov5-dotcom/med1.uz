import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Stethoscope, Users, Calendar, DollarSign, Settings, BarChart3,
  Activity, Heart, Camera, FlaskConical, Package, Bell, FileText,
  ClipboardList, UserCheck, Wrench, MessageSquare, Brain
} from "lucide-react";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import { writeAuditLog } from "@/utils/auditLog";

import DentalOverview from "@/components/dental/DentalOverview";
import DentalPatients from "@/components/dental/DentalPatients";
import DentalToothChart from "@/components/dental/DentalToothChart";
import DentalImaging from "@/components/dental/DentalImaging";
import DentalLab from "@/components/dental/DentalLab";
import DentalInventory from "@/components/dental/DentalInventory";
import DentalReports from "@/components/dental/DentalReports";
import DentalRecall from "@/components/dental/DentalRecall";
import DentalTreatmentPlans from "@/components/dental/DentalTreatmentPlans";
import DentalBillingPro from "@/components/dental/DentalBillingPro";
import DentalStaff from "@/components/dental/DentalStaff";
import DentalEquipment from "@/components/dental/DentalEquipment";
import DentalFeedback from "@/components/dental/DentalFeedback";
import DentalDocuments from "@/components/dental/DentalDocuments";
import DentalAI from "@/components/dental/DentalAI";

const DentalDashboard = () => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
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

  const handleAddPatient = async (form: { full_name: string; phone: string; date_of_birth: string; gender: string }) => {
    if (!clinic || !form.full_name || !form.phone) return;
    const { error } = await supabase.from("dental_patients").insert({
      clinic_id: clinic.id, full_name: form.full_name, phone: form.phone,
      date_of_birth: form.date_of_birth || null, gender: form.gender,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ action: "create", entity_type: "dental_patient", module: "dental", details: { name: form.full_name } });
    toast({ title: "Bemor qo'shildi" });
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

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Umumiy", icon: BarChart3 },
    { id: "patients", label: "Bemorlar", icon: Users },
    { id: "tooth-chart", label: "Tish xaritasi", icon: Heart },
    { id: "treatment-plans", label: "Davolash kursi", icon: ClipboardList },
    { id: "appointments", label: "Qabullar", icon: Calendar },
    { id: "billing", label: "Moliya", icon: DollarSign },
    { id: "staff", label: "Shifokorlar", icon: UserCheck },
    { id: "imaging", label: "Tasvirlar", icon: Camera },
    { id: "lab", label: "Lab", icon: FlaskConical },
    { id: "equipment", label: "Jihozlar", icon: Wrench },
    { id: "inventory", label: "Materiallar", icon: Package },
    { id: "feedback", label: "Qayta aloqa", icon: MessageSquare },
    { id: "documents", label: "Hujjatlar", icon: FileText },
    { id: "recall", label: "Eslatmalar", icon: Bell },
    { id: "ai", label: "AI xizmatlari", icon: Brain },
    { id: "services", label: "Xizmatlar", icon: Stethoscope },
    { id: "reports", label: "Hisobotlar", icon: BarChart3 },
    { id: "settings", label: "Sozlamalar", icon: Settings },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!clinic) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">🦷 Stomatologiya klinikangiz topilmadi</h2>
        <p className="text-muted-foreground mb-4">Avval klinikangizni ro'yxatdan o'tkazing</p>
        <Button onClick={() => window.location.href = "/dental-register"}>Ro'yxatdan o'tish</Button>
      </div>
    </div>
  );

  return (
    <DashboardShell
      title={`🦷 ${clinic.name}`}
      subtitle="Stomatologiya boshqaruv paneli"
      icon={Stethoscope}
      sidebarItems={sidebarItems}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && <DentalOverview patients={patients} todayAppts={todayAppts} treatments={treatments} services={services} />}
      {tab === "patients" && <DentalPatients patients={patients} onAddPatient={handleAddPatient} onOpenToothChart={openToothChart} />}
      {tab === "tooth-chart" && (
        <DentalToothChart selectedPatient={selectedPatient} toothChart={toothChart} onSetToothStatus={setToothStatus} onBack={() => { setSelectedPatient(null); setTab("patients"); }} />
      )}
      {tab === "treatment-plans" && <DentalTreatmentPlans patients={patients} treatments={treatments} />}
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
      {tab === "billing" && <DentalBillingPro treatments={treatments} appointments={appointments} />}
      {tab === "staff" && <DentalStaff />}
      {tab === "imaging" && <DentalImaging patients={patients} />}
      {tab === "lab" && <DentalLab patients={patients} />}
      {tab === "equipment" && <DentalEquipment />}
      {tab === "inventory" && <DentalInventory />}
      {tab === "feedback" && <DentalFeedback patients={patients} />}
      {tab === "documents" && <DentalDocuments patients={patients} />}
      {tab === "recall" && <DentalRecall patients={patients} />}
      {tab === "ai" && <DentalAI />}
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
      {tab === "reports" && <DentalReports patients={patients} appointments={appointments} treatments={treatments} services={services} />}
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
