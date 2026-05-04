import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Users, Calendar, DollarSign, Plus,
  Stethoscope, CheckCircle, XCircle, Settings, BarChart3,
  Crown, Monitor, FlaskConical, Wallet, Pill, BedDouble, Bell, FileText, Heart,
  Scissors, Receipt, Wrench, ListOrdered, Siren, ShieldCheck, PieChart,
  CalendarDays, ShieldAlert, User, Globe, TrendingUp, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import ClinicProfileEditor from "./ClinicProfileEditor";
import DoctorEditor from "./DoctorEditor";
import ClinicAnalytics from "./ClinicAnalytics";
import ClinicServicesManager from "./ClinicServicesManager";
import ClinicSubscription from "./ClinicSubscription";
import HMSPatients from "@/components/hms/HMSPatients";
import HMSLaboratory from "@/components/hms/HMSLaboratory";
import HMSPayroll from "@/components/hms/HMSPayroll";
import HMSStaffManagement from "@/components/hms/HMSStaffManagement";
import HMSPharmacy from "@/components/hms/HMSPharmacy";
import HMSBeds from "@/components/hms/HMSBeds";
import HMSDepartments from "@/components/hms/HMSDepartments";
import HMSCommunication from "@/components/hms/HMSCommunication";
import HMSFilesAndDonors from "@/components/hms/HMSFilesAndDonors";
import HMSSurgery from "@/components/hms/HMSSurgery";
import HMSInsurance from "@/components/hms/HMSInsurance";
import HMSEMR from "@/components/hms/HMSEMR";
import HMSEquipment from "@/components/hms/HMSEquipment";
import HMSQueue from "@/components/hms/HMSQueue";
import HMSEmergency from "@/components/hms/HMSEmergency";
import HMSQA from "@/components/hms/HMSQA";
import HMSReports from "@/components/hms/HMSReports";
import HMSAppointmentPortal from "@/components/hms/HMSAppointmentPortal";
import HMSPatientPortal from "@/components/hms/HMSPatientPortal";
import HMSInfection from "@/components/hms/HMSInfection";
import HMSSchedule from "@/components/hms/HMSSchedule";
import HMSTeleconsultation from "@/components/hms/HMSTeleconsultation";
import HMSPrescription from "@/components/hms/HMSPrescription";
import HMSFinance from "@/components/hms/HMSFinance";
import HMSInventory from "@/components/hms/HMSInventory";
import HMSOverview from "@/components/hms/HMSOverview";
import HMSAuditLog from "@/components/hms/HMSAuditLog";
import HMSPaymentSettings from "@/components/hms/HMSPaymentSettings";
import OrgAttendance from "@/components/attendance/OrgAttendance";

const ClinicDashboard = () => {
  const { user, profile } = useAuth();
  const [clinic, setClinic] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" />
    </div>
  );

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Klinikangizni yarating</h2>
          <p className="text-muted-foreground mb-6">Platformada klinikangizni ro'yxatdan o'tkazing</p>
          <Button onClick={handleCreateClinic} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Klinika yaratish
          </Button>
        </div>
      </div>
    );
  }

  const pendingAppts = appointments.filter((a) => a.status === "pending");
  const totalRevenue = appointments.filter((a) => a.status === "completed").reduce((s, a) => s + Number(a.total_price || 0), 0);

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Umumiy", icon: Building2 },
    { id: "profile", label: "Profil", icon: Settings },
    { id: "services", label: "Xizmatlar", icon: DollarSign },
    { id: "doctors", label: "Shifokorlar", icon: Stethoscope },
    { id: "appointments", label: "Qabullar", icon: Calendar, badge: pendingAppts.length },
    { id: "analytics", label: "Analitika", icon: BarChart3 },
    { id: "subscription", label: "Obuna", icon: Crown },
    // HMS
    { id: "hms-patients", label: "Bemorlar", icon: Users, group: "HMS" },
    { id: "hms-lab", label: "Laboratoriya", icon: FlaskConical, group: "HMS" },
    { id: "hms-staff", label: "Xodimlar", icon: Users, group: "HMS" },
    { id: "hms-payroll", label: "Ish haqi", icon: Wallet, group: "HMS" },
    { id: "hms-pharmacy", label: "Dorixona", icon: Pill, group: "HMS" },
    { id: "hms-beds", label: "To'shaklar", icon: BedDouble, group: "HMS" },
    { id: "hms-departments", label: "Bo'limlar", icon: Building2, group: "HMS" },
    { id: "hms-communication", label: "Aloqa", icon: Bell, group: "HMS" },
    { id: "hms-files", label: "Fayllar", icon: FileText, group: "HMS" },
    { id: "hms-surgery", label: "Operatsiya", icon: Scissors, group: "HMS" },
    { id: "hms-insurance", label: "Sug'urta", icon: Receipt, group: "HMS" },
    { id: "hms-emr", label: "EMR", icon: FileText, group: "HMS" },
    { id: "hms-equipment", label: "Jihozlar", icon: Wrench, group: "HMS" },
    { id: "hms-queue", label: "Navbat", icon: ListOrdered, group: "HMS" },
    { id: "hms-emergency", label: "Tez yordam", icon: Siren, group: "HMS" },
    { id: "hms-qa", label: "Sifat", icon: ShieldCheck, group: "HMS" },
    { id: "hms-reports", label: "Hisobotlar", icon: PieChart, group: "HMS" },
    { id: "hms-appointment-portal", label: "Onlayn qabul", icon: Globe, group: "HMS" },
    { id: "hms-patient-portal", label: "Bemor portal", icon: User, group: "HMS" },
    { id: "hms-infection", label: "Infektsiya", icon: ShieldAlert, group: "HMS" },
    { id: "hms-schedule", label: "Jadval", icon: CalendarDays, group: "HMS" },
    { id: "hms-teleconsultation", label: "Telemeditsina", icon: Monitor, group: "HMS" },
    { id: "hms-prescription", label: "Retseptlar", icon: Pill, group: "HMS" },
    { id: "hms-finance", label: "Moliya", icon: Receipt, group: "HMS" },
    { id: "hms-inventory", label: "Ombor", icon: FlaskConical, group: "HMS" },
    { id: "hms-audit", label: "Audit Log", icon: ShieldCheck, group: "HMS" },
    { id: "hms-payment-settings", label: "To'lov (SaaS)", icon: CreditCard, group: "HMS" },
    { id: "hms-attendance", label: "Keldi-Ketdi", icon: ShieldCheck, group: "HMS" },
  ];

  return (
    <DashboardShell
      title={clinic.name}
      subtitle="Klinika boshqaruv paneli"
      icon={Building2}
      iconColor="text-secondary"
      sidebarItems={sidebarItems}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <HMSOverview clinicId={clinic.id} onNavigate={setTab} />
      )}

      {tab === "profile" && <ClinicProfileEditor clinic={clinic} onSaved={fetchData} />}
      {tab === "services" && <ClinicServicesManager clinicId={clinic.id} services={services} onRefresh={fetchData} />}
      {tab === "doctors" && <DoctorEditor clinicId={clinic.id} doctors={doctors} onRefresh={fetchData} />}

      {tab === "appointments" && (
        <div>
          <h2 className="font-heading font-bold text-foreground mb-4 text-lg">Qabullar</h2>
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
                    {a.total_price > 0 && <span className="text-sm font-bold text-secondary">{Number(a.total_price).toLocaleString()}</span>}
                    <Badge className={cn("text-[10px]",
                      a.status === "pending" ? "bg-amber-100 text-amber-800" :
                      a.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                      "bg-muted text-muted-foreground"
                    )}>{a.status}</Badge>
                    {a.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => updateAppointmentStatus(a.id, "confirmed")}><CheckCircle className="w-4 h-4 text-emerald-600" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateAppointmentStatus(a.id, "cancelled")}><XCircle className="w-4 h-4 text-destructive" /></Button>
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
      {tab === "hms-staff" && <HMSStaffManagement clinicId={clinic.id} />}
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
      {tab === "hms-queue" && <HMSQueue clinicId={clinic.id} />}
      {tab === "hms-emergency" && <HMSEmergency clinicId={clinic.id} />}
      {tab === "hms-qa" && <HMSQA clinicId={clinic.id} />}
      {tab === "hms-reports" && <HMSReports clinicId={clinic.id} />}
      {tab === "hms-appointment-portal" && <HMSAppointmentPortal clinicId={clinic.id} />}
      {tab === "hms-patient-portal" && <HMSPatientPortal clinicId={clinic.id} />}
      {tab === "hms-infection" && <HMSInfection clinicId={clinic.id} />}
      {tab === "hms-schedule" && <HMSSchedule clinicId={clinic.id} />}
      {tab === "hms-teleconsultation" && <HMSTeleconsultation clinicId={clinic.id} />}
      {tab === "hms-prescription" && <HMSPrescription clinicId={clinic.id} />}
      {tab === "hms-finance" && <HMSFinance clinicId={clinic.id} />}
      {tab === "hms-inventory" && <HMSInventory clinicId={clinic.id} />}
      {tab === "hms-audit" && <HMSAuditLog clinicId={clinic.id} />}
      {tab === "hms-payment-settings" && <HMSPaymentSettings clinicId={clinic.id} />}
      {tab === "hms-attendance" && <OrgAttendance ownerId={clinic.owner_id} orgType="clinic" orgName={clinic.name} />}
    </DashboardShell>
  );
};

export default ClinicDashboard;
