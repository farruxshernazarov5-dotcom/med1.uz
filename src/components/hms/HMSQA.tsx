import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, ShieldCheck, Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSQA = ({ clinicId }: Props) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("open");
  const [form, setForm] = useState({
    patient_name: "", patient_phone: "", complaint_type: "service",
    department_id: "", staff_id: "", subject: "", description: "", severity: "medium", rating: 0
  });

  const fetchData = async () => {
    const [cRes, sRes, dRes] = await Promise.all([
      supabase.from("hms_complaints").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_staff").select("id, full_name, role").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setComplaints(cRes.data || []);
    setStaff(sRes.data || []);
    setDepartments(dRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ patient_name: "", patient_phone: "", complaint_type: "service", department_id: "", staff_id: "", subject: "", description: "", severity: "medium", rating: 0 });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.subject) { toast({ title: "Mavzu majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, department_id: form.department_id || null, staff_id: form.staff_id || null, rating: Number(form.rating), clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_complaints").update(payload).eq("id", editing.id);
      toast({ title: "✅ Yangilandi" });
    } else {
      await supabase.from("hms_complaints").insert(payload);
      toast({ title: "✅ Shikoyat qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const resolveComplaint = async (id: string, resolution: string) => {
    await supabase.from("hms_complaints").update({ status: "resolved", resolution, resolved_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "✅ Hal qilindi" }); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("hms_complaints").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_complaints").delete().eq("id", id);
    toast({ title: "O'chirildi" }); fetchData();
  };

  const getStaffName = (id: string) => staff.find(s => s.id === id)?.full_name || "";
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";
  const filtered = filter === "all" ? complaints : complaints.filter(c => c.status === filter);

  const avgRating = complaints.filter(c => c.rating > 0).length > 0 ? (complaints.filter(c => c.rating > 0).reduce((s, c) => s + c.rating, 0) / complaints.filter(c => c.rating > 0).length).toFixed(1) : "—";

  const severityColors: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };
  const statusColors: Record<string, string> = { open: "bg-red-100 text-red-800", investigating: "bg-yellow-100 text-yellow-800", resolved: "bg-green-100 text-green-800", closed: "bg-muted text-muted-foreground" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Sifat nazorati</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi shikoyat</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami shikoyatlar</p>
          <p className="text-lg font-bold text-foreground">{complaints.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Ochiq</p>
          <p className="text-lg font-bold text-destructive">{complaints.filter(c => c.status === "open").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Hal qilingan</p>
          <p className="text-lg font-bold text-green-600">{complaints.filter(c => c.status === "resolved").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">O'rtacha baho</p>
          <p className="text-lg font-bold text-primary flex items-center gap-1"><Star className="w-4 h-4" /> {avgRating}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[{ id: "open", label: "Ochiq" }, { id: "investigating", label: "Tekshiruvda" }, { id: "resolved", label: "Hal qilingan" }, { id: "all", label: "Barchasi" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi shikoyat/baho"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Bemor ismi" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
            <Input placeholder="Telefon" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.complaint_type} onChange={e => setForm({ ...form, complaint_type: e.target.value })}>
              <option value="service">Xizmat sifati</option>
              <option value="staff">Xodim munosabati</option>
              <option value="wait_time">Kutish vaqti</option>
              <option value="cleanliness">Tozalik</option>
              <option value="billing">Hisob-kitob</option>
              <option value="other">Boshqa</option>
            </select>
            <Input placeholder="Mavzu *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Bo'lim</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })}>
              <option value="">Xodim</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              <option value="low">Past</option>
              <option value="medium">O'rtacha</option>
              <option value="high">Yuqori</option>
              <option value="critical">Kritik</option>
            </select>
            <Input placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Baho:</span>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setForm({ ...form, rating: n })} className={cn("w-8 h-8 rounded-full text-sm font-bold", form.rating >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{n}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm">{c.subject}</h3>
                  <p className="text-xs text-muted-foreground">{c.patient_name} {c.complaint_type && `• ${c.complaint_type}`} {getDeptName(c.department_id) && `• ${getDeptName(c.department_id)}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {c.rating > 0 && <span className="flex items-center gap-1 text-sm"><Star className="w-3 h-3 text-yellow-500" /> {c.rating}/5</span>}
                <Badge className={cn("text-[10px]", severityColors[c.severity])}>{c.severity}</Badge>
                <Badge className={cn("text-[10px]", statusColors[c.status])}>{c.status}</Badge>
              </div>
            </div>
            {c.description && <p className="text-xs text-muted-foreground mt-2">{c.description}</p>}
            {c.resolution && <p className="text-xs text-green-700 mt-1">✅ {c.resolution}</p>}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("uz")}</span>
              {getStaffName(c.staff_id) && <Badge variant="outline" className="text-[10px]">{getStaffName(c.staff_id)}</Badge>}
              <div className="ml-auto flex gap-1">
                {c.status === "open" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(c.id, "investigating")}>Tekshirish</Button>}
                {(c.status === "open" || c.status === "investigating") && (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                    const resolution = prompt("Yechim:");
                    if (resolution) resolveComplaint(c.id, resolution);
                  }}>Hal qilish</Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setForm({ patient_name: c.patient_name, patient_phone: c.patient_phone || "", complaint_type: c.complaint_type, department_id: c.department_id || "", staff_id: c.staff_id || "", subject: c.subject, description: c.description || "", severity: c.severity, rating: c.rating || 0 }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Shikoyatlar yo'q</p>}
    </div>
  );
};

export default HMSQA;
