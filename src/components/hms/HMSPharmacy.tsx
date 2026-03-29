import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Pill, FileText, Search, X, Edit2, Trash2, AlertTriangle,
  ShoppingCart, TrendingUp, Package, BarChart3, DollarSign, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props { clinicId: string; }

const DRUG_CATEGORIES = [
  "Antibiotik", "Analgezik", "Antivirus", "Vitamin", "Gormon",
  "Kardio", "Gastro", "Dermatologik", "Psixotrop", "Boshqa"
];

const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#a855f7"];

const HMSPharmacy = ({ clinicId }: Props) => {
  const [stock, setStock] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [stockForm, setStockForm] = useState({ drug_name: "", category: "", manufacturer: "", batch_number: "", quantity: 0, unit: "dona", buy_price: 0, sell_price: 0, expire_date: "" });
  const [showRxForm, setShowRxForm] = useState(false);
  const [rxForm, setRxForm] = useState({ patient_id: "", diagnosis: "", notes: "" });
  const [rxItems, setRxItems] = useState<Array<{ drug_name: string; dosage: string; frequency: string; duration: string; quantity: number }>>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleItems, setSaleItems] = useState<Array<{ drug_id: string; quantity: number }>>([]);

  const fetchData = async () => {
    const [stockRes, rxRes, patRes] = await Promise.all([
      supabase.from("hms_pharmacy_stock").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("drug_name"),
      supabase.from("hms_prescriptions").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setStock(stockRes.data || []);
    setPrescriptions(rxRes.data || []);
    setPatients(patRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const handleSaveStock = async () => {
    if (!stockForm.drug_name) { toast({ title: "Dori nomi majburiy!", variant: "destructive" }); return; }
    const payload = { ...stockForm, quantity: Number(stockForm.quantity), buy_price: Number(stockForm.buy_price), sell_price: Number(stockForm.sell_price), clinic_id: clinicId };
    if (editingStock) {
      await supabase.from("hms_pharmacy_stock").update(payload).eq("id", editingStock.id);
      toast({ title: "✅ Dori yangilandi" });
    } else {
      await supabase.from("hms_pharmacy_stock").insert(payload);
      toast({ title: "✅ Dori qo'shildi" });
    }
    setShowStockForm(false); setEditingStock(null);
    setStockForm({ drug_name: "", category: "", manufacturer: "", batch_number: "", quantity: 0, unit: "dona", buy_price: 0, sell_price: 0, expire_date: "" });
    fetchData();
  };

  const handleDeleteStock = async (id: string) => {
    await supabase.from("hms_pharmacy_stock").update({ is_active: false }).eq("id", id);
    toast({ title: "Dori o'chirildi" }); fetchData();
  };

  const handleCreatePrescription = async () => {
    if (!rxForm.patient_id || rxItems.length === 0) {
      toast({ title: "Bemor va kamida 1 ta dori majburiy!", variant: "destructive" }); return;
    }
    const { data: rx } = await supabase.from("hms_prescriptions").insert({ ...rxForm, clinic_id: clinicId }).select().single();
    if (rx) {
      await supabase.from("hms_prescription_items").insert(rxItems.map((item) => ({ ...item, prescription_id: rx.id })));
    }
    toast({ title: "✅ Retsept yaratildi" });
    setShowRxForm(false); setRxForm({ patient_id: "", diagnosis: "", notes: "" }); setRxItems([]);
    fetchData();
  };

  const addRxItem = () => setRxItems([...rxItems, { drug_name: "", dosage: "", frequency: "", duration: "", quantity: 1 }]);
  const updateRxItem = (i: number, field: string, value: any) => { const items = [...rxItems]; (items[i] as any)[field] = value; setRxItems(items); };
  const removeRxItem = (i: number) => setRxItems(rxItems.filter((_, j) => j !== i));
  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.full_name || "—";

  const filteredStock = useMemo(() => stock.filter(s => {
    const matchSearch = s.drug_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || s.category === filterCategory;
    return matchSearch && matchCat;
  }), [stock, search, filterCategory]);

  const lowStock = stock.filter(s => s.quantity <= 5);
  const expiringSoon = stock.filter(s => {
    if (!s.expire_date) return false;
    const diff = (new Date(s.expire_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  });

  const totalValue = stock.reduce((s, d) => s + (d.quantity * d.sell_price), 0);
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    stock.forEach(s => { map[s.category || "Boshqa"] = (map[s.category || "Boshqa"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [stock]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Dorixona boshqaruvi</h2>
        <Button size="sm" onClick={() => { setShowStockForm(true); setEditingStock(null); setActiveTab("stock"); }}>
          <Plus className="w-4 h-4 mr-1" /> Yangi dori
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard"><BarChart3 className="w-3.5 h-3.5 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="stock"><Pill className="w-3.5 h-3.5 mr-1" />Dorilar</TabsTrigger>
          <TabsTrigger value="prescriptions"><FileText className="w-3.5 h-3.5 mr-1" />Retseptlar</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Ogohlantirishlar</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Jami dorilar", value: stock.length, icon: Pill, color: "text-primary" },
              { label: "Kam qolgan", value: lowStock.length, icon: AlertTriangle, color: "text-red-500" },
              { label: "Muddati tugayapti", value: expiringSoon.length, icon: AlertTriangle, color: "text-yellow-500" },
              { label: "Ombor qiymati", value: `${(totalValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: "text-green-500" },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={cn("w-4 h-4", s.color)} />
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Kategoriya bo'yicha</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">So'nggi retseptlar</h3>
              <div className="space-y-2">
                {prescriptions.slice(0, 5).map(rx => (
                  <div key={rx.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{getPatientName(rx.patient_id)}</span>
                    <Badge className={cn("text-[10px]", rx.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground")}>
                      {rx.status === "active" ? "Faol" : "Yakunlangan"}
                    </Badge>
                  </div>
                ))}
                {prescriptions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Retseptlar yo'q</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* STOCK */}
        <TabsContent value="stock">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Dori qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Barcha kategoriya</option>
              {DRUG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {showStockForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground text-sm">{editingStock ? "Tahrirlash" : "Yangi dori qo'shish"}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowStockForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Dori nomi *" value={stockForm.drug_name} onChange={(e) => setStockForm({ ...stockForm, drug_name: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={stockForm.category} onChange={e => setStockForm({ ...stockForm, category: e.target.value })}>
                  <option value="">Kategoriya</option>
                  {DRUG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input placeholder="Ishlab chiqaruvchi" value={stockForm.manufacturer} onChange={(e) => setStockForm({ ...stockForm, manufacturer: e.target.value })} />
                <Input placeholder="Partiya raqami" value={stockForm.batch_number} onChange={(e) => setStockForm({ ...stockForm, batch_number: e.target.value })} />
                <Input type="number" placeholder="Miqdor" value={stockForm.quantity || ""} onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })} />
                <Input placeholder="Birlik" value={stockForm.unit} onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })} />
                <Input type="number" placeholder="Olib olish narxi" value={stockForm.buy_price || ""} onChange={(e) => setStockForm({ ...stockForm, buy_price: Number(e.target.value) })} />
                <Input type="number" placeholder="Sotish narxi" value={stockForm.sell_price || ""} onChange={(e) => setStockForm({ ...stockForm, sell_price: Number(e.target.value) })} />
                <Input type="date" placeholder="Yaroqlilik muddati" value={stockForm.expire_date} onChange={(e) => setStockForm({ ...stockForm, expire_date: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSaveStock}>{editingStock ? "Yangilash" : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowStockForm(false)}>Bekor</Button>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-2">Jami: {filteredStock.length} dori</p>
          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Dori nomi</TableHead>
                  <TableHead className="text-xs">Kategoriya</TableHead>
                  <TableHead className="text-xs">Miqdor</TableHead>
                  <TableHead className="text-xs">Narx</TableHead>
                  <TableHead className="text-xs">Yaroqlilik</TableHead>
                  <TableHead className="text-xs">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map(s => {
                  const isLow = s.quantity <= 5;
                  const isExpiring = s.expire_date && (new Date(s.expire_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 30;
                  return (
                    <TableRow key={s.id} className={isLow ? "bg-red-50/50 dark:bg-red-900/10" : isExpiring ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}>
                      <TableCell className="text-xs">
                        <span className="font-medium text-foreground">{s.drug_name}</span>
                        {s.manufacturer && <span className="text-muted-foreground ml-1">({s.manufacturer})</span>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.category || "—"}</Badge></TableCell>
                      <TableCell className={cn("text-xs font-medium", isLow ? "text-red-600" : "text-foreground")}>
                        {s.quantity} {s.unit}
                        {isLow && <AlertTriangle className="w-3 h-3 inline ml-1 text-red-500" />}
                      </TableCell>
                      <TableCell className="text-xs text-primary font-medium">{s.sell_price > 0 ? `${Number(s.sell_price).toLocaleString()} so'm` : "—"}</TableCell>
                      <TableCell className={cn("text-xs", isExpiring ? "text-yellow-600 font-medium" : "text-muted-foreground")}>{s.expire_date || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingStock(s); setStockForm({ drug_name: s.drug_name, category: s.category || "", manufacturer: s.manufacturer || "", batch_number: s.batch_number || "", quantity: s.quantity, unit: s.unit, buy_price: s.buy_price, sell_price: s.sell_price, expire_date: s.expire_date || "" }); setShowStockForm(true); }}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteStock(s.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredStock.length === 0 && <p className="text-center py-8 text-muted-foreground">Dorilar topilmadi</p>}
        </TabsContent>

        {/* PRESCRIPTIONS */}
        <TabsContent value="prescriptions">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Retseptlar ({prescriptions.length})</h3>
            <Button size="sm" onClick={() => { setShowRxForm(true); setRxItems([]); }}>
              <Plus className="w-4 h-4 mr-1" /> Yangi retsept
            </Button>
          </div>

          {showRxForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={rxForm.patient_id} onChange={(e) => setRxForm({ ...rxForm, patient_id: e.target.value })}>
                  <option value="">Bemorni tanlang *</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <Input placeholder="Tashxis" value={rxForm.diagnosis} onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })} />
                <Input placeholder="Izoh" value={rxForm.notes} onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })} />
              </div>

              <h4 className="text-sm font-medium text-foreground mb-2">Dorilar</h4>
              {rxItems.map((item, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
                  <Input placeholder="Dori nomi *" value={item.drug_name} onChange={(e) => updateRxItem(i, "drug_name", e.target.value)} className="text-xs" />
                  <Input placeholder="Dozasi" value={item.dosage} onChange={(e) => updateRxItem(i, "dosage", e.target.value)} className="text-xs" />
                  <Input placeholder="Chastotasi" value={item.frequency} onChange={(e) => updateRxItem(i, "frequency", e.target.value)} className="text-xs" />
                  <Input placeholder="Davomiyligi" value={item.duration} onChange={(e) => updateRxItem(i, "duration", e.target.value)} className="text-xs" />
                  <Input type="number" placeholder="Soni" value={item.quantity} onChange={(e) => updateRxItem(i, "quantity", Number(e.target.value))} className="text-xs" />
                  <Button variant="ghost" size="icon" onClick={() => removeRxItem(i)}><X className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRxItem} className="mb-3">
                <Plus className="w-3 h-3 mr-1" /> Dori qo'shish
              </Button>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreatePrescription}>Retsept yaratish</Button>
                <Button size="sm" variant="outline" onClick={() => setShowRxForm(false)}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">Bemor: {getPatientName(rx.patient_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {rx.diagnosis && `Tashxis: ${rx.diagnosis} • `}{new Date(rx.created_at).toLocaleDateString("uz")}
                    </p>
                  </div>
                  <Badge className={cn("text-[10px]", rx.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground")}>
                    {rx.status === "active" ? "Faol" : "Yakunlangan"}
                  </Badge>
                </div>
              </div>
            ))}
            {prescriptions.length === 0 && <p className="text-center py-8 text-muted-foreground">Retseptlar yo'q</p>}
          </div>
        </TabsContent>

        {/* ALERTS */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            {lowStock.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Kam qolgan dorilar ({lowStock.length})
                </h3>
                <div className="space-y-2">
                  {lowStock.map(s => (
                    <div key={s.id} className="bg-card rounded-xl border border-red-200 dark:border-red-900/50 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.drug_name}</p>
                        <p className="text-xs text-muted-foreground">{s.manufacturer}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{s.quantity} {s.unit} qoldi</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Muddati tugayotgan ({expiringSoon.length})
                </h3>
                <div className="space-y-2">
                  {expiringSoon.map(s => (
                    <div key={s.id} className="bg-card rounded-xl border border-yellow-200 dark:border-yellow-900/50 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.drug_name}</p>
                        <p className="text-xs text-muted-foreground">{s.manufacturer}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{s.expire_date}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lowStock.length === 0 && expiringSoon.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">Barcha dorilar yetarli miqdorda va muddati o'tmagan ✅</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSPharmacy;
