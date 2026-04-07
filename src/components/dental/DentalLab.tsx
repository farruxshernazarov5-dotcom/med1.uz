import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Plus, FlaskConical, Search, X, Eye, Clock, CheckCircle, Truck, Play, Send, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalLabProps {
  patients: any[];
  clinicId: string;
}

const WORK_TYPES = [
  { value: "crown", label: "👑 Koronka (Crown)" },
  { value: "bridge", label: "🌉 Ko'prik (Bridge)" },
  { value: "denture", label: "🦷 Protez (Denture)" },
  { value: "veneer", label: "✨ Vinir (Veneer)" },
  { value: "impression", label: "📐 Tish qolipi (Impression)" },
  { value: "implant_abutment", label: "🔩 Implant Abutment" },
  { value: "xray", label: "🩻 Rentgen (X-ray)" },
  { value: "cbct", label: "📷 3D CBCT" },
  { value: "whitening_analysis", label: "🦷 Oqartirish tahlili" },
  { value: "other", label: "📋 Boshqa" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Kutilmoqda", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30", icon: Clock },
  in_progress: { label: "Jarayonda", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", icon: Play },
  ready: { label: "Tayyor", color: "text-green-600 bg-green-50 dark:bg-green-950/30", icon: CheckCircle },
  delivered: { label: "Yetkazilgan", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30", icon: Truck },
};

const DentalLab = ({ patients, clinicId }: DentalLabProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [mainTab, setMainTab] = useState("dashboard");

  const [form, setForm] = useState({
    patient_id: "", tooth_number: "", work_type: "", doctor_name: "",
    technician_name: "", notes: "", price: "", external_lab: "", due_date: "",
  });

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("dental_lab_orders")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [clinicId]);

  const getPatientName = (pid: string) => patients.find(p => p.id === pid)?.full_name || "Noma'lum";

  const handleCreate = async () => {
    if (!form.patient_id || !form.work_type) {
      toast({ title: "Bemor va ish turini tanlang", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("dental_lab_orders").insert({
      clinic_id: clinicId,
      patient_id: form.patient_id,
      tooth_number: form.tooth_number ? parseInt(form.tooth_number) : null,
      work_type: form.work_type,
      doctor_name: form.doctor_name || null,
      technician_name: form.technician_name || null,
      notes: form.notes || null,
      price: form.price ? parseFloat(form.price) : 0,
      external_lab: form.external_lab || null,
      due_date: form.due_date || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ action: "create", entity_type: "dental_lab_order", module: "dental", details: { work_type: form.work_type } });
    toast({ title: "Lab buyurtma yaratildi ✅" });
    setForm({ patient_id: "", tooth_number: "", work_type: "", doctor_name: "", technician_name: "", notes: "", price: "", external_lab: "", due_date: "" });
    setShowAdd(false);
    fetchOrders();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "ready" || status === "delivered") updates.completed_at = new Date().toISOString();
    await supabase.from("dental_lab_orders").update(updates).eq("id", id);
    await writeAuditLog({ action: "update", entity_type: "dental_lab_order", module: "dental", entity_id: id, details: { status } });
    toast({ title: `Status: ${STATUS_CONFIG[status]?.label}` });
    fetchOrders();
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, ...updates });
  };

  const filtered = orders.filter(o => {
    const matchSearch = getPatientName(o.patient_id).toLowerCase().includes(search.toLowerCase()) || o.work_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = (s: string) => orders.filter(o => o.status === s).length;

  if (selectedOrder) {
    const cfg = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}><X className="w-4 h-4 mr-1" /> Orqaga</Button>
          <h2 className="font-heading text-xl font-bold text-foreground">🧪 Buyurtma tafsiloti</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-bold text-foreground">{getPatientName(selectedOrder.patient_id)}</p>
              <p className="text-sm text-muted-foreground">
                {WORK_TYPES.find(w => w.value === selectedOrder.work_type)?.label || selectedOrder.work_type}
                {selectedOrder.tooth_number && ` • Tish #${selectedOrder.tooth_number}`}
              </p>
            </div>
            <Badge className={cfg.color}>{cfg.label}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Shifokor:</span> <span className="text-foreground font-medium">{selectedOrder.doctor_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Texnik:</span> <span className="text-foreground font-medium">{selectedOrder.technician_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Narx:</span> <span className="text-foreground font-medium">{selectedOrder.price ? `${Number(selectedOrder.price).toLocaleString()} so'm` : "—"}</span></div>
            <div><span className="text-muted-foreground">Tashqi lab:</span> <span className="text-foreground font-medium">{selectedOrder.external_lab || "Ichki"}</span></div>
            <div><span className="text-muted-foreground">Muddat:</span> <span className="text-foreground font-medium">{selectedOrder.due_date || "—"}</span></div>
            <div><span className="text-muted-foreground">Yaratilgan:</span> <span className="text-foreground font-medium">{selectedOrder.created_at?.split("T")[0]}</span></div>
          </div>
          {selectedOrder.notes && <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground">📝 {selectedOrder.notes}</div>}
          <div className="flex gap-2 flex-wrap pt-2">
            {selectedOrder.status === "pending" && <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "in_progress")}><Play className="w-3 h-3 mr-1" /> Boshlash</Button>}
            {selectedOrder.status === "in_progress" && <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "ready")}><CheckCircle className="w-3 h-3 mr-1" /> Tayyor</Button>}
            {selectedOrder.status === "ready" && <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "delivered")}><Truck className="w-3 h-3 mr-1" /> Yetkazildi</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">🧪 Dental Laboratoriya</h2>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-1" /> Buyurtma</Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi lab buyurtma</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
              <SelectTrigger><SelectValue placeholder="👤 Bemor tanlang" /></SelectTrigger>
              <SelectContent>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name} • {p.phone}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.work_type} onValueChange={v => setForm({ ...form, work_type: v })}>
              <SelectTrigger><SelectValue placeholder="🦷 Ish turi" /></SelectTrigger>
              <SelectContent>
                {WORK_TYPES.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Tish raqami (11-48)" type="number" value={form.tooth_number} onChange={e => setForm({ ...form, tooth_number: e.target.value })} />
            <Input placeholder="Shifokor ismi" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} />
            <Input placeholder="Texnik ismi" value={form.technician_name} onChange={e => setForm({ ...form, technician_name: e.target.value })} />
            <Input placeholder="Narx (so'm)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            <Input placeholder="Tashqi laboratoriya" value={form.external_lab} onChange={e => setForm({ ...form, external_lab: e.target.value })} />
            <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <Input placeholder="Izoh / ko'rsatmalar" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Saqlash</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className={cn("bg-card rounded-2xl border border-border p-5 text-center cursor-pointer transition-shadow hover:shadow-md", statusFilter === key && "ring-2 ring-primary")} onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}>
            <cfg.icon className={cn("w-6 h-6 mx-auto mb-1", cfg.color.split(" ")[0])} />
            <p className={cn("text-2xl font-bold", cfg.color.split(" ")[0])}>{countByStatus(key)}</p>
            <p className="text-xs text-muted-foreground">{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Bemor yoki ish turi qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Laboratoriya buyurtmalari topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={order.id} className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(order)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.color)}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{getPatientName(order.patient_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {WORK_TYPES.find(w => w.value === order.work_type)?.label || order.work_type}
                        {order.tooth_number && ` • Tish #${order.tooth_number}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                    {order.price > 0 && <p className="text-xs text-muted-foreground mt-1">{Number(order.price).toLocaleString()} so'm</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DentalLab;
