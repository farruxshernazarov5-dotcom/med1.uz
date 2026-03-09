import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pill, FileText, Search, X, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Props {
  clinicId: string;
}

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
    setShowStockForm(false);
    setEditingStock(null);
    setStockForm({ drug_name: "", category: "", manufacturer: "", batch_number: "", quantity: 0, unit: "dona", buy_price: 0, sell_price: 0, expire_date: "" });
    fetchData();
  };

  const handleDeleteStock = async (id: string) => {
    await supabase.from("hms_pharmacy_stock").update({ is_active: false }).eq("id", id);
    toast({ title: "Dori o'chirildi" });
    fetchData();
  };

  const handleCreatePrescription = async () => {
    if (!rxForm.patient_id || rxItems.length === 0) {
      toast({ title: "Bemor va kamida 1 ta dori majburiy!", variant: "destructive" });
      return;
    }
    const { data: rx } = await supabase.from("hms_prescriptions").insert({ ...rxForm, clinic_id: clinicId }).select().single();
    if (rx) {
      await supabase.from("hms_prescription_items").insert(rxItems.map((item) => ({ ...item, prescription_id: rx.id })));
    }
    toast({ title: "✅ Retsept yaratildi" });
    setShowRxForm(false);
    setRxForm({ patient_id: "", diagnosis: "", notes: "" });
    setRxItems([]);
    fetchData();
  };

  const addRxItem = () => {
    setRxItems([...rxItems, { drug_name: "", dosage: "", frequency: "", duration: "", quantity: 1 }]);
  };

  const updateRxItem = (i: number, field: string, value: any) => {
    const items = [...rxItems];
    (items[i] as any)[field] = value;
    setRxItems(items);
  };

  const removeRxItem = (i: number) => {
    setRxItems(rxItems.filter((_, j) => j !== i));
  };

  const filteredStock = stock.filter((s) => s.drug_name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = stock.filter((s) => s.quantity <= 5);
  const expiringSoon = stock.filter((s) => {
    if (!s.expire_date) return false;
    const diff = (new Date(s.expire_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  });

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.full_name || "—";

  return (
    <div>
      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-sm mb-6">
          <TabsTrigger value="stock"><Pill className="w-4 h-4 mr-1" /> Dorixona</TabsTrigger>
          <TabsTrigger value="prescriptions"><FileText className="w-4 h-4 mr-1" /> Retseptlar</TabsTrigger>
        </TabsList>

        {/* Stock */}
        <TabsContent value="stock">
          {/* Warnings */}
          {(lowStock.length > 0 || expiringSoon.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {lowStock.length > 0 && (
                <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> {lowStock.length} ta dori kam qolgan</Badge>
              )}
              {expiringSoon.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" /> {expiringSoon.length} ta dori muddati tugayapti</Badge>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Dori qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => { setShowStockForm(true); setEditingStock(null); setStockForm({ drug_name: "", category: "", manufacturer: "", batch_number: "", quantity: 0, unit: "dona", buy_price: 0, sell_price: 0, expire_date: "" }); }}>
              <Plus className="w-4 h-4 mr-1" /> Yangi dori
            </Button>
          </div>

          {showStockForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Dori nomi *" value={stockForm.drug_name} onChange={(e) => setStockForm({ ...stockForm, drug_name: e.target.value })} />
                <Input placeholder="Kategoriya" value={stockForm.category} onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })} />
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

          <div className="space-y-2">
            {filteredStock.map((s) => {
              const isLow = s.quantity <= 5;
              const isExpiring = s.expire_date && (new Date(s.expire_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 30;
              return (
                <div key={s.id} className={cn("bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3", isLow ? "border-red-300" : isExpiring ? "border-yellow-300" : "border-border")}>
                  <Pill className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{s.drug_name}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {s.manufacturer && <span>{s.manufacturer}</span>}
                      {s.category && <Badge variant="outline" className="text-[10px]">{s.category}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={cn("font-medium", isLow ? "text-red-600" : "text-foreground")}>{s.quantity} {s.unit}</span>
                    {s.sell_price > 0 && <span className="text-primary">{Number(s.sell_price).toLocaleString()} so'm</span>}
                    {s.expire_date && <span className={cn(isExpiring ? "text-yellow-600" : "text-muted-foreground")}>{s.expire_date}</span>}
                    <Button variant="ghost" size="icon" onClick={() => { setEditingStock(s); setStockForm({ drug_name: s.drug_name, category: s.category || "", manufacturer: s.manufacturer || "", batch_number: s.batch_number || "", quantity: s.quantity, unit: s.unit, buy_price: s.buy_price, sell_price: s.sell_price, expire_date: s.expire_date || "" }); setShowStockForm(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteStock(s.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredStock.length === 0 && <p className="text-center py-8 text-muted-foreground">Dorilar topilmadi</p>}
          </div>
        </TabsContent>

        {/* Prescriptions */}
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
                      {rx.diagnosis && `Tashxis: ${rx.diagnosis} • `}
                      {new Date(rx.created_at).toLocaleDateString("uz")}
                    </p>
                  </div>
                  <Badge className={cn("text-[10px]", rx.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>
                    {rx.status === "active" ? "Faol" : "Yakunlangan"}
                  </Badge>
                </div>
              </div>
            ))}
            {prescriptions.length === 0 && <p className="text-center py-8 text-muted-foreground">Retseptlar yo'q</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSPharmacy;
