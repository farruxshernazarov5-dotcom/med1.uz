import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Package, ShoppingCart, BarChart3, Bell, Plus, Pencil, Trash2,
  Loader2, Eye, TrendingUp, DollarSign, AlertCircle,
} from "lucide-react";

interface Vendor {
  id: string;
  company_name: string;
  is_verified: boolean;
  categories: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  view_count: number;
  photos: string[];
  description: string;
}

interface Order {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  status: string;
  total_amount: number;
  created_at: string;
  notes: string;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", category: "", price: "", stock_quantity: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: v } = await supabase.from("medtech_vendors" as any).select("*").eq("owner_id", user!.id).maybeSingle();
    if (v) {
      setVendor(v as any);
      const [prodRes, orderRes] = await Promise.all([
        supabase.from("medtech_products" as any).select("*").eq("vendor_id", (v as any).id).order("created_at", { ascending: false }),
        supabase.from("medtech_orders" as any).select("*").eq("vendor_id", (v as any).id).order("created_at", { ascending: false }),
      ]);
      setProducts((prodRes.data || []) as any);
      setOrders((orderRes.data || []) as any);
    }
    setLoading(false);
  };

  const resetProductForm = () => {
    setProductForm({ name: "", category: "", price: "", stock_quantity: "", description: "" });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ name: p.name, category: p.category, price: String(p.price), stock_quantity: String(p.stock_quantity), description: p.description || "" });
    setShowProductForm(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { toast({ title: "Mahsulot nomi majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      price: parseFloat(productForm.price) || 0,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      description: productForm.description.trim(),
      vendor_id: vendor!.id,
    };

    if (editingProduct) {
      const { error } = await supabase.from("medtech_products" as any).update(payload as any).eq("id", editingProduct.id);
      if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      else toast({ title: "✅ Mahsulot yangilandi" });
    } else {
      const { error } = await supabase.from("medtech_products" as any).insert(payload as any);
      if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      else toast({ title: "✅ Mahsulot qo'shildi" });
    }
    setSaving(false);
    resetProductForm();
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Mahsulotni o'chirmoqchimisiz?")) return;
    await supabase.from("medtech_products" as any).delete().eq("id", id);
    toast({ title: "Mahsulot o'chirildi" });
    loadData();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from("medtech_orders" as any).update({ status } as any).eq("id", orderId);
    toast({ title: `Buyurtma holati: ${status}` });
    loadData();
  };

  const totalRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalViews = products.reduce((s, p) => s + (p.view_count || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!vendor) return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="py-12 text-center space-y-4">
        <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-bold">Medtexnika kompaniyangiz topilmadi</h2>
        <p className="text-muted-foreground">Avval kompaniyangizni ro'yxatdan o'tkazing</p>
        <Button onClick={() => window.location.href = "/vendor-register"}>Ro'yxatdan o'tish</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{vendor.company_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {vendor.is_verified ? <Badge className="bg-emerald-500">✅ Tasdiqlangan</Badge> : <Badge variant="secondary">⏳ Tekshirilmoqda</Badge>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Package className="w-6 h-6 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-xs text-muted-foreground">Mahsulotlar</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ShoppingCart className="w-6 h-6 mx-auto text-secondary mb-1" />
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground">Buyurtmalar</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Eye className="w-6 h-6 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{totalViews}</p>
          <p className="text-xs text-muted-foreground">Ko'rishlar</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Tushum (UZS)</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="products"><Package className="w-4 h-4 mr-1" /> Mahsulotlar</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4 mr-1" /> Buyurtmalar {pendingOrders > 0 && <Badge className="ml-1 bg-destructive text-xs">{pendingOrders}</Badge>}</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-1" /> Statistika</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Mahsulotlar ({products.length})</h3>
            <Button size="sm" onClick={() => { resetProductForm(); setShowProductForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Yangi mahsulot
            </Button>
          </div>

          {showProductForm && (
            <Card>
              <CardHeader><CardTitle className="text-lg">{editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nomi *</Label>
                  <Input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Kategoriya</Label>
                    <Input value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} className="mt-1" placeholder="Diagnostika uskunalari" />
                  </div>
                  <div>
                    <Label>Narxi (UZS)</Label>
                    <Input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Miqdori (dona)</Label>
                  <Input type="number" value={productForm.stock_quantity} onChange={e => setProductForm(p => ({ ...p, stock_quantity: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Tavsif</Label>
                  <Textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProduct} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {editingProduct ? "Yangilash" : "Qo'shish"}
                  </Button>
                  <Button variant="outline" onClick={resetProductForm}>Bekor qilish</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {products.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Hozircha mahsulotlar yo'q
            </CardContent></Card>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Narxi</TableHead>
                    <TableHead>Miqdori</TableHead>
                    <TableHead>Ko'rishlar</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.category || "—"}</Badge></TableCell>
                      <TableCell>{p.price?.toLocaleString()} UZS</TableCell>
                      <TableCell>{p.stock_quantity}</TableCell>
                      <TableCell>{p.view_count}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditProduct(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <h3 className="font-semibold">Buyurtmalar ({orders.length})</h3>
          {orders.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Hozircha buyurtmalar yo'q
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <Card key={o.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{o.buyer_name}</p>
                        <p className="text-sm text-muted-foreground">{o.buyer_phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString("uz-UZ")}</p>
                        {o.notes && <p className="text-xs text-muted-foreground mt-1">📝 {o.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{o.total_amount?.toLocaleString()} UZS</p>
                        <Badge variant={o.status === "completed" ? "default" : o.status === "pending" ? "secondary" : "outline"} className="mt-1">
                          {o.status === "pending" ? "⏳ Kutilmoqda" : o.status === "confirmed" ? "✅ Tasdiqlangan" : o.status === "shipped" ? "🚚 Yuborilgan" : o.status === "completed" ? "✔ Yakunlangan" : o.status}
                        </Badge>
                      </div>
                    </div>
                    {o.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => updateOrderStatus(o.id, "confirmed")}>Tasdiqlash</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(o.id, "cancelled")}>Bekor qilish</Button>
                      </div>
                    )}
                    {o.status === "confirmed" && (
                      <Button size="sm" className="mt-3" onClick={() => updateOrderStatus(o.id, "shipped")}>🚚 Yuborish</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Eng ko'p ko'rilgan</CardTitle></CardHeader>
              <CardContent>
                {products.sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm">{i + 1}. {p.name}</span>
                    <span className="text-sm text-muted-foreground">{p.view_count} ko'rish</span>
                  </div>
                ))}
                {products.length === 0 && <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Buyurtmalar statistikasi</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span className="text-sm">Jami buyurtmalar:</span><span className="font-medium">{orders.length}</span></div>
                <div className="flex justify-between"><span className="text-sm">Kutilmoqda:</span><span className="font-medium text-amber-600">{pendingOrders}</span></div>
                <div className="flex justify-between"><span className="text-sm">Yakunlangan:</span><span className="font-medium text-emerald-600">{orders.filter(o => o.status === "completed").length}</span></div>
                <div className="flex justify-between"><span className="text-sm">Jami tushum:</span><span className="font-bold">{totalRevenue.toLocaleString()} UZS</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;
