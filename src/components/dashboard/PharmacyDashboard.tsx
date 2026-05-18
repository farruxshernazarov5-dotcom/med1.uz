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
  Pill, Plus, Package, ShoppingCart, BarChart3, Settings, FileText,
  Save, Loader2, Users, Truck, Wallet, Tag, UserCog, Receipt, ShieldCheck, Crown, Gift
} from "lucide-react";
import ReferralPanel from "@/components/referral/ReferralPanel";
import ReferralNotificationBell from "@/components/referral/ReferralNotificationBell";
import OrgAttendance from "@/components/attendance/OrgAttendance";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import PhOverview from "@/components/pharmacy/PhOverview";
import PhInventory from "@/components/pharmacy/PhInventory";
import PhPOS from "@/components/pharmacy/PhPOS";
import PhSales from "@/components/pharmacy/PhSales";
import PhPrescriptions from "@/components/pharmacy/PhPrescriptions";
import PhCustomers from "@/components/pharmacy/PhCustomers";
import PhSuppliers from "@/components/pharmacy/PhSuppliers";
import PhStaff from "@/components/pharmacy/PhStaff";
import PhFinance from "@/components/pharmacy/PhFinance";
import PhPromo from "@/components/pharmacy/PhPromo";
import PremiumPerksPanel from "@/components/premium/PremiumPerksPanel";

const PharmacyDashboard = () => {
  const { user, profile } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "", address: "", description: "", website: "", telegram: "" });
  const [newProduct, setNewProduct] = useState({ name: "", manufacturer: "", drug_type: "tabletka", category: "", price: "", description: "", dosage: "", requires_prescription: false });

  const fetchData = async () => {
    if (!user) return;
    const { data: phData } = await supabase.from("registered_pharmacies").select("*").eq("owner_id", user.id).maybeSingle();
    if (phData) {
      setPharmacy(phData);
      setProfileForm({ name: phData.name, phone: phData.phone || "", email: phData.email || "", address: phData.address || "", description: phData.description || "", website: phData.website || "", telegram: phData.telegram || "" });
      const { data: prodData } = await supabase.from("pharmacy_products").select("*").eq("pharmacy_id", phData.id).order("created_at", { ascending: false });
      setProducts(prodData || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreatePharmacy = async () => {
    if (!user) return;
    const { error } = await supabase.from("registered_pharmacies").insert({ owner_id: user.id, name: profile?.full_name ? `${profile.full_name} dorixonasi` : "Yangi dorixona" } as any);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Dorixona yaratildi!" }); fetchData(); }
  };

  const addProduct = async () => {
    if (!pharmacy || !newProduct.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("pharmacy_products").insert({
      pharmacy_id: pharmacy.id, name: newProduct.name.trim(), manufacturer: newProduct.manufacturer,
      drug_type: newProduct.drug_type, category: newProduct.category, price: parseFloat(newProduct.price) || 0,
      description: newProduct.description, dosage: newProduct.dosage, requires_prescription: newProduct.requires_prescription,
    } as any);
    setSaving(false);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Mahsulot qo'shildi!" });
      setShowAddProduct(false);
      setNewProduct({ name: "", manufacturer: "", drug_type: "tabletka", category: "", price: "", description: "", dosage: "", requires_prescription: false });
      fetchData();
    }
  };

  const saveProfile = async () => {
    if (!pharmacy) return;
    setSaving(true);
    const { error } = await supabase.from("registered_pharmacies").update({
      name: profileForm.name, phone: profileForm.phone, email: profileForm.email, address: profileForm.address,
      description: profileForm.description, website: profileForm.website, telegram: profileForm.telegram,
    } as any).eq("id", pharmacy.id);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Profil yangilandi" });
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" /></div>;

  if (!pharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <Pill className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Dorixonangizni yarating</h2>
          <p className="text-muted-foreground mb-6">Platformada dorixonangizni ro'yxatdan o'tkazing</p>
          <Button onClick={handleCreatePharmacy}><Plus className="w-4 h-4 mr-2" /> Dorixona yaratish</Button>
        </div>
      </div>
    );
  }

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Umumiy", icon: BarChart3, group: "Asosiy" },
    { id: "pos", label: "POS / Sotuv", icon: ShoppingCart, group: "Asosiy" },
    { id: "products", label: "Dorilar", icon: Pill, group: "Katalog" },
    { id: "inventory", label: "Ombor", icon: Package, group: "Katalog" },
    { id: "prescriptions", label: "Retseptlar", icon: FileText, group: "Mijoz" },
    { id: "customers", label: "Mijozlar", icon: Users, group: "Mijoz" },
    { id: "promo", label: "Promo / Chegirma", icon: Tag, group: "Mijoz" },
    { id: "sales", label: "Sotuvlar tarixi", icon: Receipt, group: "Boshqaruv" },
    { id: "suppliers", label: "Yetkazib beruvchilar", icon: Truck, group: "Boshqaruv" },
    { id: "staff", label: "Xodimlar", icon: UserCog, group: "Boshqaruv" },
    { id: "finance", label: "Moliya", icon: Wallet, group: "Boshqaruv" },
    { id: "premium", label: "💎 Premium", icon: Crown, group: "Tizim" },
    { id: "settings", label: "Sozlamalar", icon: Settings, group: "Tizim" },
    { id: "attendance", label: "Keldi-Ketdi", icon: ShieldCheck, group: "Boshqaruv" },
    { id: "partner-referral", label: "🎁 Referral", icon: Gift, group: "Tizim" },
  ];

  return (
    <DashboardShell
      title={pharmacy.name}
      subtitle="Dorixona boshqaruv tizimi"
      icon={Pill}
      iconColor="text-emerald-500"
      logoUrl={pharmacy.logo_url}
      sidebarItems={sidebarItems}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && <PhOverview pharmacyId={pharmacy.id} />}
      {tab === "pos" && <PhPOS pharmacyId={pharmacy.id} />}
      {tab === "inventory" && <PhInventory pharmacyId={pharmacy.id} />}
      {tab === "prescriptions" && <PhPrescriptions pharmacyId={pharmacy.id} />}
      {tab === "customers" && <PhCustomers pharmacyId={pharmacy.id} />}
      {tab === "promo" && <PhPromo pharmacyId={pharmacy.id} />}
      {tab === "sales" && <PhSales pharmacyId={pharmacy.id} />}
      {tab === "suppliers" && <PhSuppliers pharmacyId={pharmacy.id} />}
      {tab === "staff" && <PhStaff pharmacyId={pharmacy.id} />}
      {tab === "finance" && <PhFinance pharmacyId={pharmacy.id} />}
      {tab === "partner-referral" && <ReferralPanel />}

      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold text-lg">Dori katalogi ({products.length})</h3>
            <Button size="sm" onClick={() => setShowAddProduct(!showAddProduct)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
          </div>
          {showAddProduct && (
            <Card className="border-secondary/20"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nomi *</Label><Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Ishlab chiqaruvchi</Label><Input value={newProduct.manufacturer} onChange={e => setNewProduct(p => ({ ...p, manufacturer: e.target.value }))} /></div>
                <div>
                  <Label>Turi</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newProduct.drug_type} onChange={e => setNewProduct(p => ({ ...p, drug_type: e.target.value }))}>
                    {["tabletka", "sirop", "kapsula", "in'ektsiya", "malham", "tomchi", "kukun", "boshqa"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><Label>Narxi (so'm)</Label><Input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} /></div>
                <div><Label>Dozasi</Label><Input value={newProduct.dosage} onChange={e => setNewProduct(p => ({ ...p, dosage: e.target.value }))} placeholder="500mg" /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 pb-2">
                    <input type="checkbox" checked={newProduct.requires_prescription} onChange={e => setNewProduct(p => ({ ...p, requires_prescription: e.target.checked }))} className="rounded" />
                    <span className="text-sm">Retsept talab qilinadi</span>
                  </label>
                </div>
              </div>
              <div><Label>Tavsif</Label><Textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <div className="flex gap-2">
                <Button onClick={addProduct} disabled={saving} size="sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddProduct(false)}>Bekor qilish</Button>
              </div>
            </CardContent></Card>
          )}
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali mahsulot qo'shilmagan</p></div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.manufacturer} · {p.drug_type} {p.dosage && `· ${p.dosage}`}</p>
                  </div>
                  <span className="font-semibold text-sm">{Number(p.price).toLocaleString()} so'm</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground text-lg">Profil sozlamalari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nomi</Label><Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Telefon</Label><Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            <div><Label>Website</Label><Input value={profileForm.website} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} className="mt-1" /></div>
          </div>
          <div><Label>Manzil</Label><Input value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} className="mt-1" /></div>
          <div><Label>Tavsif</Label><Textarea value={profileForm.description} onChange={e => setProfileForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" /></div>
          <Button onClick={saveProfile} disabled={saving} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      )}
      {tab === "attendance" && <OrgAttendance orgType="pharmacy" orgName={pharmacy.name} />}
          {tab === "premium" && <PremiumPerksPanel moduleId="pharmacy" />}
    </DashboardShell>
  );
};

export default PharmacyDashboard;
