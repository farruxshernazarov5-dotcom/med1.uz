import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Package, AlertTriangle, Search, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSInventory = ({ clinicId }: Props) => {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name: "", category: "medicine", sku: "", unit: "dona", quantity: "", min_quantity: "5", purchase_price: "", sell_price: "", supplier: "", expiry_date: "", location: "", notes: "" });

  const fetchData = async () => {
    const { data } = await supabase.from("hms_inventory").select("*").eq("clinic_id", clinicId).order("name").limit(500);
    setItems(data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ name: "", category: "medicine", sku: "", unit: "dona", quantity: "", min_quantity: "5", purchase_price: "", sell_price: "", supplier: "", expiry_date: "", location: "", notes: "" }); setShowForm(false); setEditItem(null); };

  const handleSave = async () => {
    if (!form.name || !form.quantity) { toast({ title: "Nomi va miqdori majburiy!", variant: "destructive" }); return; }
    const payload = {
      ...form, clinic_id: clinicId, quantity: Number(form.quantity), min_quantity: Number(form.min_quantity) || 5,
      purchase_price: Number(form.purchase_price) || 0, sell_price: Number(form.sell_price) || 0,
      expiry_date: form.expiry_date || null, status: Number(form.quantity) <= 0 ? "out_of_stock" : Number(form.quantity) <= Number(form.min_quantity) ? "low_stock" : "in_stock"
    };
    if (editItem) {
      await supabase.from("hms_inventory").update(payload).eq("id", editItem.id);
      toast({ title: "✅ Yangilandi" });
    } else {
      await supabase.from("hms_inventory").insert(payload);
      toast({ title: "✅ Mahsulot qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const startEdit = (item: any) => {
    setForm({
      name: item.name, category: item.category || "medicine", sku: item.sku || "", unit: item.unit || "dona",
      quantity: String(item.quantity), min_quantity: String(item.min_quantity || 5),
      purchase_price: String(item.purchase_price || ""), sell_price: String(item.sell_price || ""),
      supplier: item.supplier || "", expiry_date: item.expiry_date || "", location: item.location || "", notes: item.notes || ""
    });
    setEditItem(item); setShowForm(true);
  };

  const lowStock = items.filter(i => Number(i.quantity) <= Number(i.min_quantity) && Number(i.quantity) > 0);
  const outOfStock = items.filter(i => Number(i.quantity) <= 0);
  const expiringSoon = items.filter(i => {
    if (!i.expiry_date) return false;
    const diff = (new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const filtered = items.filter(i => {
    const matchFilter = filter === "all" || (filter === "low" && Number(i.quantity) <= Number(i.min_quantity) && Number(i.quantity) > 0) || (filter === "out" && Number(i.quantity) <= 0) || (filter === "ok" && Number(i.quantity) > Number(i.min_quantity));
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.includes(search) || i.supplier?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const categories = [
    { value: "medicine", label: "Dori" }, { value: "consumable", label: "Sarf material" }, { value: "equipment", label: "Jihoz" },
    { value: "reagent", label: "Reagent" }, { value: "ppe", label: "Himoya vositasi" }, { value: "other", label: "Boshqa" }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Ombor boshqaruvi</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi mahsulot</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jami mahsulotlar", value: items.length, color: "text-foreground" },
          { label: "Kam qolgan", value: lowStock.length, color: "text-yellow-600", icon: AlertTriangle },
          { label: "Tugagan", value: outOfStock.length, color: "text-red-600" },
          { label: "Muddati yaqin", value: expiringSoon.length, color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-4">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Kam qolgan: {lowStock.map(i => i.name).join(", ")}</p>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder="Mahsulot qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[{ id: "all", label: "Barchasi" }, { id: "ok", label: "Yetarli" }, { id: "low", label: "Kam" }, { id: "out", label: "Tugagan" }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editItem ? "Tahrirlash" : "Yangi mahsulot"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Nomi *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <Input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
            <Input placeholder="Birlik (dona)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            <Input type="number" placeholder="Miqdor *" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <Input type="number" placeholder="Min miqdor" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} />
            <Input type="number" placeholder="Sotib olish narxi" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
            <Input type="number" placeholder="Sotish narxi" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} />
            <Input placeholder="Yetkazuvchi" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            <Input type="date" placeholder="Yaroqlilik muddati" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
            <Input placeholder="Joylashuv" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <Input placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editItem ? "Saqlash" : "Qo'shish"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(item => {
          const isLow = Number(item.quantity) <= Number(item.min_quantity) && Number(item.quantity) > 0;
          const isOut = Number(item.quantity) <= 0;
          return (
            <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isOut ? "bg-red-100" : isLow ? "bg-yellow-100" : "bg-primary/10")}>
                  <Package className={cn("w-5 h-5", isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-primary")} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.name} {item.sku && <span className="text-xs text-muted-foreground">({item.sku})</span>}</p>
                  <p className="text-xs text-muted-foreground">{item.category} • {item.supplier || "—"} • {item.location || "—"}{item.expiry_date ? ` • Muddat: ${item.expiry_date}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn("font-bold text-sm", isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-foreground")}>{item.quantity} {item.unit}</p>
                  {item.sell_price > 0 && <p className="text-xs text-muted-foreground">{Number(item.sell_price).toLocaleString()} so'm</p>}
                </div>
                <Badge className={cn("text-[10px]", isOut ? "bg-red-100 text-red-800" : isLow ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800")}>{isOut ? "Tugagan" : isLow ? "Kam" : "Yetarli"}</Badge>
                <Button size="sm" variant="ghost" onClick={() => startEdit(item)}><Edit2 className="w-4 h-4" /></Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Mahsulotlar yo'q</p>}
      </div>
    </div>
  );
};

export default HMSInventory;
