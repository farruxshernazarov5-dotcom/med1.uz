import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Settings, AlertTriangle, CheckCircle, Wrench, Plus, Search, X, Calendar, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalEquipmentProps {
  clinicId: string;
}

const TYPES = ["Dental Unit", "Rentgen", "Sterilizator", "Kompresor", "Skaleri", "Laser", "3D Skaner", "Boshqa"];
const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  active: { label: "Faol", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  maintenance: { label: "Texnik xizmat", icon: Wrench, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  repair: { label: "Ta'mirda", icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
  inactive: { label: "Nofaol", icon: Settings, color: "text-muted-foreground bg-muted" },
};

const DentalEquipment = ({ clinicId }: DentalEquipmentProps) => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showMaint, setShowMaint] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({ name: "", type: "Boshqa", model: "", serial_number: "", room: "", purchase_date: "", warranty_end: "", purchase_price: "", notes: "" });
  const [maintForm, setMaintForm] = useState({ service_type: "routine", notes: "", cost: "", technician_name: "", next_service_date: "" });

  const fetchData = async () => {
    const [eqRes, maintRes] = await Promise.all([
      supabase.from("dental_equipment").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("dental_equipment_maintenance").select("*").eq("clinic_id", clinicId).order("service_date", { ascending: false }),
    ]);
    setEquipment(eqRes.data || []);
    setMaintenance(maintRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const handleAdd = async () => {
    if (!form.name) { toast({ title: "Jihoz nomini kiriting", variant: "destructive" }); return; }
    const { error } = await supabase.from("dental_equipment").insert({
      clinic_id: clinicId, name: form.name, type: form.type, model: form.model || null,
      serial_number: form.serial_number || null, room: form.room || null,
      purchase_date: form.purchase_date || null, warranty_end: form.warranty_end || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      notes: form.notes || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ action: "create", entity_type: "dental_equipment", module: "dental", details: { name: form.name } });
    toast({ title: "Jihoz qo'shildi ✅" });
    setForm({ name: "", type: "Boshqa", model: "", serial_number: "", room: "", purchase_date: "", warranty_end: "", purchase_price: "", notes: "" });
    setShowAdd(false);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("dental_equipment").update({ status } as any).eq("id", id);
    await writeAuditLog({ action: "update", entity_type: "dental_equipment", module: "dental", entity_id: id, details: { status } });
    toast({ title: `Status: ${STATUS_MAP[status]?.label}` });
    fetchData();
  };

  const addMaintenance = async (equipmentId: string) => {
    const { error } = await supabase.from("dental_equipment_maintenance").insert({
      equipment_id: equipmentId, clinic_id: clinicId,
      service_type: maintForm.service_type, notes: maintForm.notes || null,
      cost: maintForm.cost ? parseFloat(maintForm.cost) : 0,
      technician_name: maintForm.technician_name || null,
      next_service_date: maintForm.next_service_date || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ action: "create", entity_type: "dental_equipment_maintenance", module: "dental" });
    toast({ title: "Texnik xizmat qayd etildi ✅" });
    setMaintForm({ service_type: "routine", notes: "", cost: "", technician_name: "", next_service_date: "" });
    setShowMaint(null);
    fetchData();
  };

  const filtered = equipment.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) || e.room?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || e.status === filter;
    return matchSearch && matchFilter;
  });

  const needsService = equipment.filter(e => {
    const eqMaint = maintenance.filter(m => m.equipment_id === e.id);
    if (eqMaint.length === 0) return false;
    const latest = eqMaint[0];
    if (!latest.next_service_date) return false;
    return new Date(latest.next_service_date) <= new Date(Date.now() + 30 * 86400000);
  });

  const warrantyExpiring = equipment.filter(e => {
    if (!e.warranty_end) return false;
    return new Date(e.warranty_end) <= new Date(Date.now() + 60 * 86400000);
  });

  // Detail view
  if (selected) {
    const cfg = STATUS_MAP[selected.status] || STATUS_MAP.active;
    const eqMaint = maintenance.filter(m => m.equipment_id === selected.id);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><X className="w-4 h-4 mr-1" /> Orqaga</Button>
          <h2 className="font-heading text-xl font-bold text-foreground">🔧 {selected.name}</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">{selected.type} • {selected.room || "Xona ko'rsatilmagan"}</p>
              {selected.model && <p className="text-sm text-muted-foreground">Model: {selected.model}</p>}
              {selected.serial_number && <p className="text-sm text-muted-foreground">S/N: {selected.serial_number}</p>}
            </div>
            <Badge className={cfg.color}>{cfg.label}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Sotib olingan:</span> <span className="text-foreground font-medium">{selected.purchase_date || "—"}</span></div>
            <div><span className="text-muted-foreground">Kafolat:</span> <span className="text-foreground font-medium">{selected.warranty_end || "—"}</span></div>
            <div><span className="text-muted-foreground">Narx:</span> <span className="text-foreground font-medium">{selected.purchase_price ? `${Number(selected.purchase_price).toLocaleString()} so'm` : "—"}</span></div>
          </div>
          {selected.notes && <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground">📝 {selected.notes}</div>}

          {/* Status change */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STATUS_MAP).filter(([k]) => k !== selected.status).map(([k, v]) => (
              <Button key={k} size="sm" variant="outline" onClick={() => { updateStatus(selected.id, k); setSelected({ ...selected, status: k }); }}>
                <v.icon className="w-3 h-3 mr-1" /> {v.label}
              </Button>
            ))}
          </div>

          {/* Add maintenance */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-foreground">Texnik xizmat tarixi</h3>
              <Button size="sm" onClick={() => setShowMaint(showMaint === selected.id ? null : selected.id)}><Plus className="w-3 h-3 mr-1" /> Xizmat qo'shish</Button>
            </div>
            {showMaint === selected.id && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select value={maintForm.service_type} onValueChange={v => setMaintForm({ ...maintForm, service_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Rejadagi xizmat</SelectItem>
                      <SelectItem value="repair">Ta'mirlash</SelectItem>
                      <SelectItem value="calibration">Kalibrlash</SelectItem>
                      <SelectItem value="inspection">Tekshiruv</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Texnik ismi" value={maintForm.technician_name} onChange={e => setMaintForm({ ...maintForm, technician_name: e.target.value })} />
                  <Input placeholder="Xarajat (so'm)" type="number" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })} />
                  <Input type="date" placeholder="Keyingi xizmat" value={maintForm.next_service_date} onChange={e => setMaintForm({ ...maintForm, next_service_date: e.target.value })} />
                </div>
                <Input placeholder="Izoh" value={maintForm.notes} onChange={e => setMaintForm({ ...maintForm, notes: e.target.value })} />
                <Button size="sm" onClick={() => addMaintenance(selected.id)}>Saqlash</Button>
              </div>
            )}
            {eqMaint.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Xizmat tarixi yo'q</p>
            ) : eqMaint.map(m => (
              <div key={m.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.service_type === "routine" ? "🔧 Rejadagi" : m.service_type === "repair" ? "🛠 Ta'mirlash" : m.service_type === "calibration" ? "📐 Kalibrlash" : "🔍 Tekshiruv"}</p>
                  <p className="text-xs text-muted-foreground">{m.service_date} {m.technician_name && `• ${m.technician_name}`}</p>
                  {m.notes && <p className="text-xs text-muted-foreground mt-0.5">{m.notes}</p>}
                </div>
                <div className="text-right">
                  {m.cost > 0 && <p className="text-sm font-bold text-foreground">{Number(m.cost).toLocaleString()} so'm</p>}
                  {m.next_service_date && <p className="text-xs text-muted-foreground">Keyingi: {m.next_service_date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">🔧 Jihozlar boshqaruvi</h2>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-1" /> Jihoz qo'shish</Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi jihoz</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Jihoz nomi *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            <Input placeholder="Seriya raqami" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
            <Input placeholder="Xona / Kabinet" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
            <Input placeholder="Narx (so'm)" type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
            <div><label className="text-xs text-muted-foreground">Sotib olingan sana</label><Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Kafolat tugashi</label><Input type="date" value={form.warranty_end} onChange={e => setForm({ ...form, warranty_end: e.target.value })} /></div>
          </div>
          <Input placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Saqlash</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_MAP).map(([key, cfg]) => {
          const count = equipment.filter(e => e.status === key).length;
          return (
            <div key={key} className={cn("bg-card rounded-2xl border border-border p-4 text-center cursor-pointer hover:shadow-md transition-shadow", filter === key && "ring-2 ring-primary")} onClick={() => setFilter(filter === key ? "all" : key)}>
              <cfg.icon className={cn("w-5 h-5 mx-auto mb-1", cfg.color.split(" ")[0])} />
              <p className={cn("text-2xl font-bold", cfg.color.split(" ")[0])}>{count}</p>
              <p className="text-xs text-muted-foreground">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {(needsService.length > 0 || warrantyExpiring.length > 0) && (
        <div className="space-y-3">
          {needsService.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl border border-yellow-200 dark:border-yellow-900 p-4">
              <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-yellow-600" /><p className="font-semibold text-yellow-800 dark:text-yellow-400">Texnik xizmat yaqinlashmoqda</p></div>
              {needsService.map(e => <p key={e.id} className="text-sm text-yellow-700 dark:text-yellow-300">• {e.name} ({e.room})</p>)}
            </div>
          )}
          {warrantyExpiring.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-600" /><p className="font-semibold text-red-800 dark:text-red-400">Kafolat tugamoqda</p></div>
              {warrantyExpiring.map(e => <p key={e.id} className="text-sm text-red-700 dark:text-red-300">• {e.name} — {e.warranty_end}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Jihoz qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Jihozlar topilmadi</p>
        </div>
      ) : filtered.map(eq => {
        const cfg = STATUS_MAP[eq.status] || STATUS_MAP.active;
        const Icon = cfg.icon;
        return (
          <div key={eq.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(eq)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.color)}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className="font-semibold text-foreground">{eq.name}</p>
                  <p className="text-xs text-muted-foreground">{eq.model || eq.type} {eq.serial_number && `• S/N: ${eq.serial_number}`}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">📍 {eq.room || "—"}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DentalEquipment;
