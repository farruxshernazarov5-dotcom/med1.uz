import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Baby, LayoutDashboard, Users, Activity, FlaskConical, ScanLine, Heart,
  UserCog, Pill, DollarSign, CreditCard, Loader2, ShieldCheck, Shield, Crown, Gift
} from "lucide-react";
import ReferralPanel from "@/components/referral/ReferralPanel";
import ReferralNotificationBell from "@/components/referral/ReferralNotificationBell";
import DashboardShell, { type SidebarItem } from "@/components/dashboard/DashboardShell";
import OrgAttendance from "@/components/attendance/OrgAttendance";
import InsuranceModule from "@/components/insurance/InsuranceModule";
import { MatOverview } from "@/components/maternity/MatOverview";
import { MatPatients } from "@/components/maternity/MatPatients";
import { MatPregnancyTracking } from "@/components/maternity/MatPregnancyTracking";
import { MatLab } from "@/components/maternity/MatLab";
import { MatUltrasound } from "@/components/maternity/MatUltrasound";
import { MatDeliveries } from "@/components/maternity/MatDeliveries";
import { MatNewborns } from "@/components/maternity/MatNewborns";
import { MatStaff } from "@/components/maternity/MatStaff";
import { MatPrescriptions } from "@/components/maternity/MatPrescriptions";
import { MatFinance } from "@/components/maternity/MatFinance";
import MaternitySubscription from "@/components/dashboard/MaternitySubscription";
import PremiumPerksPanel from "@/components/premium/PremiumPerksPanel";

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "overview", label: "Bosh sahifa", icon: LayoutDashboard, group: "Asosiy" },
  { id: "patients", label: "Homiladorlar", icon: Users, group: "Asosiy" },
  { id: "tracking", label: "Kuzatuv", icon: Activity, group: "Asosiy" },

  { id: "lab", label: "Laboratoriya", icon: FlaskConical, group: "Tibbiy" },
  { id: "ultrasound", label: "UZI", icon: ScanLine, group: "Tibbiy" },
  { id: "prescriptions", label: "Retseptlar", icon: Pill, group: "Tibbiy" },

  { id: "deliveries", label: "Tug'ruqlar", icon: Heart, group: "Tug'ruq" },
  { id: "newborns", label: "Chaqaloqlar", icon: Baby, group: "Tug'ruq" },

  { id: "staff", label: "Xodimlar", icon: UserCog, group: "Boshqaruv" },
  { id: "finance", label: "Moliya", icon: DollarSign, group: "Boshqaruv" },
  { id: "subscription", label: "Obuna", icon: CreditCard, group: "Boshqaruv" },
  { id: "attendance", label: "Keldi-Ketdi", icon: ShieldCheck, group: "Boshqaruv" },
  { id: "insurance", label: "Sug'urta", icon: Shield, group: "Boshqaruv" },
  { id: "premium", label: "💎 Premium", icon: Crown, group: "Boshqaruv" },
  { id: "partner-referral", label: "🎁 Referral", icon: Gift, group: "Boshqaruv" },
];

const MaternityDashboard = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("registered_maternity" as any)
        .select("*")
        .eq("owner_id", user.id)
        .limit(1) as any;
      setCenter(data?.[0] || null);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!center) {
    return (
      <Card><CardContent className="p-8 text-center">
        <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Tug'ruqxona topilmadi</h2>
        <p className="text-muted-foreground mb-4">Avval tug'ruqxonangizni ro'yxatdan o'tkazing</p>
        <Button onClick={() => (window.location.href = "/maternity-register")}>Ro'yxatdan o'tish</Button>
      </CardContent></Card>
    );
  }

  return (
    <DashboardShell
      title={center.name}
      subtitle="Maternity HMS"
      icon={Baby}
      iconColor="text-pink-500"
      logoUrl={center.logo_url}
      sidebarItems={SIDEBAR_ITEMS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && <MatOverview centerId={center.id} />}
      {tab === "patients" && <MatPatients centerId={center.id} />}
      {tab === "tracking" && <MatPregnancyTracking centerId={center.id} />}
      {tab === "lab" && <MatLab centerId={center.id} />}
      {tab === "ultrasound" && <MatUltrasound centerId={center.id} />}
      {tab === "deliveries" && <MatDeliveries centerId={center.id} />}
      {tab === "newborns" && <MatNewborns centerId={center.id} />}
      {tab === "prescriptions" && <MatPrescriptions centerId={center.id} />}
      {tab === "staff" && <MatStaff centerId={center.id} />}
      {tab === "finance" && <MatFinance centerId={center.id} />}
      {tab === "subscription" && <MaternitySubscription />}
      {tab === "attendance" && <OrgAttendance orgType="maternity" orgName={center.name} />}
      {tab === "insurance" && <InsuranceModule ownerId={user!.id} module="maternity" />}
          {tab === "premium" && <PremiumPerksPanel moduleId="maternity" />}
      {tab === "partner-referral" && <ReferralPanel />}
    </DashboardShell>
  );
};

export default MaternityDashboard;
