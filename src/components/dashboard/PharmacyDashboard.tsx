import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Pill, Plus, Package, ShoppingCart, BarChart3, Settings, Image,
  CheckCircle, XCircle, Trash2, Save, X, Loader2,
  Truck, Clock, Star, Users, Camera, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const PharmacyDashboard = () => {
  const { user, profile } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "", address: "", description: "", website: "", telegram: "" });
  const [newProduct, setNewProduct] = useState({ name: "", manufacturer: "", drug_type: "tabletka", category: "", price: "", description: "", dosage: "", requires_prescription: false });

  const fetchData = async () => {
    if (!user) return;
    const { data: phData } = await supabase.from("registered_pharmacies").select("*").eq("owner_id", user.id).maybeSingle();
    if (phData) {
      setPharmacy(phData);
      setProfileForm({ name: phData.name, phone: phData.phone || "", email: phData.email || "", address: phData.address || "", description: phData.description || "", website: phData.website || "", telegram: phData.telegram || "" });
      const [prodRes, ordRes, photoRes] = await Promise.all([
        supabase.from("pharmacy_products").select("*").eq("pharmacy_id", phData.id).order("created_at", { ascending: false }),
        supabase.from("pharmacy_orders").select("*").eq("pharmacy_id", phData.id).order("created_at", { ascending: false }),
        supabase.from("pharmacy_photos" as any).select("*").eq("pharmacy_id", phData.id).order("sort_order") as any,
      ]);
      setProducts(prodRes.data || []); setOrders(ordRes.data || []); setPhotos(photoRes.data || []);
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
    else { toast({ title: "✅ Mahsulot qo'shildi!" }); setShowAddProduct(false); setNewProduct({ name: "", manufacturer: "", drug_type: "tabletka", category: "", price: "", description: "", dosage: "", requires_prescription: false }); fetchData(); }
  };

  const toggleProductActive = async (id: string, active: boolean) => {
    await supabase.from("pharmacy_products").update({ is_active: !active } as any).eq("id", id); fetchData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("pharmacy_orders").update({ status } as any).eq("id", id);
    toast({ title: `Buyurtma ${status === "confirmed" ? "tasdiqlandi" : status === "delivered" ? "yetkazildi" : "bekor qilindi"}` }); fetchData();
  };

  const saveProfile = async () => {
    if (!pharmacy) return; setSaving(true);
    const { error } = await supabase.from("registered_pharmacies").update({ name: profileForm.name, phone: profileForm.phone, email: profileForm.email, address: profileForm.address, description: profileForm.description, website: profileForm.website, telegram: profileForm.telegram } as any).eq("id", pharmacy.id);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Profil yangilandi" }); setProfileEdit(false); fetchData();
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !pharmacy || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "5MB dan oshmasligi kerak", variant: "destructive" }); return; }
    const ext = file.name.split(".").pop(); const path = `pharmacy-photos/${pharmacy.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pharmacy-files").upload(path, file);
    if (error) { toast({ title: "Yuklash xatosi", variant: "destructive" }); return; }
    const { data } = supabase.storage.from("pharmacy-files").getPublicUrl(path);
    await supabase.from("pharmacy_photos" as any).insert({ pharmacy_id: pharmacy.id, url: data.publicUrl, sort_order: photos.length } as any);
    toast({ title: "✅ Rasm yuklandi" }); fetchData();
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("pharmacy_photos" as any).delete().eq("id", id); toast({ title: "Rasm o'chirildi" }); fetchData();
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

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const activeProducts = products.filter(p => p.is_active).length;
  const orderStatusData = [
    { name: "Kutilmoqda", value: orders.filter(o => o.status === "pending").length },
    { name: "Tasdiqlangan", value: orders.filter(o => o.status === "confirmed").length },
    { name: "Yetkazilgan", value: orders.filter(o => o.status === "delivered").length },
    { name: "Bekor", value: orders.filter(o => o.status === "cancelled").length },
  ].filter(d => d.value > 0);
  const drugTypeData = ["tabletka", "sirop", "kapsula", "in'ektsiya", "malham", "tomchi", "kukun", "boshqa"].map(t => ({ name: t, count: products.filter(p => p.drug_type === t).length })).filter(d => d.count > 0);

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Umumiy", icon: BarChart3 },
    { id: "products", label: "Mahsulotlar", icon: Package },
    { id: "orders", label: "Buyurtmalar", icon: ShoppingCart, badge: pendingOrders },
    { id: "photos", label: "Rasmlar", icon: Image },
    { id: "settings", label: "Sozlamalar", icon: Settings },
  ];

  return (
    <DashboardShell
      title={pharmacy.name}
      subtitle="Dorixona boshqaruv paneli"
      icon={Pill}
      iconColor="text-emerald-500"
      logoUrl={pharmacy.logo_url}
      sidebarItems={sidebarItems}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Mahsulotlar", val: activeProducts, icon: Package, color: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
              { label: "Buyurtmalar", val: orders.length, icon: ShoppingCart, color: "from-accent/20 to-accent/5", iconColor: "text-accent" },
              { label: "Kutilmoqda", val: pendingOrders, icon: Clock, color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500" },
              { label: "Reyting", val: pharmacy.avg_rating || "—", icon: Star, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-2xl border border-border p-5 bg-gradient-to-br", s.color)}>
                <s.icon className={cn("w-8 h-8 mb-3", s.iconColor)} />
                <p className="text-2xl font-bold text-foreground">{s.val}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drugTypeData.length > 0 && (
              <Card><CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">Dori turlari</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={drugTypeData}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}
            {orderStatusData.length > 0 && (
              <Card><CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">Buyurtmalar holati</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>{orderStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}
          </div>
        </div>
      )}

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
                <div><Label>Turi</Label><select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newProduct.drug_type} onChange={e => setNewProduct(p => ({ ...p, drug_type: e.target.value }))}>{["tabletka", "sirop", "kapsula", "in'ektsiya", "malham", "tomchi", "kukun", "boshqa"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>Narxi (so'm)</Label><Input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} /></div>
                <div><Label>Dozasi</Label><Input value={newProduct.dosage} onChange={e => setNewProduct(p => ({ ...p, dosage: e.target.value }))} placeholder="500mg" /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 pb-2"><input type="checkbox" checked={newProduct.requires_prescription} onChange={e => setNewProduct(p => ({ ...p, requires_prescription: e.target.checked }))} className="rounded" /><span className="text-sm">Retsept talab qilinadi</span></label></div>
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
                <div key={p.id} className={cn("flex items-center justify-between p-4 rounded-xl border bg-card transition-all", p.is_active ? "border-border" : "border-border/50 opacity-60")}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><p className="font-medium text-sm">{p.name}</p>{p.requires_prescription && <Badge variant="outline" className="text-xs">Retsept</Badge>}<Badge variant={p.is_available ? "default" : "secondary"} className="text-xs">{p.is_available ? "Mavjud" : "Tugagan"}</Badge></div>
                    <p className="text-xs text-muted-foreground">{p.manufacturer} · {p.drug_type} {p.dosage && `· ${p.dosage}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{Number(p.price).toLocaleString()} so'm</span>
                    <Button size="sm" variant="ghost" onClick={() => toggleProductActive(p.id, p.is_active)}>{p.is_active ? <XCircle className="w-4 h-4 text-muted-foreground" /> : <CheckCircle className="w-4 h-4 text-secondary" />}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-lg">Buyurtmalar ({orders.length})</h3>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali buyurtmalar yo'q</p></div>
          ) : orders.map(o => (
            <Card key={o.id}><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div><p className="font-medium text-sm">{o.customer_name}</p><p className="text-xs text-muted-foreground">{o.customer_phone} · {new Date(o.created_at).toLocaleDateString("uz-UZ")}</p></div>
                <Badge variant={o.status === "pending" ? "secondary" : o.status === "delivered" ? "default" : "outline"}>{o.status}</Badge>
              </div>
              {o.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="text-secondary" onClick={() => updateOrderStatus(o.id, "confirmed")}><CheckCircle className="w-3.5 h-3.5 mr-1" /> Tasdiqlash</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateOrderStatus(o.id, "cancelled")}><XCircle className="w-3.5 h-3.5 mr-1" /> Bekor</Button>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}

      {tab === "photos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold text-lg">Rasmlar ({photos.length})</h3>
            <label className="cursor-pointer"><Input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} /><Button size="sm" asChild><span><Upload className="w-4 h-4 mr-1" /> Yuklash</span></Button></label>
          </div>
          {photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Camera className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali rasmlar yuklanmagan</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p: any) => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={p.url} alt="" className="w-full h-40 object-cover" />
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7" onClick={() => deletePhoto(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
    </DashboardShell>
  );
};

export default PharmacyDashboard;
