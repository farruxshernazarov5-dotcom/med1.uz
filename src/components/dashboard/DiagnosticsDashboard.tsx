import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import DiagnosticsSubscription from "./DiagnosticsSubscription";
import OrgAttendance from "@/components/attendance/OrgAttendance";

import DiagOverview from "@/components/diagnostics/DiagOverview";
import DiagPatients from "@/components/diagnostics/DiagPatients";
import DiagLabOrders from "@/components/diagnostics/DiagLabOrders";
import DiagResults from "@/components/diagnostics/DiagResults";
import DiagTemplates from "@/components/diagnostics/DiagTemplates";
import DiagInventory from "@/components/diagnostics/DiagInventory";
import DiagFinance from "@/components/diagnostics/DiagFinance";
import DiagStaff from "@/components/diagnostics/DiagStaff";
import DiagServices from "@/components/diagnostics/DiagServices";
import DiagRadiology from "@/components/diagnostics/DiagRadiology";
import DiagSOP from "@/components/diagnostics/DiagSOP";
import DiagQC from "@/components/diagnostics/DiagQC";
import DiagSettings from "@/components/diagnostics/DiagSettings";
import DiagAppointments from "@/components/diagnostics/DiagAppointments";
import DiagReferrals from "@/components/diagnostics/DiagReferrals";

import {
  LayoutDashboard, Users, FlaskConical, FileText, BookTemplate,
  Package, DollarSign, UserCheck, Crown, Settings as SettingsIcon, Image as ImageIcon,
  BookOpen, ShieldCheck, Calendar, Send, Shield,
} from "lucide-react";
import InsuranceModule from "@/components/insurance/InsuranceModule";

const DiagnosticsDashboard = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  // Data states
  const [services, setServices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const { data: centers } = await supabase
      .from("registered_diagnostics" as any).select("*").eq("owner_id", user!.id).limit(1) as any;

    if (centers?.length) {
      const c = centers[0];
      setCenter(c);

      const [svcR, patR, ordR, resR, tplR, invR, txnR, stfR, apptR, refR] = await Promise.all([
        supabase.from("diagnostics_services" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }) as any,
        supabase.from("diagnostics_patients" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }) as any,
        supabase.from("diagnostics_lab_orders" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }).limit(100) as any,
        supabase.from("diagnostics_lab_results" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }).limit(500) as any,
        supabase.from("diagnostics_test_templates" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }) as any,
        supabase.from("diagnostics_inventory" as any).select("*").eq("center_id", c.id).order("name") as any,
        supabase.from("diagnostics_transactions" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }).limit(100) as any,
        supabase.from("diagnostics_staff" as any).select("*").eq("center_id", c.id).order("full_name") as any,
        supabase.from("diagnostics_appointments" as any).select("*").eq("center_id", c.id).order("appointment_date", { ascending: false }).limit(200) as any,
        supabase.from("diagnostics_referrals" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }).limit(100) as any,
      ]);

      setServices(svcR.data || []);
      setPatients(patR.data || []);
      setOrders(ordR.data || []);
      setResults(resR.data || []);
      setTemplates(tplR.data || []);
      setInventory(invR.data || []);
      setTransactions(txnR.data || []);
      setStaff(stfR.data || []);
      setAppointments(apptR.data || []);
      setReferrals(refR.data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!center) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Microscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Diagnostika markazi topilmadi</h2>
          <p className="text-muted-foreground mb-4">Avval diagnostika markazingizni ro'yxatdan o'tkazing</p>
          <Button onClick={() => window.location.href = "/diagnostics-register"}>Ro'yxatdan o'tish</Button>
        </CardContent>
      </Card>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o: any) => o.created_at?.startsWith(today)).length;
  const pendingOrders = orders.filter((o: any) => o.status === "pending" || o.status === "in_progress").length;
  const completedOrders = orders.filter((o: any) => o.status === "completed").length;
  const todayRevenue = transactions.filter((t: any) => t.created_at?.startsWith(today) && t.status === "paid").reduce((s: number, t: any) => s + (t.amount || 0), 0);

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Bosh panel", icon: LayoutDashboard },
    { id: "appointments", label: "Qabullar", icon: Calendar, group: "Boshqaruv" },
    { id: "patients", label: "Bemorlar", icon: Users, badge: patients.length, group: "Boshqaruv" },
    { id: "referrals", label: "Yo'naltirishlar", icon: Send, group: "Boshqaruv" },
    { id: "lab-orders", label: "Buyurtmalar", icon: FlaskConical, badge: pendingOrders, group: "Laboratoriya" },
    { id: "results", label: "Natijalar", icon: FileText, group: "Laboratoriya" },
    { id: "radiology", label: "Radiologiya", icon: ImageIcon, group: "Laboratoriya" },
    { id: "templates", label: "Shablonlar", icon: BookTemplate, group: "Laboratoriya" },
    { id: "services", label: "Xizmatlar", icon: FlaskConical, group: "Boshqaruv" },
    { id: "inventory", label: "Reagentlar", icon: Package, group: "Ombor" },
    { id: "sop", label: "SOP", icon: BookOpen, group: "Sifat" },
    { id: "qc", label: "QC nazorat", icon: ShieldCheck, group: "Sifat" },
    { id: "finance", label: "Moliya", icon: DollarSign, group: "Moliya" },
    { id: "staff", label: "Xodimlar", icon: UserCheck, group: "Boshqaruv" },
    { id: "settings", label: "Sozlamalar", icon: SettingsIcon, group: "Tizim" },
    { id: "attendance", label: "Keldi-Ketdi", icon: ShieldCheck, group: "Boshqaruv" },
    { id: "insurance", label: "Sug'urta", icon: Shield, group: "Boshqaruv" },
    { id: "subscription", label: "Obuna", icon: Crown },
  ];

  return (
    <DashboardShell
      title={center.name}
      subtitle="Diagnostika markazi — LIS"
      icon={Microscope}
      iconColor="text-primary"
      sidebarItems={sidebarItems}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <DiagOverview stats={{ todayOrders, pendingOrders, completedOrders, todayRevenue, totalPatients: patients.length, totalServices: services.length }} />
      )}

      {tab === "patients" && (
        <DiagPatients centerId={center.id} patients={patients} onReload={loadAll} />
      )}

      {tab === "lab-orders" && (
        <DiagLabOrders centerId={center.id} orders={orders} patients={patients} services={services} staff={staff} onReload={loadAll} />
      )}

      {tab === "radiology" && (
        <DiagRadiology centerId={center.id} orders={orders} patients={patients} staff={staff} onReload={loadAll} />
      )}

      {tab === "results" && (
        <DiagResults centerId={center.id} results={results} orders={orders} templates={templates} patients={patients} services={services} onReload={loadAll} />
      )}

      {tab === "templates" && (
        <DiagTemplates centerId={center.id} templates={templates} onReload={loadAll} />
      )}

      {tab === "services" && (
        <DiagServices centerId={center.id} services={services} templates={templates} orders={orders} onReload={loadAll} />
      )}

      {tab === "inventory" && (
        <DiagInventory centerId={center.id} items={inventory} onReload={loadAll} />
      )}

      {tab === "finance" && (
        <DiagFinance centerId={center.id} transactions={transactions} patients={patients} orders={orders} onReload={loadAll} />
      )}

      {tab === "staff" && (
        <DiagStaff centerId={center.id} staff={staff} onReload={loadAll} />
      )}

      {tab === "sop" && <DiagSOP centerId={center.id} />}

      {tab === "qc" && <DiagQC centerId={center.id} />}

      {tab === "appointments" && (
        <DiagAppointments centerId={center.id} appointments={appointments} patients={patients} services={services} staff={staff} onReload={loadAll} />
      )}

      {tab === "referrals" && (
        <DiagReferrals centerId={center.id} referrals={referrals} services={services} onReload={loadAll} />
      )}

      {tab === "settings" && <DiagSettings centerId={center.id} center={center} />}

      {tab === "subscription" && <DiagnosticsSubscription />}
      {tab === "attendance" && <OrgAttendance orgType="diagnostics" orgName={center.name} />}
      {tab === "insurance" && <InsuranceModule ownerId={user!.id} module="diagnostics" />}
    </DashboardShell>
  );
};

export default DiagnosticsDashboard;
