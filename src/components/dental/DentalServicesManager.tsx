import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Plus, Search, Edit, Trash2, DollarSign, Clock, Tag, TrendingUp, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";

interface Props { clinicId: string; }

const CATEGORIES = [
  { value: "therapy", label: "🦷 Terapiya" },
  { value: "surgery", label: "🔪 Jarrohlik" },
  { value: "implant", label: "🦴 Implantologiya" },
  { value: "whitening", label: "✨ Oqartirish" },
  { value: "orthodontics", label: "🔗 Ortodontiya" },
  { value: "prosthetics", label: "🦷 Protezlash" },
  { value: "hygiene", label: "🧹 Gigiyena" },
  { value: "pediatric", label: "👶 Bolalar" },
  { value: "other", label: "📋 Boshqa" },
];

const DentalServicesManager = ({ clinicId }: Props) => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "therapy", price: "", duration_minutes: "30", description: "", is_active: true });

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase.from("dental_services").select("*").eq("clinic_id", clinicId).order("name");
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, [clinicId]);

  const filtered = services.filter(s => {
    const matchCat = catFilter === "all" || s.category === catFilter;
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeServices = services.filter(s => s.is_active !== false);
  const totalRevenue = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const avgPrice = services.length ? Math.round(totalRevenue / services.length) : 0;

  const resetForm = () => {
    setForm({ name: "", category: "therapy", price: "", duration_minutes: "30", description: "", is_active: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast({ title: "Nom va narx majburiy", variant: "destructive" }); return; }
    const payload = {
      clinic_id: clinicId, name: form.name, category: form.category,
      price: Number(form.price), duration_minutes: Number(form.duration_minutes) || 30,
      description: form.description || null, is_active: form.is_active,
    };
    if (editId) {
      const { error } = await supabase.from("dental_services").update(payload).eq("id", editId);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      await writeAuditLog({ action: "update", entity_type: "dental_service", module: "dental", entity_id: editId, details: { name: form.name } });
      toast({ title: "Xizmat yangilandi" });
    } else {
      const { error } = await supabase.from("dental_services").insert(payload as any);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      await writeAuditLog({ action: "create", entity_type: "dental_service", module: "dental", details: { name: form.name } });
      toast({ title: "Xizmat qo'shildi" });
    }
    resetForm();
    fetchServices();
  };

  const handleEdit = (s: any) => {
    setForm({ name: s.name, category: s.category || "therapy", price: String(s.price || ""), duration_minutes: String(s.duration_minutes || 30), description: s.description || "", is_active: s.is_active !== false });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" xizmatini o'chirmoqchimisiz?`)) return;
    await supabase.from("dental_services").delete().eq("id", id);
    await writeAuditLog({ action: "delete", entity_type: "dental_service", module: "dental", entity_id: id, details: { name } });
    toast({ title: "Xizmat o'chirildi" });
    fetchServices();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("dental_services").update({ is_active: !active } as any).eq("id", id);
    fetchServices();
  };

  const catLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary" /> Xizmatlar boshqaruvi
        </h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Yangi xizmat
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jami xizmatlar", value: services.length, icon: Stethoscope, color: "text-primary" },
          { label: "Faol", value: activeServices.length, icon: Tag, color: "text-green-600" },
          { label: "O'rtacha narx", value: `${avgPrice.toLocaleString()}`, icon: DollarSign, color: "text-blue-600" },
          { label: "Kategoriyalar", value: new Set(services.map(s => s.category)).size, icon: TrendingUp, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border-2 border-primary/30 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-foreground">{editId ? "Xizmatni tahrirlash" : "Yangi xizmat"}</h3>
            <Button size="sm" variant="ghost" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Xizmat nomi *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Narx (so'm) *" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <Input type="number" placeholder="Davomiyligi (daqiqa)" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
          </div>
          <Input placeholder="Tavsif (ixtiyoriy)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-3">
            <Button onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
            <Button variant="outline" onClick={resetForm}>Bekor qilish</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Xizmatlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className={cn("bg-card rounded-xl border border-border p-4 flex items-center gap-4", s.is_active === false && "opacity-50")}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <Badge variant="outline" className="text-xs">{catLabel(s.category)}</Badge>
                  {s.is_active === false && <Badge variant="secondary" className="text-xs">Nofaol</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />{s.duration_minutes || 30} daqiqa
                  {s.description && <span className="ml-2">• {s.description}</span>}
                </p>
              </div>
              <p className="font-bold text-foreground whitespace-nowrap">{Number(s.price || 0).toLocaleString()} so'm</p>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(s.id, s.is_active !== false)}>
                  {s.is_active !== false ? "⏸" : "▶"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(s.id, s.name)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DentalServicesManager;
