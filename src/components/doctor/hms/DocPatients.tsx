import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Phone, User, Calendar, Eye, Filter } from "lucide-react";
import DocPatient360 from "./DocPatient360";

interface Props { doctorId: string }

type StatusFilter = "all" | "new" | "active" | "completed";
type TabFilter = "all" | "today";

const DocPatients = ({ doctorId }: Props) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [diagnosisFilter, setDiagnosisFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [todayPatientIds, setTodayPatientIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", date_of_birth: "", gender: "unspecified",
    blood_group: "", allergies: "", chronic_conditions: "", notes: "",
  });

  const load = async () => {
    const { data } = await supabase.from("doctor_patients")
      .select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    setPatients(data || []);
  };

  const loadToday = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("appointments")
      .select("patient_phone")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", today);
    const phones = new Set((data || []).map((a: any) => a.patient_phone));
    // map phones to doctor_patients ids
    const ids = new Set<string>();
    patients.forEach((p) => { if (phones.has(p.phone)) ids.add(p.id); });
    setTodayPatientIds(ids);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`doc-patients-${doctorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_patients", filter: `doctor_id=eq.${doctorId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [doctorId]);

  useEffect(() => { if (patients.length) loadToday(); }, [patients]);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: "", phone: "", email: "", date_of_birth: "", gender: "unspecified", blood_group: "", allergies: "", chronic_conditions: "", notes: "" });
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      full_name: p.full_name, phone: p.phone, email: p.email || "", date_of_birth: p.date_of_birth || "",
      gender: p.gender || "unspecified", blood_group: p.blood_group || "", allergies: p.allergies || "",
      chronic_conditions: p.chronic_conditions || "", notes: p.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Ism va telefon majburiy", variant: "destructive" }); return;
    }
    const payload = { ...form, doctor_id: doctorId, source: "manual", date_of_birth: form.date_of_birth || null };
    const { error } = editing
      ? await supabase.from("doctor_patients").update(payload).eq("id", editing.id)
      : await supabase.from("doctor_patients").insert(payload);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "✅ Yangilandi" : "✅ Qo'shildi" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Bemorni o'chirish?")) return;
    await supabase.from("doctor_patients").delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  // Compute status: new (0 visits), active (visits but recent <90d), completed (no visit >90d)
  const computeStatus = (p: any): "new" | "active" | "completed" => {
    if (!p.total_visits || p.total_visits === 0) return "new";
    const last = p.last_visit_date ? new Date(p.last_visit_date) : null;
    if (!last) return "new";
    const days = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    return days > 90 ? "completed" : "active";
  };

  const allDiagnoses = useMemo(() => {
    // We'll just use chronic_conditions field as a quick filter source
    const set = new Set<string>();
    patients.forEach((p) => { if (p.chronic_conditions) set.add(p.chronic_conditions); });
    return Array.from(set).slice(0, 30);
  }, [patients]);

  const filtered = patients.filter((p) => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    const matchDiag = !diagnosisFilter || (p.chronic_conditions || "").toLowerCase().includes(diagnosisFilter.toLowerCase());
    const matchStatus = statusFilter === "all" || computeStatus(p) === statusFilter;
    const matchTab = tabFilter === "all" || (tabFilter === "today" && todayPatientIds.has(p.id));
    return matchSearch && matchDiag && matchStatus && matchTab;
  });

  const statusBadge = (s: string) => {
    if (s === "new") return <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">Yangi</Badge>;
    if (s === "active") return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Faol</Badge>;
    return <Badge className="text-[10px] bg-muted text-muted-foreground border-border">Yakunlangan</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Bemorlar ({patients.length})</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Patient Management System</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Plus className="w-4 h-4 mr-1" /> Yangi bemor
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tabFilter} onValueChange={(v) => setTabFilter(v as TabFilter)}>
        <TabsList>
          <TabsTrigger value="all">Barchasi ({patients.length})</TabsTrigger>
          <TabsTrigger value="today">Bugungi ({todayPatientIds.size})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Ism yoki telefon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input list="diag-list" placeholder="Tashxis bo'yicha..." value={diagnosisFilter} onChange={(e) => setDiagnosisFilter(e.target.value)} className="pl-9" />
          <datalist id="diag-list">
            {allDiagnoses.map((d) => <option key={d} value={d} />)}
          </datalist>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Barcha statuslar</option>
          <option value="new">Yangi</option>
          <option value="active">Faol</option>
          <option value="completed">Yakunlangan</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          Bemorlar topilmadi
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => {
            const s = computeStatus(p);
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-secondary/40 transition-colors">
                <div className="w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{p.full_name}</p>
                    {statusBadge(s)}
                    <Badge variant="outline" className="text-[10px]">{p.source === "manual" ? "Qo'lda" : "Avto"}</Badge>
                    {p.blood_group && <Badge className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">{p.blood_group}</Badge>}
                    {todayPatientIds.has(p.id) && <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Bugun</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                    {p.date_of_birth && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.date_of_birth).toLocaleDateString("uz-UZ")}</span>}
                    <span>Tashriflar: {p.total_visits || 0}</span>
                    <span>Analiz: {p.total_lab_orders || 0}</span>
                    <span>Yozuv: {p.total_records || 0}</span>
                    {p.chronic_conditions && <span className="text-amber-600">⚠ {p.chronic_conditions}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setViewing(p)} title="Ko'rish"><Eye className="w-3 h-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(p)} title="Tahrirlash"><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)} title="O'chirish"><Trash2 className="w-3 h-3" /></Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Bemorni tahrirlash" : "Yangi bemor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">To'liq ism *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Telefon *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Jinsi</Label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="unspecified">Belgilanmagan</option>
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Qon guruhi</Label>
                <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">—</option>
                  {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div><Label className="text-xs">Allergiyalar</Label><Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Surunkali kasalliklar</Label><Input value={form.chronic_conditions} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Eslatmalar</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            <Button onClick={save} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
              {editing ? "Yangilash" : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DocPatient360 patient={viewing} doctorId={doctorId} open={!!viewing} onClose={() => setViewing(null)} />
    </div>
  );
};

export default DocPatients;
