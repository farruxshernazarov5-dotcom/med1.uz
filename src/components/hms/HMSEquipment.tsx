import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, Wrench, Search, AlertTriangle, Calendar, QrCode, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props { clinicId: string; }

const HMSEquipment = ({ clinicId }: Props) => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", category: "", model: "", serial_number: "", manufacturer: "",
    purchase_date: "", purchase_price: 0, warranty_until: "", location: "",
    department_id: "", status: "active", condition: "good",
    last_maintenance: "", next_maintenance: "", maintenance_notes: ""
  });

  const fetchData = async () => {
    const [eqRes, deptRes] = await Promise.all([
      supabase.from("hms_equipment").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("name"),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setEquipment(eqRes.data || []);
    setDepartments(deptRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ name: "", category: "", model: "", serial_number: "", manufacturer: "", purchase_date: "", purchase_price: 0, warranty_until: "", location: "", department_id: "", status: "active", condition: "good", last_maintenance: "", next_maintenance: "", maintenance_notes: "" });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Jihoz nomi majburiy!", variant: "destructive" }); return; }
    const payload = {
      ...form, purchase_price: Number(form.purchase_price),
      department_id: form.department_id || null,
      purchase_date: form.purchase_date || null, warranty_until: form.warranty_until || null,
      last_maintenance: form.last_maintenance || null, next_maintenance: form.next_maintenance || null,
      clinic_id: clinicId
    };
    if (editing) {
      await supabase.from("hms_equipment").update(payload).eq("id", editing.id);
      toast({ title: "✅ Jihoz yangilandi" });
    } else {
      await supabase.from("hms_equipment").insert(payload);
      toast({ title: "✅ Jihoz qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_equipment").update({ is_active: false }).eq("id", id);
    toast({ title: "Jihoz o'chirildi" }); fetchData();
  };

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";

  const filtered = equipment.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase()) || e.serial_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const needsMaintenance = equipment.filter(e => e.next_maintenance && new Date(e.next_maintenance) <= new Date());
  const warrantyExpiring = equipment.filter(e => e.warranty_until && new Date(e.warranty_until) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(e.warranty_until) > new Date());

  const conditionColors: Record<string, string> = { good: "bg-green-100 text-green-800", fair: "bg-yellow-100 text-yellow-800", poor: "bg-red-100 text-red-800" };
  const conditionLabels: Record<string, string> = { good: "Yaxshi", fair: "O'rtacha", poor: "Yomon" };
  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-800", maintenance: "bg-yellow-100 text-yellow-800", broken: "bg-red-100 text-red-800", retired: "bg-muted text-muted-foreground" };
  const statusLabels: Record<string, string> = { active: "Faol", maintenance: "Ta'mirda", broken: "Buzilgan", retired: "Eskirgan" };

  const conditionPie = [
    { name: "Yaxshi", value: equipment.filter(e => e.condition === "good").length },
    { name: "O'rtacha", value: equipment.filter(e => e.condition === "fair").length },
    { name: "Yomon", value: equipment.filter(e => e.condition === "poor").length },
  ].filter(d => d.value > 0);
  const PIE_COLORS = ["#22c55e", "#eab308", "hsl(var(--destructive))"];

  const categoryStats = equipment.reduce((acc: any, e) => {
    const cat = e.category || "Boshqa";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const catData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));

  if (selectedEquipment) {
    const eq = selectedEquipment;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedEquipment(null)} className="mb-4">← Orqaga</Button>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">{eq.name}</h2>
              <p className="text-sm text-muted-foreground">{eq.manufacturer} {eq.model}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge className={cn(statusColors[eq.status])}>{statusLabels[eq.status]}</Badge>
              <Badge className={cn(conditionColors[eq.condition])}>{conditionLabels[eq.condition]}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-foreground text-sm">📋 Asosiy ma'lumotlar</h3>
              <p className="text-xs"><span className="text-muted-foreground">Kategoriya:</span> <span className="font-medium text-foreground">{eq.category || "—"}</span></p>
              <p className="text-xs"><span className="text-muted-foreground">Seriya:</span> <span className="font-medium text-foreground">{eq.serial_number || "—"}</span></p>
              <p className="text-xs"><span className="text-muted-foreground">Joylashuv:</span> <span className="font-medium text-foreground">{eq.location || "—"}</span></p>
              <p className="text-xs"><span className="text-muted-foreground">Bo'lim:</span> <span className="font-medium text-foreground">{getDeptName(eq.department_id) || "—"}</span></p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-foreground text-sm">💰 Moliyaviy</h3>
              <p className="text-xs"><span className="text-muted-foreground">Narxi:</span> <span className="font-bold text-primary">{Number(eq.purchase_price || 0).toLocaleString()} so'm</span></p>
              <p className="text-xs"><span className="text-muted-foreground">Sotib olingan:</span> <span className="font-medium text-foreground">{eq.purchase_date || "—"}</span></p>
              <p className="text-xs"><span className="text-muted-foreground">Kafolat:</span> <span className="font-medium text-foreground">{eq.warranty_until || "—"}</span></p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-foreground text-sm">🔧 Texnik xizmat</h3>
              <p className="text-xs"><span className="text-muted-foreground">Oxirgi:</span> <span className="font-medium text-foreground">{eq.last_maintenance || "—"}</span></p>
              <p className="text-xs"><span className="text-muted-foreground">Keyingi:</span> <span className={cn("font-medium", eq.next_maintenance && new Date(eq.next_maintenance) <= new Date() ? "text-destructive" : "text-foreground")}>{eq.next_maintenance || "—"}</span></p>
              {eq.maintenance_notes && <p className="text-xs text-muted-foreground">{eq.maintenance_notes}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Jihozlar boshqaruvi</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi jihoz</Button>
      </div>

      {/* Alerts */}
      {(needsMaintenance.length > 0 || warrantyExpiring.length > 0) && (
        <div className="space-y-2 mb-4">
          {needsMaintenance.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200"><strong>{needsMaintenance.length}</strong> ta jihozga texnik xizmat kerak!</p>
            </div>
          )}
          {warrantyExpiring.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800 dark:text-orange-200"><strong>{warrantyExpiring.length}</strong> ta jihozning kafolat muddati tugamoqda!</p>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami jihozlar</p>
          <p className="text-2xl font-bold text-foreground">{equipment.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Faol</p>
          <p className="text-2xl font-bold text-green-600">{equipment.filter(e => e.status === "active").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Ta'mirda</p>
          <p className="text-2xl font-bold text-yellow-600">{equipment.filter(e => e.status === "maintenance").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Nosoz</p>
          <p className="text-2xl font-bold text-destructive">{equipment.filter(e => e.status === "broken").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami qiymat</p>
          <p className="text-lg font-bold text-primary">{equipment.reduce((s, e) => s + Number(e.purchase_price || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      {equipment.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {conditionPie.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground text-sm mb-3">Jihozlar holati</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={conditionPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value as number}`}>
                    {conditionPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {catData.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground text-sm mb-3">Kategoriyalar</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={catData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[{ id: "all", label: "Barchasi" }, { id: "active", label: "Faol" }, { id: "maintenance", label: "Ta'mirda" }, { id: "broken", label: "Buzilgan" }, { id: "retired", label: "Eskirgan" }].map(f => (
          <button key={f.id} onClick={() => setFilterStatus(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filterStatus === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input className="pl-9" placeholder="Jihoz qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi jihoz"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Jihoz nomi *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Kategoriya" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            <Input placeholder="Seriya raqami" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
            <Input placeholder="Ishlab chiqaruvchi" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Bo'lim</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <Input type="date" placeholder="Sotib olingan sana" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
            <Input type="number" placeholder="Narxi" value={form.purchase_price || ""} onChange={e => setForm({ ...form, purchase_price: Number(e.target.value) })} />
            <Input type="date" placeholder="Kafolat muddati" value={form.warranty_until} onChange={e => setForm({ ...form, warranty_until: e.target.value })} />
            <Input placeholder="Joylashuv" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Faol</option>
              <option value="maintenance">Ta'mirda</option>
              <option value="broken">Buzilgan</option>
              <option value="retired">Eskirgan</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
              <option value="good">Yaxshi</option>
              <option value="fair">O'rtacha</option>
              <option value="poor">Yomon</option>
            </select>
            <Input type="date" placeholder="Oxirgi texnik xizmat" value={form.last_maintenance} onChange={e => setForm({ ...form, last_maintenance: e.target.value })} />
            <Input type="date" placeholder="Keyingi texnik xizmat" value={form.next_maintenance} onChange={e => setForm({ ...form, next_maintenance: e.target.value })} />
            <Input placeholder="Texnik eslatmalar" value={form.maintenance_notes} onChange={e => setForm({ ...form, maintenance_notes: e.target.value })} className="md:col-span-2" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(eq => (
          <div key={eq.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedEquipment(eq)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm">{eq.name}</h3>
                  {eq.model && <p className="text-xs text-muted-foreground">{eq.manufacturer} {eq.model}</p>}
                </div>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(eq); setForm({ name: eq.name, category: eq.category || "", model: eq.model || "", serial_number: eq.serial_number || "", manufacturer: eq.manufacturer || "", purchase_date: eq.purchase_date || "", purchase_price: eq.purchase_price || 0, warranty_until: eq.warranty_until || "", location: eq.location || "", department_id: eq.department_id || "", status: eq.status, condition: eq.condition, last_maintenance: eq.last_maintenance || "", next_maintenance: eq.next_maintenance || "", maintenance_notes: eq.maintenance_notes || "" }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(eq.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("text-[10px]", statusColors[eq.status])}>{statusLabels[eq.status]}</Badge>
              <Badge className={cn("text-[10px]", conditionColors[eq.condition])}>{conditionLabels[eq.condition]}</Badge>
              {eq.category && <Badge variant="outline" className="text-[10px]">{eq.category}</Badge>}
              {getDeptName(eq.department_id) && <Badge variant="outline" className="text-[10px]">{getDeptName(eq.department_id)}</Badge>}
              {eq.next_maintenance && new Date(eq.next_maintenance) <= new Date() && <Badge className="text-[10px] bg-red-100 text-red-800">⚠ Texnik xizmat!</Badge>}
            </div>
            {eq.purchase_price > 0 && <p className="text-xs text-muted-foreground mt-2">{Number(eq.purchase_price).toLocaleString()} so'm</p>}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Jihozlar yo'q</p>}
    </div>
  );
};

export default HMSEquipment;