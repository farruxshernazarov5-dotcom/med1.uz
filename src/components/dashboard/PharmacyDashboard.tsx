import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Pill, Plus, Package, ShoppingCart, BarChart3, Settings, Image,
  CheckCircle, XCircle, Trash2, Edit, Save, X, Loader2, LogOut,
  Truck, Clock, Star, Users, Camera, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type TabId = "overview" | "products" | "orders" | "photos" | "settings";
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const PharmacyDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "", address: "", description: "", website: "", telegram: "" });

  const [newProduct, setNewProduct] = useState({
    name: "", manufacturer: "", drug_type: "tabletka", category: "",
    price: "", description: "", dosage: "", requires_prescription: false,
  });

  const fetchData = async () => {
    if (!user) return;
    const { data: phData } = await supabase
      .from("registered_pharmacies").select("*").eq("owner_id", user.id).maybeSingle();
    if (phData) {
      setPharmacy(phData);
      setProfileForm({ name: phData.name, phone: phData.phone || "", email: phData.email || "", address: phData.address || "", description: phData.description || "", website: phData.website || "", telegram: phData.telegram || "" });
      const [prodRes, ordRes, photoRes] = await Promise.all([
        supabase.from("pharmacy_products").select("*").eq("pharmacy_id", phData.id).order("created_at", { ascending: false }),
        supabase.from("pharmacy_orders").select("*").eq("pharmacy_id", phData.id).order("created_at", { ascending: false }),
        supabase.from("pharmacy_photos" as any).select("*").eq("pharmacy_id", phData.id).order("sort_order") as any,
      ]);
      setProducts(prodRes.data || []);
      setOrders(ordRes.data || []);
      setPhotos(photoRes.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreatePharmacy = async () => {
    if (!user) return;
    const { error } = await supabase.from("registered_pharmacies").insert({
      owner_id: user.id,
      name: profile?.full_name ? `${profile.full_name} dorixonasi` : "Yangi dorixona",
    } as any);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Dorixona yaratildi!" }); fetchData(); }
  };

  const addProduct = async () => {
    if (!pharmacy || !newProduct.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("pharmacy_products").insert({
      pharmacy_id: pharmacy.id,
      name: newProduct.name.trim(), manufacturer: newProduct.manufacturer,
      drug_type: newProduct.drug_type, category: newProduct.category,
      price: parseFloat(newProduct.price) || 0, description: newProduct.description,
      dosage: newProduct.dosage, requires_prescription: newProduct.requires_prescription,
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

  const toggleProductActive = async (id: string, active: boolean) => {
    await supabase.from("pharmacy_products").update({ is_active: !active } as any).eq("id", id);
    fetchData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("pharmacy_orders").update({ status } as any).eq("id", id);
    toast({ title: `Buyurtma ${status === "confirmed" ? "tasdiqlandi" : status === "delivered" ? "yetkazildi" : "bekor qilindi"}` });
    fetchData();
  };

  const saveProfile = async () => {
    if (!pharmacy) return;
    setSaving(true);
    const { error } = await supabase.from("registered_pharmacies").update({
      name: profileForm.name, phone: profileForm.phone, email: profileForm.email,
      address: profileForm.address, description: profileForm.description,
      website: profileForm.website, telegram: profileForm.telegram,
    } as any).eq("id", pharmacy.id);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Profil yangilandi" }); setProfileEdit(false); fetchData();
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pharmacy || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "5MB dan oshmasligi kerak", variant: "destructive" }); return; }
    const ext = file.name.split(".").pop();
    const path = `pharmacy-photos/${pharmacy.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pharmacy-files").upload(path, file);
    if (error) { toast({ title: "Yuklash xatosi", variant: "destructive" }); return; }
    const { data } = supabase.storage.from("pharmacy-files").getPublicUrl(path);
    await supabase.from("pharmacy_photos" as any).insert({ pharmacy_id: pharmacy.id, url: data.publicUrl, sort_order: photos.length } as any);
    toast({ title: "✅ Rasm yuklandi" }); fetchData();
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("pharmacy_photos" as any).delete().eq("id", id);
    toast({ title: "Rasm o'chirildi" }); fetchData();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>;

  if (!pharmacy) {
    return (
      <div className="text-center py-16">
        <Pill className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Dorixonangizni yarating</h2>
        <p className="text-muted-foreground mb-6">Platformada dorixonangizni ro'yxatdan o'tkazing</p>
        <Button onClick={handleCreatePharmacy}><Plus className="w-4 h-4 mr-2" /> Dorixona yaratish</Button>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabId, label: "Umumiy", icon: BarChart3 },
    { id: "products" as TabId, label: "Mahsulotlar", icon: Package },
    { id: "orders" as TabId, label: "Buyurtmalar", icon: ShoppingCart },
    { id: "photos" as TabId, label: "Rasmlar", icon: Image },
    { id: "settings" as TabId, label: "Sozlamalar", icon: Settings },
  ];

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const activeProducts = products.filter(p => p.is_active).length;

  const orderStatusData = [
    { name: "Kutilmoqda", value: orders.filter(o => o.status === "pending").length },
    { name: "Tasdiqlangan", value: orders.filter(o => o.status === "confirmed").length },
    { name: "Yetkazilgan", value: orders.filter(o => o.status === "delivered").length },
    { name: "Bekor", value: orders.filter(o => o.status === "cancelled").length },
  ].filter(d => d.value > 0);

  const drugTypeData = ["tabletka", "sirop", "kapsula", "in'ektsiya", "malham", "tomchi", "kukun", "boshqa"].map(t => ({
    name: t, count: products.filter(p => p.drug_type === t).length,
  })).filter(d => d.count > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {pharmacy.logo_url && <img src={pharmacy.logo_url} className="w-14 h-14 rounded-xl object-cover border" alt="" />}
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Pill className="w-6 h-6 text-primary" /> {pharmacy.name}
            </h1>
            <p className="text-sm text-muted-foreground">Dorixona boshqaruv paneli</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Chiqish</Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Mahsulotlar", val: activeProducts, icon: Package, color: "text-primary" },
              { label: "Buyurtmalar", val: orders.length, icon: ShoppingCart, color: "text-blue-500" },
              { label: "Kutilmoqda", val: pendingOrders, icon: Clock, color: "text-amber-500" },
              { label: "Reyting", val: pharmacy.avg_rating || "—", icon: Star, color: "text-emerald-500" },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4 text-center">
                <s.icon className={cn("w-8 h-8 mx-auto mb-2", s.color)} />
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drugTypeData.length > 0 && (
              <Card><CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">Dori turlari</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={drugTypeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}
            {orderStatusData.length > 0 && (
              <Card><CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">Buyurtmalar holati</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {orderStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}
          </div>

          {pendingOrders > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Yangi buyurtmalar ({pendingOrders})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {orders.filter(o => o.status === "pending").slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_phone} · {new Date(o.created_at).toLocaleDateString("uz-UZ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-primary border-primary/30" onClick={() => updateOrderStatus(o.id, "confirmed")}>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => updateOrderStatus(o.id, "cancelled")}>
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Dori katalogi ({products.length})</h3>
            <Button size="sm" onClick={() => setShowAddProduct(!showAddProduct)}>
              <Plus className="w-4 h-4 mr-1" /> Qo'shish
            </Button>
          </div>

          {showAddProduct && (
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nomi *</Label><Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Ishlab chiqaruvchi</Label><Input value={newProduct.manufacturer} onChange={e => setNewProduct(p => ({ ...p, manufacturer: e.target.value }))} /></div>
                  <div><Label>Turi</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newProduct.drug_type} onChange={e => setNewProduct(p => ({ ...p, drug_type: e.target.value }))}>
                      {["tabletka", "sirop", "kapsula", "in'ektsiya", "malham", "tomchi", "kukun", "boshqa"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><Label>Narxi (so'm)</Label><Input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} /></div>
                  <div><Label>Dozasi</Label><Input value={newProduct.dosage} onChange={e => setNewProduct(p => ({ ...p, dosage: e.target.value }))} placeholder="500mg" /></div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 pb-2"><input type="checkbox" checked={newProduct.requires_prescription} onChange={e => setNewProduct(p => ({ ...p, requires_prescription: e.target.checked }))} className="rounded" /><span className="text-sm">Retsept talab qilinadi</span></label>
                  </div>
                </div>
                <div><Label>Tavsif</Label><Textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                <div className="flex gap-2">
                  <Button onClick={addProduct} disabled={saving} size="sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAddProduct(false)}>Bekor qilish</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali mahsulot qo'shilmagan</p></div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className={cn("flex items-center justify-between p-3 rounded-lg border transition-all", p.is_active ? "border-border" : "border-border/50 opacity-60")}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.requires_prescription && <Badge variant="outline" className="text-xs">Retsept</Badge>}
                      <Badge variant={p.is_available ? "default" : "secondary"} className="text-xs">{p.is_available ? "Mavjud" : "Tugagan"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.manufacturer} · {p.drug_type} {p.dosage && `· ${p.dosage}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{Number(p.price).toLocaleString()} so'm</span>
                    <Button size="sm" variant="ghost" onClick={() => toggleProductActive(p.id, p.is_active)}>
                      {p.is_active ? <XCircle className="w-4 h-4 text-muted-foreground" /> : <CheckCircle className="w-4 h-4 text-primary" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali buyurtmalar yo'q</p></div>
          ) : orders.map(o => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_phone} · {new Date(o.created_at).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <Badge variant={o.status === "confirmed" ? "default" : o.status === "delivered" ? "secondary" : o.status === "cancelled" ? "destructive" : "outline"}>
                    {o.status === "pending" ? "Kutilmoqda" : o.status === "confirmed" ? "Tasdiqlangan" : o.status === "delivered" ? "Yetkazilgan" : "Bekor"}
                  </Badge>
                </div>
                {o.total_amount > 0 && <p className="text-sm font-semibold">{Number(o.total_amount).toLocaleString()} so'm</p>}
                {o.notes && <p className="text-xs text-muted-foreground mt-1">{o.notes}</p>}
                {o.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => updateOrderStatus(o.id, "confirmed")}>Tasdiqlash</Button>
                    <Button size="sm" variant="outline" onClick={() => updateOrderStatus(o.id, "cancelled")}>Bekor qilish</Button>
                  </div>
                )}
                {o.status === "confirmed" && (
                  <Button size="sm" className="mt-3" onClick={() => updateOrderStatus(o.id, "delivered")}>
                    <Truck className="w-3.5 h-3.5 mr-1" /> Yetkazildi
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "photos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Rasmlar ({photos.length})</h3>
            <label className="cursor-pointer">
              <Input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
              <Button size="sm" asChild><span><Upload className="w-4 h-4 mr-1" /> Yuklash</span></Button>
            </label>
          </div>
          {photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Camera className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali rasmlar yuklanmagan</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p: any) => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={p.url} alt="" className="w-full h-40 object-cover" />
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7"
                    onClick={() => deletePhoto(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Dorixona sozlamalari</h3>
              {!profileEdit && <Button size="sm" variant="outline" onClick={() => setProfileEdit(true)}><Edit className="w-4 h-4 mr-1" /> Tahrirlash</Button>}
            </div>
            {profileEdit ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Dorixona nomi</Label><Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Telefon</Label><Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Email</Label><Input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Website</Label><Input value={profileForm.website} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Telegram</Label><Input value={profileForm.telegram} onChange={e => setProfileForm(p => ({ ...p, telegram: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label>Manzil</Label><Input value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} className="mt-1" /></div>
                <div><Label>Tavsif</Label><Textarea value={profileForm.description} onChange={e => setProfileForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" /></div>
                <div className="flex gap-2">
                  <Button onClick={saveProfile} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Saqlash</Button>
                  <Button variant="outline" onClick={() => setProfileEdit(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {[
                  ["Nomi", pharmacy.name], ["Telefon", pharmacy.phone], ["Email", pharmacy.email],
                  ["Manzil", pharmacy.address], ["Viloyat", pharmacy.region],
                  ["24 soat", pharmacy.is_24h ? "Ha" : "Yo'q"],
                  ["Yetkazib berish", pharmacy.has_delivery ? "Ha" : "Yo'q"],
                  ["Website", pharmacy.website], ["Telegram", pharmacy.telegram],
                ].filter(([_, v]) => v).map(([label, val]) => (
                  <div key={label as string} className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PharmacyDashboard;
