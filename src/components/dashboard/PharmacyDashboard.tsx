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
  Pill, Plus, Package, ShoppingCart, BarChart3, Settings,
  CheckCircle, XCircle, Trash2, Edit, DollarSign, Loader2, LogOut,
  Truck, Clock, Star, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "overview" | "products" | "orders" | "settings";

const PharmacyDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const [prodRes, ordRes] = await Promise.all([
        supabase.from("pharmacy_products").select("*").eq("pharmacy_id", phData.id).order("created_at", { ascending: false }),
        supabase.from("pharmacy_orders").select("*").eq("pharmacy_id", phData.id).order("created_at", { ascending: false }),
      ]);
      setProducts(prodRes.data || []);
      setOrders(ordRes.data || []);
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
      name: newProduct.name.trim(),
      manufacturer: newProduct.manufacturer,
      drug_type: newProduct.drug_type,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
      description: newProduct.description,
      dosage: newProduct.dosage,
      requires_prescription: newProduct.requires_prescription,
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

  if (loading) return <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>;

  if (!pharmacy) {
    return (
      <div className="text-center py-16">
        <Pill className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Dorixonangizni yarating</h2>
        <p className="text-muted-foreground mb-6">Platformada dorixonangizni ro'yxatdan o'tkazing</p>
        <Button onClick={handleCreatePharmacy} className="bg-hero-gradient text-primary-foreground border-0">
          <Plus className="w-4 h-4 mr-2" /> Dorixona yaratish
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabId, label: "Umumiy", icon: BarChart3 },
    { id: "products" as TabId, label: "Mahsulotlar", icon: Package },
    { id: "orders" as TabId, label: "Buyurtmalar", icon: ShoppingCart },
    { id: "settings" as TabId, label: "Sozlamalar", icon: Settings },
  ];

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const activeProducts = products.filter(p => p.is_active).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary" /> {pharmacy.name}
          </h1>
          <p className="text-sm text-muted-foreground">Dorixona boshqaruv paneli</p>
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
              { label: "Buyurtmalar", val: orders.length, icon: ShoppingCart, color: "text-medical-blue" },
              { label: "Kutilmoqda", val: pendingOrders, icon: Clock, color: "text-medical-orange" },
              { label: "Reyting", val: pharmacy.avg_rating || "—", icon: Star, color: "text-medical-green" },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4 text-center">
                <s.icon className={cn("w-8 h-8 mx-auto mb-2", s.color)} />
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent></Card>
            ))}
          </div>

          {pendingOrders > 0 && (
            <Card className="border-medical-orange/30">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-medical-orange" /> Yangi buyurtmalar ({pendingOrders})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {orders.filter(o => o.status === "pending").slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_phone} · {new Date(o.created_at).toLocaleDateString("uz-UZ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300" onClick={() => updateOrderStatus(o.id, "confirmed")}>
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
                    <Button size="sm" onClick={() => updateOrderStatus(o.id, "confirmed")} className="bg-emerald-600 text-white">Tasdiqlash</Button>
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

      {tab === "settings" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Dorixona sozlamalari</h3>
            <div className="space-y-3">
              {[
                ["Nomi", pharmacy.name], ["Telefon", pharmacy.phone], ["Manzil", pharmacy.address],
                ["Viloyat", pharmacy.region], ["24 soat", pharmacy.is_24h ? "Ha" : "Yo'q"],
                ["Yetkazib berish", pharmacy.has_delivery ? "Ha" : "Yo'q"],
              ].filter(([_, v]) => v).map(([label, val]) => (
                <div key={label as string} className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{val}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PharmacyDashboard;
