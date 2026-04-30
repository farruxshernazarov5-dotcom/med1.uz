import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Save, X, Trash2, UserCheck, Search, Phone, Mail,
  Briefcase, Award, Calendar, Activity, Edit, Power
} from "lucide-react";

interface Staff {
  id: string; full_name: string; role: string; phone: string | null;
  email: string | null; is_active: boolean; hire_date: string | null;
  specialization?: string | null; experience_years?: number | null;
  department?: string | null; schedule_type?: string | null;
  is_on_duty?: boolean | null; notes?: string | null;
}

interface Props {
  centerId: string;
  staff: Staff[];
  onReload: () => void;
}

const ROLES = [
  { value: "laborant", label: "Laborant", color: "bg-blue-500/15 text-blue-700" },
  { value: "radiolog", label: "Radiolog", color: "bg-purple-500/15 text-purple-700" },
  { value: "shifokor", label: "Shifokor", color: "bg-emerald-500/15 text-emerald-700" },
  { value: "texnik", label: "Texnik", color: "bg-amber-500/15 text-amber-700" },
  { value: "operator", label: "Operator", color: "bg-cyan-500/15 text-cyan-700" },
  { value: "boshqaruvchi", label: "Boshqaruvchi", color: "bg-rose-500/15 text-rose-700" },
];

const SPECIALIZATIONS = ["Umumiy", "Gematologiya", "Biokimyo", "Mikrobiologiya", "UZI", "MRT", "KT", "Rentgen", "EKG", "EEG"];

const initialForm = {
  full_name: "", role: "laborant", phone: "", email: "",
  specialization: "Umumiy", experience_years: 0,
  department: "", schedule_type: "full_time", notes: "",
};

const DiagStaff = ({ centerId, staff, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchSearch = !search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone || "").includes(search);
      const matchRole = filterRole === "all" || s.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [staff, search, filterRole]);

  const stats = useMemo(() => ({
    total: staff.length,
    active: staff.filter((s) => s.is_active).length,
    onDuty: staff.filter((s) => s.is_on_duty).length,
    byRole: ROLES.map((r) => ({ ...r, count: staff.filter((s) => s.role === r.value).length })),
  }), [staff]);

  const startEdit = (s: Staff) => {
    setEditId(s.id);
    setForm({
      full_name: s.full_name, role: s.role,
      phone: s.phone || "", email: s.email || "",
      specialization: s.specialization || "Umumiy",
      experience_years: s.experience_years || 0,
      department: s.department || "",
      schedule_type: s.schedule_type || "full_time",
      notes: s.notes || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    const payload: any = {
      center_id: centerId,
      full_name: form.full_name,
      role: form.role,
      phone: form.phone || null,
      email: form.email || null,
      specialization: form.specialization || null,
      experience_years: Number(form.experience_years) || 0,
      department: form.department || null,
      schedule_type: form.schedule_type,
      notes: form.notes || null,
    };
    const op = editId
      ? supabase.from("diagnostics_staff" as any).update(payload).eq("id", editId)
      : supabase.from("diagnostics_staff" as any).insert(payload);
    const { error } = await op;
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: editId ? "✅ Yangilandi" : "✅ Xodim qo'shildi" });
    setShowForm(false); setEditId(null); setForm(initialForm);
    onReload();
  };

  const toggleDuty = async (s: Staff) => {
    await supabase.from("diagnostics_staff" as any).update({ is_on_duty: !s.is_on_duty } as any).eq("id", s.id);
    onReload();
  };

  const toggleActive = async (s: Staff) => {
    await supabase.from("diagnostics_staff" as any).update({ is_active: !s.is_active } as any).eq("id", s.id);
    onReload();
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("diagnostics_staff" as any).delete().eq("id", id);
    toast({ title: "Xodim o'chirildi" });
    onReload();
  };

  const getRoleConf = (role: string) => ROLES.find((r) => r.value === role) || ROLES[0];

  return (
    <div className="space-y-4">
      {/* Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <UserCheck className="w-5 h-5 text-primary mb-1" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Jami xodimlar</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Activity className="w-5 h-5 text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Aktiv</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Power className="w-5 h-5 text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{stats.onDuty}</p>
          <p className="text-xs text-muted-foreground">Bugun ishda</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Award className="w-5 h-5 text-purple-500 mb-1" />
          <p className="text-2xl font-bold">{stats.byRole.find((r) => r.value === "radiolog")?.count || 0}</p>
          <p className="text-xs text-muted-foreground">Radiologlar</p>
        </CardContent></Card>
      </div>

      {/* Header + filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h3 className="font-heading font-bold text-lg text-foreground">Xodimlar boshqaruvi</h3>
        <Button size="sm" onClick={() => { setEditId(null); setForm(initialForm); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-1" /> Qo'shish
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Ism yoki telefon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">Barcha rollar</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">{editId ? "Tahrirlash" : "Yangi xodim"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>F.I.O. *</Label><Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Lavozim</Label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Mutaxassislik</Label>
                <select value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><Label>Bo'lim</Label><Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="Lab / Radiologiya" className="mt-1" /></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+998..." className="mt-1" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
              <div><Label>Ish tajribasi (yil)</Label><Input type="number" min={0} value={form.experience_years} onChange={(e) => setForm((p) => ({ ...p, experience_years: Number(e.target.value) }))} className="mt-1" /></div>
              <div>
                <Label>Ish turi</Label>
                <select value={form.schedule_type} onChange={(e) => setForm((p) => ({ ...p, schedule_type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="full_time">To'liq stavka</option>
                  <option value="part_time">Yarim stavka</option>
                  <option value="shift">Smenali</option>
                  <option value="contract">Shartnoma</option>
                </select>
              </div>
            </div>
            <div><Label>Izoh</Label><Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
          {staff.length === 0 ? "Xodimlar yo'q" : "Topilmadi"}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((s) => {
            const rconf = getRoleConf(s.role);
            return (
              <Card key={s.id} className={!s.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">{s.full_name}</p>
                        {s.is_on_duty && <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">Ishda</Badge>}
                        {!s.is_active && <Badge variant="outline" className="text-[10px]">Nofaol</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <Badge className={`${rconf.color} text-[10px]`}>{rconf.label}</Badge>
                        {s.specialization && <Badge variant="outline" className="text-[10px]"><Briefcase className="w-3 h-3 mr-1" />{s.specialization}</Badge>}
                        {s.experience_years ? <Badge variant="outline" className="text-[10px]">{s.experience_years} yil</Badge> : null}
                      </div>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {s.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone}</p>}
                        {s.email && <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3" /> {s.email}</p>}
                        {s.department && <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {s.department}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleDuty(s)} title="Ishda holatini almashtirish">
                        <Power className={`w-4 h-4 ${s.is_on_duty ? "text-emerald-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(s)} title="Faol/Nofaol">
                        <Activity className={`w-4 h-4 ${s.is_active ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteStaff(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiagStaff;
