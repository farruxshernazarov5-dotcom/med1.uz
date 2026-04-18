import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, Plus, Save, Loader2, Settings,
  BarChart3, Users, Package, Image as ImageIcon, Wallet, Gift, Megaphone,
  Star, UserCog, Crown,
} from "lucide-react";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import CosmetologySubscription from "@/components/dashboard/CosmetologySubscription";
import CosOverview from "@/components/cosmetology/hms/CosOverview";
import CosClients from "@/components/cosmetology/hms/CosClients";
import CosCourses from "@/components/cosmetology/hms/CosCourses";
import CosBeforeAfter from "@/components/cosmetology/hms/CosBeforeAfter";
import CosFinance from "@/components/cosmetology/hms/CosFinance";
import CosPackages from "@/components/cosmetology/hms/CosPackages";
import CosMarketing from "@/components/cosmetology/hms/CosMarketing";
import CosFeedback from "@/components/cosmetology/hms/CosFeedback";
import CosInventory from "@/components/cosmetology/hms/CosInventory";
import CosStaff from "@/components/cosmetology/hms/CosStaff";

const CosmetologyDashboard = () => {
  const { user, profile } = useAuth();
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "", address: "", description: "", website: "", telegram: "" });
  const [saving, setSaving] = useState(false);

  const fetchCenter = async () => {
    if (!user) return;
    const { data } = await supabase.from("registered_cosmetology" as any).select("*").eq("owner_id", user.id).maybeSingle() as any;
    if (data) {
      setCenter(data);
      setProfileForm({ name: data.name, phone: data.phone || "", email: data.email || "", address: data.address || "", description: data.description || "", website: data.website || "", telegram: data.telegram || "" });
    }
    setLoading(false);
  };
  useEffect(() => { fetchCenter(); }, [user]);

  const createCenter = async () => {
    if (!user) return;
    const { error } = await supabase.from("registered_cosmetology" as any).insert({
      owner_id: user.id, name: profile?.full_name ? `${profile.full_name} kosmetologiyasi` : "Yangi markaz",
      address: "—", phone: "—", region: "Toshkent", city: "Toshkent",
    } as any);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Markaz yaratildi" }); fetchCenter(); }
  };

  const saveProfile = async () => {
    if (!center) return;
    setSaving(true);
    const { error } = await supabase.from("registered_cosmetology" as any).update(profileForm as any).eq("id", center.id);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Profil yangilandi" });
    fetchCenter();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (!center) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Kosmetologiya markazingizni yarating</h2>
          <p className="text-muted-foreground mb-6">Platformada markazni ro'yxatdan o'tkazing</p>
          <Button onClick={createCenter}><Plus className="w-4 h-4 mr-2" /> Markaz yaratish</Button>
        </div>
      </div>
    );
  }

  const sidebar: SidebarItem[] = [
    { id: "overview", label: "Bosh sahifa", icon: BarChart3 },
    { id: "clients", label: "Mijozlar", icon: Users },
    { id: "courses", label: "Davolash kurslari", icon: Package },
    { id: "before_after", label: "Oldin / Keyin", icon: ImageIcon },
    { id: "packages", label: "Paketlar", icon: Gift },
    { id: "finance", label: "Moliya", icon: Wallet },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "feedback", label: "Sharhlar", icon: Star },
    { id: "inventory", label: "Mahsulotlar", icon: Package },
    { id: "staff", label: "Xodimlar", icon: UserCog },
    { id: "subscription", label: "Obuna", icon: Crown },
    { id: "settings", label: "Sozlamalar", icon: Settings },
  ];

  return (
    <DashboardShell
      title={center.name}
      subtitle="Beauty CRM + Medical System"
      icon={Sparkles}
      sidebarItems={sidebar}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && <CosOverview centerId={center.id} />}
      {tab === "clients" && <CosClients centerId={center.id} />}
      {tab === "courses" && <CosCourses centerId={center.id} />}
      {tab === "before_after" && <CosBeforeAfter centerId={center.id} />}
      {tab === "packages" && <CosPackages centerId={center.id} />}
      {tab === "finance" && <CosFinance centerId={center.id} />}
      {tab === "marketing" && <CosMarketing centerId={center.id} />}
      {tab === "feedback" && <CosFeedback centerId={center.id} />}
      {tab === "inventory" && <CosInventory centerId={center.id} />}
      {tab === "staff" && <CosStaff centerId={center.id} />}
      {tab === "subscription" && <CosmetologySubscription />}
      {tab === "settings" && (
        <Card><CardContent className="p-5 space-y-4">
          <h3 className="font-heading font-semibold text-lg">Markaz profili</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nomi</Label><Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Telefon</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Manzil</Label><Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="mt-1" /></div>
            <div><Label>Web sayt</Label><Input value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} className="mt-1" /></div>
            <div><Label>Telegram</Label><Input value={profileForm.telegram} onChange={(e) => setProfileForm({ ...profileForm, telegram: e.target.value })} className="mt-1" /></div>
            <div className="md:col-span-2"><Label>Tavsif</Label><Textarea rows={3} value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} className="mt-1" /></div>
          </div>
          <Button onClick={saveProfile} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Saqlash</Button>
        </CardContent></Card>
      )}
    </DashboardShell>
  );
};

export default CosmetologyDashboard;
