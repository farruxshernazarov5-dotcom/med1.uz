import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Plus, X, Package, AlertTriangle, Search, Edit2, TrendingDown, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; patients: any[] }

const CATEGORIES = [
  { value: "filling", label: "Plomba materiallari" },
  { value: "anesthesia", label: "Anestetiklar" },
  { value: "implant", label: "Implant materiallari" },
  { value: "sterilization", label: "Sterilizatsiya" },
  { value: "disposable", label: "Bir martalik" },
  { value: "instrument", label: "Instrumentlar" },
  { value: "prosthetic", label: "Protez materiallari" },
  { value: "orthodontic", label: "Ortodontik" },
  { value: "other", label: "Boshqa" },
];

const DentalInventory = ({ clinicId, patients }: Props) => {
  const [items, setItems] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [tab, setTab] = useState<"list" | "usage" | "suppliers">("list");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showUsageForm, setShowUsageForm] = useState<any>(null);
  const [usageForm, setUsageForm] = useState({ patient_id: "", doctor_name: "", quantity_used: "1", treatment_type: "", notes: "" });
  const [form, setForm] = useState({
    name: "", category: "other", sku: "", unit: "dona", quantity: "", min_quantity: "5",
    purchase_price: "", sell_price: "", supplier: "", batch_number: "", expiry_date: "", location: "", notes: ""
  });

  const fetchData = async () => {
    const [inv, usage] = await Promise.all([
      supabase.from("dental_inventory").select("*").eq("clinic_id", clinicId).order("name"),
      supabase.from("dental_inventory_usage").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(100),
    ]);
    setItems(inv.data || []);
    setUsageLogs(usage.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ name: "", category: "other", sku: "", unit: "dona", quantity: "", min_quantity: "5", purchase_price: "", sell_price: "", supplier: "", batch_number: "", expiry_date: "", location: "", notes: "" });
    setShowForm(false);
    setEditItem(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.quantity) { toast({ title: "Nomi va miqdori majburiy!", variant: "destructive" }); return; }
    const qty = Number(form.quantity);
    const minQty = Number(form.min_quantity) || 5;
    const payload = {
      ...form, clinic_id: clinicId, quantity: qty, min_quantity: minQty,
      purchase_price: Number(form.purchase_price) || 0, sell_price: Number(form.sell_price) || 0,
      expiry_date: form.expiry_date || null,
      status: qty <= 0 ? "out_of_stock" : qty <= minQty ? "low_stock" : "in_stock"
    };
    if (editItem) {
      await supabase.from("dental_inventory").update(payload as any).eq("id", editItem.id);
      await writeAuditLog({ action: "update", entity_type: "dental_inventory", module: "dental", entity_id: editItem.id });
      toast({ title: "✅ Yangilandi" });
    } else {
      await supabase.from("dental_inventory").insert(payload as any);
      await writeAuditLog({ action: "create", entity_type: "dental_inventory", module: "dental", details: { name: form.name } });
      toast({ title: "✅ Material qo'shildi" });
    }
    resetForm();
    fetchData();
  };

  const startEdit = (item: any) => {
    setForm({
      name: item.name, category: item.category || "other", sku: item.sku || "", unit: item.unit || "dona",
      quantity: String(item.quantity), min_quantity: String(item.min_quantity || 5),
      purchase_price: String(item.purchase_price || ""), sell_price: String(item.sell_price || ""),
      supplier: item.supplier || "", batch_number: item.batch_number || "",
      expiry_date: item.expiry_date || "", location: item.location || "", notes: item.notes || ""
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleUseStock = async () => {
    if (!showUsageForm) return;
    const qtyUsed = Number(usageForm.quantity_used);
    if (qtyUsed <= 0) { toast({ title: "Miqdorni kiriting", variant: "destructive" }); return; }
    const newQty = Math.max(0, Number(showUsageForm.quantity) - qtyUsed);

    await supabase.from("dental_inventory_usage").insert({
      clinic_id: clinicId,
      inventory_id: showUsageForm.id,
      patient_id: usageForm.patient_id || null,
      doctor_name: usageForm.doctor_name || null,
      quantity_used: qtyUsed,
      treatment_type: usageForm.treatment_type || null,
      notes: usageForm.notes || null,
    } as any);

    await supabase.from("dental_inventory").update({
      quantity: newQty,
      status: newQty <= 0 ? "out_of_stock" : newQty <= Number(showUsageForm.min_quantity) ? "low_stock" : "in_stock"
    } as any).eq("id", showUsageForm.id);

    await writeAuditLog({ action: "use", entity_type: "dental_inventory", module: "dental", entity_id: showUsageForm.id, details: { qty: qtyUsed } });
    toast({ title: `✅ ${qtyUsed} ${showUsageForm.unit} ishlatildi` });
    setShowUsageForm(null);
    setUsageForm({ patient_id: "", doctor_name: "", quantity_used: "1", treatment_type: "", notes: "" });
    fetchData();
  };

  const lowStock = items.filter(i => Number(i.quantity) <= Number(i.min_quantity) && Number(i.quantity) > 0);
  const outOfStock = items.filter(i => Number(i.quantity) <= 0);
  const expiringSoon = items.filter(i => {
    if (!i.expiry_date) return false;
    const diff = (new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const filtered = items.filter(i => {
    const matchFilter = filter === "all" ||
      (filter === "low" && Number(i.quantity) <= Number(i.min_quantity) && Number(i.quantity) > 0) ||
      (filter === "out" && Number(i.quantity) <= 0) ||
      (filter === "ok" && Number(i.quantity) > Number(i.min_quantity)) ||
      (filter === "expiring" && i.expiry_date && (new Date(i.expiry_date).getTime() - Date.now()) / 86400000 <= 30 && (new Date(i.expiry_date).getTime() - Date.now()) >= 0);
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.includes(search) || i.supplier?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getPatientName = (pid: string | null) => patients.find(p => p.id === pid)?.full_name || "—";
  const getItemName = (iid: string) => items.find(i => i.id === iid)?.name || "—";
  const getCatLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val;

  const totalValue = items.reduce((s, i) => s + Number(i.quantity) * Number(i.sell_price || i.purchase_price || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">📦 Materiallar va Ombor</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi material</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Jami materiallar", value: items.length, color: "text-foreground", icon: Package },
          { label: "Kam qolgan", value: lowStock.length, color: "text-yellow-600", icon: AlertTriangle },
          { label: "Tugagan", value: outOfStock.length, color: "text-red-600", icon: TrendingDown },
          { label: "Muddati yaqin", value: expiringSoon.length, color: "text-orange-600", icon: Clock },
          { label: "Ombor qiymati", value: `${(totalValue / 1000).toFixed(0)}K`, color: "text-primary", icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-4">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Kam qolgan: {lowStock.map(i => i.name).join(", ")}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { id: "list" as const, label: "📦 Materiallar" },
          { id: "usage" as const, label: "📊 Sarf tarixi" },
          { id: "suppliers" as const, label: "🚚 Ta'minotchilar" },
        ]).map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>{t.label}</Button>
        ))}
      </div>

      {tab === "list" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Material qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {[
                { id: "all", label: "Barchasi" }, { id: "ok", label: "Yetarli" },
                { id: "low", label: "Kam" }, { id: "out", label: "Tugagan" }, { id: "expiring", label: "Muddati" }
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">{editItem ? "Tahrirlash" : "Yangi material"}</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Nomi *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <Input placeholder="SKU / Kod" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                <Input placeholder="Birlik (dona, ml...)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                <Input type="number" placeholder="Miqdor *" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                <Input type="number" placeholder="Min miqdor" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} />
                <Input type="number" placeholder="Sotib olish narxi" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
                <Input type="number" placeholder="Sotish narxi" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} />
                <Input placeholder="Yetkazuvchi" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                <Input placeholder="Partiya №" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} />
                <Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                <Input placeholder="Joylashuv" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <Input className="mt-3" placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSave}>{editItem ? "Saqlash" : "Qo'shish"}</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          {/* Use Stock Modal */}
          {showUsageForm && (
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-5 mb-6">
              <h3 className="font-heading font-bold text-foreground mb-3">📉 {showUsageForm.name} — ishlatish</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input type="number" placeholder="Miqdor" value={usageForm.quantity_used} onChange={e => setUsageForm({ ...usageForm, quantity_used: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={usageForm.patient_id} onChange={e => setUsageForm({ ...usageForm, patient_id: e.target.value })}>
                  <option value="">Bemor (ixtiyoriy)</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <Input placeholder="Shifokor" value={usageForm.doctor_name} onChange={e => setUsageForm({ ...usageForm, doctor_name: e.target.value })} />
                <Input placeholder="Davolash turi" value={usageForm.treatment_type} onChange={e => setUsageForm({ ...usageForm, treatment_type: e.target.value })} />
                <Input placeholder="Izoh" value={usageForm.notes} onChange={e => setUsageForm({ ...usageForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleUseStock}>Ishlatish</Button>
                <Button size="sm" variant="outline" onClick={() => setShowUsageForm(null)}>Bekor</Button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2">
            {filtered.map(item => {
              const isLow = Number(item.quantity) <= Number(item.min_quantity) && Number(item.quantity) > 0;
              const isOut = Number(item.quantity) <= 0;
              return (
                <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isOut ? "bg-red-100 dark:bg-red-950/30" : isLow ? "bg-yellow-100 dark:bg-yellow-950/30" : "bg-primary/10")}>
                      <Package className={cn("w-5 h-5", isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-primary")} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{item.name} {item.sku && <span className="text-xs text-muted-foreground">({item.sku})</span>}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCatLabel(item.category)} • {item.supplier || "—"} • {item.location || "—"}
                        {item.expiry_date ? ` • Muddat: ${item.expiry_date}` : ""}
                        {item.batch_number ? ` • Partiya: ${item.batch_number}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn("font-bold text-sm", isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-foreground")}>{item.quantity} {item.unit}</p>
                      {Number(item.sell_price) > 0 && <p className="text-xs text-muted-foreground">{Number(item.sell_price).toLocaleString()} so'm</p>}
                    </div>
                    <Badge className={cn("text-[10px]", isOut ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" : isLow ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400" : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400")}>
                      {isOut ? "Tugagan" : isLow ? "Kam" : "Yetarli"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => { setShowUsageForm(item); setUsageForm({ patient_id: "", doctor_name: "", quantity_used: "1", treatment_type: "", notes: "" }); }}>
                      <TrendingDown className="w-3 h-3 mr-1" /> Ishlatish
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(item)}><Edit2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Materiallar topilmadi</p>}
          </div>
        </>
      )}

      {tab === "usage" && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground">📊 Sarf tarixi</h3>
          {usageLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Sarf tarixi yo'q</p>
          ) : usageLogs.map(log => (
            <div key={log.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <TrendingDown className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{getItemName(log.inventory_id)} — {log.quantity_used} {log.treatment_type ? `(${log.treatment_type})` : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {log.doctor_name || "—"} • {getPatientName(log.patient_id)} • {log.created_at?.split("T")[0]}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "suppliers" && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground">🚚 Ta'minotchilar</h3>
          {(() => {
            const suppliers = [...new Set(items.map(i => i.supplier).filter(Boolean))];
            if (suppliers.length === 0) return <p className="text-center py-8 text-muted-foreground">Ta'minotchilar topilmadi</p>;
            return suppliers.map(sup => {
              const supItems = items.filter(i => i.supplier === sup);
              return (
                <div key={sup} className="bg-card rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">{sup}</p>
                  <p className="text-xs text-muted-foreground">{supItems.length} ta material</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {supItems.map(i => <Badge key={i.id} variant="outline" className="text-xs">{i.name}</Badge>)}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

export default DentalInventory;
