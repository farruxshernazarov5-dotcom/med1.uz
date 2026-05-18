import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Wrench, Calendar, Users, Box, UserCog, DollarSign, BarChart3, LayoutDashboard, Gift } from "lucide-react";
import ReferralPanel from "@/components/referral/ReferralPanel";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import MTOverview from "@/components/medtech/MTOverview";
import MTEquipment from "@/components/medtech/MTEquipment";
import MTClients from "@/components/medtech/MTClients";
import MTMaintenance from "@/components/medtech/MTMaintenance";
import MTRentals from "@/components/medtech/MTRentals";
import MTSales from "@/components/medtech/MTSales";
import MTInventory from "@/components/medtech/MTInventory";
import MTTechnicians from "@/components/medtech/MTTechnicians";
import MTFinance from "@/components/medtech/MTFinance";

const VendorDashboard = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("medtech_vendors" as any).select("*").eq("owner_id", user.id).maybeSingle();
      setVendor(data);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" /></div>;

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center p-8">
      <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-xl font-bold">Medtexnika kompaniyangiz topilmadi</h2>
      <p className="text-muted-foreground mb-4">Avval kompaniyangizni ro'yxatdan o'tkazing</p>
      <Button onClick={() => window.location.href = "/vendor-register"}>Ro'yxatdan o'tish</Button>
    </div></div>
  );

  const vendorId = user!.id;

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Bosh sahifa", icon: LayoutDashboard },
    { id: "equipment", label: "Uskunalar", icon: Package },
    { id: "maintenance", label: "Servis", icon: Wrench },
    { id: "rentals", label: "Ijara", icon: Calendar },
    { id: "sales", label: "Sotuvlar", icon: ShoppingCart },
    { id: "clients", label: "Mijozlar", icon: Users },
    { id: "inventory", label: "Ombor", icon: Box },
    { id: "technicians", label: "Texniklar", icon: UserCog },
    { id: "finance", label: "Moliya", icon: DollarSign },
    { id: "partner-referral", label: "🎁 Referral", icon: Gift },
  ];

  return (
    <DashboardShell title={vendor.company_name || "Medtexnika"} subtitle="Med texnika boshqaruv paneli" icon={Package} iconColor="text-secondary" sidebarItems={sidebarItems} activeTab={tab} onTabChange={setTab}>
      {tab === "overview" && <MTOverview vendorId={vendorId} />}
      {tab === "equipment" && <MTEquipment vendorId={vendorId} />}
      {tab === "maintenance" && <MTMaintenance vendorId={vendorId} />}
      {tab === "rentals" && <MTRentals vendorId={vendorId} />}
      {tab === "sales" && <MTSales vendorId={vendorId} />}
      {tab === "clients" && <MTClients vendorId={vendorId} />}
      {tab === "inventory" && <MTInventory vendorId={vendorId} />}
      {tab === "technicians" && <MTTechnicians vendorId={vendorId} />}
      {tab === "finance" && <MTFinance vendorId={vendorId} />}
      {tab === "partner-referral" && <ReferralPanel />}
    </DashboardShell>
  );
};

export default VendorDashboard;
