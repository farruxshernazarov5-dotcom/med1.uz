import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Package, Plus, Trash2, AlertTriangle, Loader2, Search, ShoppingCart,
  TrendingUp, Boxes, DollarSign, Sparkles, ArrowDownCircle, ArrowUpCircle,
  History, Edit, Image as ImageIcon,
} from "lucide-react";
import { downloadHMSReceipt } from "@/utils/downloadHMSReceipt";

const CATEGORIES = [
  { v: "yuz", l: "Yuz parvarishi" },
  { v: "soch", l: "Soch" },
  { v: "anti-aging", l: "Anti-aging" },
  { v: "kosmetika", l: "Kosmetika" },
  { v: "krem", l: "Krem" },
  { v: "serum", l: "Serum" },
  { v: "filler", l: "Filler" },
  { v: "botoks", l: "Botoks" },
  { v: "maska", l: "Maska" },
  { v: "boshqa", l: "Boshqa" },
];

const CosInventory = ({ centerId }: { centerId: string }) => {
  const [tab, setTab] = useState("products");
  const [items, setItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [usages, setUsages] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", category: "krem", brand: "", description: "", unit: "dona",
    quantity: "", min_quantity: "5", purchase_price: "", sell_price: "",
    supplier: "", expiry_date: "", image_url: "",
  });

  const [showSale, setShowSale] = useState(false);
  const [saleProduct, setSaleProduct] = useState<any>(null);
  const [saleForm, setSaleForm] = useState({ client_id: "", quantity: "1", payment_method: "cash", notes: "" });

  const [showStockIn, setShowStockIn] = useState(false);
  const [stockProduct, setStockProduct] = useState<any>(null);
  const [stockForm, setStockForm] = useState({ quantity: "", notes: "" });

  const [showHistory, setShowHistory] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [it, sa, us, mv, cl] = await Promise.all([
      supabase.from("cosmetology_inventory" as any).select("*").eq("center_id", centerId).order("name"),
      supabase.from("cosmetology_product_sales" as any).select("*, cosmetology_inventory(name), cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }).limit(100),
      supabase.from("cosmetology_product_usage" as any).select("*, cosmetology_inventory(name), cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }).limit(100),
      supabase.from("cosmetology_stock_movements" as any).select("*, cosmetology_inventory(name)").eq("center_id", centerId).order("created_at", { ascending: false }).limit(200),
      supabase.from("cosmetology_clients" as any).select("id, full_name, phone").eq("center_id", centerId).order("full_name").limit(500),
    ]);
    setItems((it.data as any[]) || []);
    setSales((sa.data as any[]) || []);
    setUsages((us.data as any[]) || []);
    setMovements((mv.data as any[]) || []);
    setClients((cl.data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [centerId]);

  const resetForm = () => setForm({
    name: "", category: "krem", brand: "", description: "", unit: "dona",
    quantity: "", min_quantity: "5", purchase_price: "", sell_price: "",
    supplier: "", expiry_date: "", image_url: "",
  });

  const save = async () => {
    if (!form.name) { toast({ title: "Nom majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      ...form,
      quantity: parseFloat(form.quantity) || 0,
      min_quantity: parseFloat(form.min_quantity) || 0,
      purchase_price: parseFloat(form.purchase_price) || 0,
      sell_price: parseFloat(form.sell_price) || 0,
      expiry_date: form.expiry_date || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("cosmetology_inventory" as any).update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("cosmetology_inventory" as any).insert({ center_id: centerId, ...payload } as any));
    }
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "✅ Yangilandi" : "✅ Mahsulot qo'shildi" });
    setShowForm(false); setEditing(null); resetForm(); load();
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name || "", category: item.category || "krem", brand: item.brand || "",
      description: item.description || "", unit: item.unit || "dona",
      quantity: String(item.quantity ?? ""), min_quantity: String(item.min_quantity ?? "5"),
      purchase_price: String(item.purchase_price ?? ""), sell_price: String(item.sell_price ?? ""),
      supplier: item.supplier || "", expiry_date: item.expiry_date || "", image_url: item.image_url || "",
    });
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await supabase.from("cosmetology_inventory" as any).delete().eq("id", id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "O'chirildi" });
    load();
  };

  const uploadImage = async (file: File) => {
    const path = `${centerId}/products/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("cosmetology-files").upload(path, file);
    if (error) { toast({ title: "Yuklash xatosi", description: error.message, variant: "destructive" }); return; }
    const { data: pub } = supabase.storage.from("cosmetology-files").getPublicUrl(path);
    setForm({ ...form, image_url: pub.publicUrl });
    toast({ title: "✅ Rasm yuklandi" });
  };

  const sell = async () => {
    if (!saleProduct) return;
    const qty = parseFloat(saleForm.quantity) || 0;
    if (qty <= 0) { toast({ title: "Miqdor noto'g'ri", variant: "destructive" }); return; }
    if (qty > Number(saleProduct.quantity)) { toast({ title: "Omborda yetarli emas", variant: "destructive" }); return; }
    const total = qty * Number(saleProduct.sell_price || 0);
    const { data, error } = await supabase.from("cosmetology_product_sales" as any).insert({
      center_id: centerId, product_id: saleProduct.id,
      client_id: saleForm.client_id || null,
      quantity: qty, unit_price: saleProduct.sell_price, total_price: total,
      payment_method: saleForm.payment_method, notes: saleForm.notes,
    } as any).select().single();
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    // record financial transaction
    await supabase.from("cosmetology_transactions" as any).insert({
      center_id: centerId, type: "income", category: "product_sale",
      amount: total, payment_method: saleForm.payment_method,
      client_id: saleForm.client_id || null,
      description: `Mahsulot sotuvi: ${saleProduct.name} × ${qty}`,
    } as any);
    // receipt
    const client = clients.find(c => c.id === saleForm.client_id);
    try {
      downloadHMSReceipt({
        receiptNumber: `PRD-${(data as any)?.id?.slice(0, 8) || Date.now()}`,
        date: new Date().toLocaleString("uz-UZ"),
        clientName: client?.full_name || "Mijoz",
        clientPhone: client?.phone || "",
        items: [{ name: saleProduct.name, quantity: qty, price: Number(saleProduct.sell_price || 0), total }],
        total, paymentMethod: saleForm.payment_method,
        clinicName: "Cosmetology Center",
      } as any);
    } catch {}
    toast({ title: "✅ Sotildi", description: `${total.toLocaleString()} so'm` });
    setShowSale(false); setSaleProduct(null);
    setSaleForm({ client_id: "", quantity: "1", payment_method: "cash", notes: "" });
    load();
  };

  const stockIn = async () => {
    if (!stockProduct) return;
    const qty = parseFloat(stockForm.quantity) || 0;
    if (qty <= 0) { toast({ title: "Miqdor noto'g'ri", variant: "destructive" }); return; }
    const newQty = Number(stockProduct.quantity || 0) + qty;
    const { error } = await supabase.from("cosmetology_inventory" as any).update({ quantity: newQty } as any).eq("id", stockProduct.id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await supabase.from("cosmetology_stock_movements" as any).insert({
      center_id: centerId, product_id: stockProduct.id,
      movement_type: "in", quantity: qty, notes: stockForm.notes || "Omborga qo'shildi",
    } as any);
    toast({ title: "✅ Omborga qo'shildi" });
    setShowStockIn(false); setStockProduct(null); setStockForm({ quantity: "", notes: "" });
    load();
  };

  // Filter
  const filtered = useMemo(() => items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name?.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q);
    const matchCat = filterCat === "all" || i.category === filterCat;
    return matchSearch && matchCat;
  }), [items, search, filterCat]);

  // KPI
  const kpi = useMemo(() => {
    const total = items.length;
    const inStock = items.filter(i => Number(i.quantity) > Number(i.min_quantity)).length;
    const lowStock = items.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.min_quantity)).length;
    const outStock = items.filter(i => Number(i.quantity) <= 0).length;
    const stockValue = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.purchase_price || 0), 0);
    const totalSalesAmount = sales.reduce((s, x) => s + Number(x.total_price || 0), 0);
    // top sold
    const soldMap = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) => {
      const k = s.product_id;
      const cur = soldMap.get(k) || { name: s.cosmetology_inventory?.name || "?", qty: 0, revenue: 0 };
      cur.qty += Number(s.quantity || 0);
      cur.revenue += Number(s.total_price || 0);
      soldMap.set(k, cur);
    });
    const topSold = Array.from(soldMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
    return { total, inStock, lowStock, outStock, stockValue, totalSalesAmount, topSold };
  }, [items, sales]);

  const productHistory = useMemo(() => {
    if (!historyProduct) return [];
    return movements.filter(m => m.product_id === historyProduct.id);
  }, [historyProduct, movements]);

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" /><div><p className="text-xs text-muted-foreground">Jami</p><p className="font-bold">{kpi.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Boxes className="w-4 h-4 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Mavjud</p><p className="font-bold text-emerald-500">{kpi.inStock}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><div><p className="text-xs text-muted-foreground">Kam</p><p className="font-bold text-amber-500">{kpi.lowStock}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-violet-500" /><div><p className="text-xs text-muted-foreground">Ombor narxi</p><p className="font-bold text-xs">{kpi.stockValue.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /><div><p className="text-xs text-muted-foreground">Sotuv</p><p className="font-bold text-xs">{kpi.totalSalesAmount.toLocaleString()}</p></div></div></CardContent></Card>
      </div>

      {/* Low stock banner */}
      {kpi.lowStock + kpi.outStock > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-amber-600 font-medium">{kpi.lowStock + kpi.outStock} ta mahsulot kam yoki tugagan!</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
          <TabsTrigger value="sales">Sotuvlar</TabsTrigger>
          <TabsTrigger value="usage">Ishlatilgan</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* PRODUCTS */}
        <TabsContent value="products" className="space-y-3 mt-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" /><Input placeholder="Qidiruv (nomi, brend)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">Barcha kategoriyalar</option>
              {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
            <Button size="sm" onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Mahsulot</Button>
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Mahsulotlar yo'q</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((i) => {
                const low = Number(i.quantity) <= Number(i.min_quantity);
                const out = Number(i.quantity) <= 0;
                const profit = Number(i.sell_price || 0) - Number(i.purchase_price || 0);
                return (
                  <Card key={i.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      {i.image_url ? <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" loading="lazy" /> : <ImageIcon className="w-10 h-10 text-muted-foreground/40" />}
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{i.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{i.brand || "—"}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{i.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {out ? <Badge className="text-xs bg-destructive/20 text-destructive">Tugagan</Badge>
                          : low ? <Badge className="text-xs bg-amber-500/20 text-amber-600"><AlertTriangle className="w-3 h-3 mr-0.5" />Kam</Badge>
                          : <Badge className="text-xs bg-emerald-500/20 text-emerald-600">Mavjud</Badge>}
                        <span className="text-xs text-muted-foreground">{i.quantity} {i.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Sotish: <b className="text-foreground">{Number(i.sell_price || 0).toLocaleString()}</b></span>
                        <span className={profit > 0 ? "text-emerald-500" : "text-muted-foreground"}>+{profit.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 pt-1">
                        <Button size="sm" variant="default" className="h-8 text-xs" disabled={out} onClick={() => { setSaleProduct(i); setShowSale(true); }}><ShoppingCart className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setStockProduct(i); setShowStockIn(true); }}><ArrowDownCircle className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setHistoryProduct(i); setShowHistory(true); }}><History className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => openEdit(i)}><Edit className="w-3 h-3" /></Button>
                      </div>
                      <Button size="sm" variant="ghost" className="w-full h-7 text-xs text-destructive" onClick={() => remove(i.id)}><Trash2 className="w-3 h-3 mr-1" />O'chirish</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* SALES */}
        <TabsContent value="sales" className="space-y-2 mt-3">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Sotuvlar yo'q</p></div>
          ) : sales.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{s.cosmetology_inventory?.name || "?"}</p>
                <p className="text-xs text-muted-foreground truncate">{s.cosmetology_clients?.full_name || "Mijozsiz"} · {new Date(s.created_at).toLocaleString("uz-UZ")}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{Number(s.total_price || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{s.quantity} × {Number(s.unit_price).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* USAGE */}
        <TabsContent value="usage" className="space-y-2 mt-3">
          {usages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Xizmatlarda ishlatilgan mahsulotlar yo'q</p><p className="text-xs mt-1">Xizmat bajarilganda avtomatik yoziladi</p></div>
          ) : usages.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.cosmetology_inventory?.name || "?"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.cosmetology_clients?.full_name || "—"} · {new Date(u.created_at).toLocaleString("uz-UZ")}</p>
              </div>
              <Badge variant="outline" className="text-xs">{u.quantity}</Badge>
            </div>
          ))}
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-3 mt-3">
          <Card><CardContent className="p-4">
            <p className="font-semibold text-sm mb-3">🏆 Eng ko'p sotilgan</p>
            {kpi.topSold.length === 0 ? <p className="text-xs text-muted-foreground">Ma'lumot yo'q</p> : (
              <div className="space-y-2">
                {kpi.topSold.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2"><Badge>{idx + 1}</Badge><span className="text-sm font-medium">{t.name}</span></div>
                    <div className="text-right"><p className="text-sm font-bold">{t.qty} dona</p><p className="text-xs text-muted-foreground">{t.revenue.toLocaleString()} so'm</p></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* PRODUCT FORM */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditing(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Tahrirlash" : "Yangi mahsulot"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Rasm</Label>
              <div className="mt-1 flex items-center gap-2">
                {form.image_url && <img loading="lazy" decoding="async" src={form.image_url} alt="" className="w-16 h-16 rounded object-cover" />}
                <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div>
                <Label>Kategoriya</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div><Label>Brend</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-1" /></div>
              <div><Label>O'lchov</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1" /></div>
              <div><Label>Qoldiq</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" /></div>
              <div><Label>Min qoldiq</Label><Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} className="mt-1" /></div>
              <div><Label>Sotib olish</Label><Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Sotish narxi</Label><Input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Yetkazib beruvchi</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="mt-1" /></div>
              <div><Label>Muddati</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Tavsif</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}>Bekor</Button>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SALE DIALOG */}
      <Dialog open={showSale} onOpenChange={setShowSale}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sotish: {saleProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded bg-muted/30 text-sm">
              <div className="flex justify-between"><span>Mavjud:</span><b>{saleProduct?.quantity} {saleProduct?.unit}</b></div>
              <div className="flex justify-between"><span>Narx:</span><b>{Number(saleProduct?.sell_price || 0).toLocaleString()} so'm</b></div>
            </div>
            <div>
              <Label>Mijoz (ixtiyoriy)</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={saleForm.client_id} onChange={(e) => setSaleForm({ ...saleForm, client_id: e.target.value })}>
                <option value="">Mijozsiz</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} {c.phone ? `· ${c.phone}` : ""}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Miqdor</Label><Input type="number" value={saleForm.quantity} onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })} className="mt-1" /></div>
              <div>
                <Label>To'lov</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={saleForm.payment_method} onChange={(e) => setSaleForm({ ...saleForm, payment_method: e.target.value })}>
                  <option value="cash">Naqd</option><option value="card">Karta</option><option value="click">Click</option><option value="payme">Payme</option><option value="transfer">O'tkazma</option>
                </select>
              </div>
            </div>
            <div className="p-3 rounded bg-primary/10 text-center">
              <p className="text-xs text-muted-foreground">Jami</p>
              <p className="text-2xl font-bold text-primary">{((parseFloat(saleForm.quantity) || 0) * Number(saleProduct?.sell_price || 0)).toLocaleString()} so'm</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowSale(false)}>Bekor</Button>
              <Button size="sm" onClick={sell}><ShoppingCart className="w-4 h-4 mr-1" />Sotish + Chek</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* STOCK IN */}
      <Dialog open={showStockIn} onOpenChange={setShowStockIn}>
        <DialogContent>
          <DialogHeader><DialogTitle>Omborga qo'shish: {stockProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Hozirgi qoldiq: <b className="text-foreground">{stockProduct?.quantity} {stockProduct?.unit}</b></div>
            <div><Label>Miqdor *</Label><Input type="number" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} className="mt-1" /></div>
            <div><Label>Izoh</Label><Input value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} className="mt-1" placeholder="Yetkazib beruvchi, hujjat raqami..." /></div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowStockIn(false)}>Bekor</Button>
              <Button size="sm" onClick={stockIn}><ArrowDownCircle className="w-4 h-4 mr-1" />Qo'shish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* HISTORY */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tarix: {historyProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {productHistory.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Tarix yo'q</p> :
              productHistory.map((m) => {
                const isIn = Number(m.quantity) > 0;
                return (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border">
                    <div className="flex items-center gap-2">
                      {isIn ? <ArrowDownCircle className="w-4 h-4 text-emerald-500" /> : <ArrowUpCircle className="w-4 h-4 text-destructive" />}
                      <div>
                        <p className="text-xs font-medium">{m.movement_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("uz-UZ")}</p>
                      </div>
                    </div>
                    <Badge variant={isIn ? "default" : "destructive"} className="text-xs">{isIn ? "+" : ""}{m.quantity}</Badge>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CosInventory;
