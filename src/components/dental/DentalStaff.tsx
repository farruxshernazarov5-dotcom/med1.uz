import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Users, Clock, Star, TrendingUp, Plus, Phone, Mail, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalStaffProps {
  clinicId: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "Faol", color: "bg-green-500" },
  busy: { label: "Band", color: "bg-yellow-500" },
  inactive: { label: "Nofaol", color: "bg-muted-foreground" },
};

const SPECIALTIES = [
  "Terapevt", "Xirurg", "Ortodont", "Implantolog", "Periodontolog",
  "Endodontist", "Pedodontist", "Ortoped", "Gigiyenist", "Umumiy",
];

const DentalStaff = ({ clinicId }: DentalStaffProps) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", specialty: "", phone: "", email: "",
    experience_years: "", working_hours: "08:00 - 17:00", status: "active",
  });

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("dental_staff")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });
    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, [clinicId]);

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Ism va telefon raqamini kiriting", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("dental_staff").insert({
      clinic_id: clinicId,
      full_name: form.full_name,
      specialty: form.specialty || "Umumiy",
      phone: form.phone,
      email: form.email || null,
      experience_years: form.experience_years ? parseInt(form.experience_years) : 0,
      working_hours: form.working_hours,
      status: form.status,
    } as any);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      await writeAuditLog({ action: "create", entity_type: "dental_staff", module: "dental", details: { name: form.full_name } });
      toast({ title: "Shifokor qo'shildi ✅" });
      setForm({ full_name: "", specialty: "", phone: "", email: "", experience_years: "", working_hours: "08:00 - 17:00", status: "active" });
      setShowAddForm(false);
      fetchStaff();
    }
    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from("dental_staff").update({ status } as any).eq("id", id);
    await writeAuditLog({ action: "update", entity_type: "dental_staff", module: "dental", entity_id: id, details: { status } });
    toast({ title: `Status: ${statusMap[status]?.label || status}` });
    fetchStaff();
    if (selectedDoctor?.id === id) setSelectedDoctor({ ...selectedDoctor, status });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("dental_staff").delete().eq("id", id);
    await writeAuditLog({ action: "delete", entity_type: "dental_staff", module: "dental", entity_id: id });
    toast({ title: "Shifokor o'chirildi" });
    setSelectedDoctor(null);
    fetchStaff();
  };

  const filtered = staff.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedDoctor) {
    const st = statusMap[selectedDoctor.status] || statusMap.active;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDoctor(null)}>
            <X className="w-4 h-4 mr-1" /> Orqaga
          </Button>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-foreground">🩺 {selectedDoctor.full_name}</h2>
            <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", st.color)} />
            <span className="text-sm text-muted-foreground">{st.label}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-5xl">👨‍⚕️</div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{selectedDoctor.full_name}</p>
              <p className="text-muted-foreground">{selectedDoctor.specialty}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedDoctor.phone}</span>
                {selectedDoctor.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedDoctor.email}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedDoctor.working_hours}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {selectedDoctor.rating > 0 && <Badge variant="outline">⭐ {selectedDoctor.rating}</Badge>}
                <Badge variant="outline">🏥 {selectedDoctor.experience_years || 0} yil tajriba</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {selectedDoctor.status !== "active" && <Button size="sm" onClick={() => handleUpdateStatus(selectedDoctor.id, "active")}>✅ Faollashtirish</Button>}
          {selectedDoctor.status === "active" && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedDoctor.id, "inactive")}>⏸️ Nofaol</Button>}
          <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedDoctor.id)}>🗑️ O'chirish</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">👨‍⚕️ Shifokorlar</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}><Plus className="w-4 h-4 mr-1" /> Yangi shifokor</Button>
      </div>

      {showAddForm && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi shifokor qo'shish</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Ism familiya *" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            <Select value={form.specialty} onValueChange={v => setForm(p => ({ ...p, specialty: v }))}>
              <SelectTrigger><SelectValue placeholder="Mutaxassislik" /></SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <Input type="number" placeholder="Tajriba (yil)" value={form.experience_years} onChange={e => setForm(p => ({ ...p, experience_years: e.target.value }))} />
            <Input placeholder="Ish vaqti" value={form.working_hours} onChange={e => setForm(p => ({ ...p, working_hours: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="🔍 Shifokor qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami", value: staff.length, icon: Users, color: "text-primary" },
          { label: "Faol", value: staff.filter(d => d.status === "active").length, icon: TrendingUp, color: "text-green-600" },
          { label: "O'rtacha tajriba", value: staff.length ? `${Math.round(staff.reduce((a, d) => a + (d.experience_years || 0), 0) / staff.length)} yil` : "0", icon: Star, color: "text-yellow-600" },
          { label: "Nofaol", value: staff.filter(d => d.status === "inactive").length, icon: Clock, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <s.icon className={cn("w-5 h-5 mx-auto mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Shifokorlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const st = statusMap[doc.status] || statusMap.active;
            return (
              <div key={doc.id} className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDoctor(doc)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl shrink-0">👨‍⚕️</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{doc.full_name}</p>
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", st.color)} />
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.specialty} • {doc.experience_years || 0} yil • {doc.phone}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">{st.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DentalStaff;
