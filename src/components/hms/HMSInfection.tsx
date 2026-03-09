import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, ShieldAlert, AlertTriangle, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSInfection = ({ clinicId }: Props) => {
  const [records, setRecords] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    record_type: "sterilization", area: "", department_id: "", equipment_name: "",
    sterilization_method: "", performed_by: "", infection_type: "", patient_id: "",
    quarantine_status: "none", quarantine_start: "", quarantine_end: "",
    severity: "low", notes: ""
  });

  const fetchData = async () => {
    const [recRes, deptRes, patRes] = await Promise.all([
      supabase.from("hms_infection_control").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setRecords(recRes.data || []);
    setDepartments(deptRes.data || []);
    setPatients(patRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ record_type: "sterilization", area: "", department_id: "", equipment_name: "", sterilization_method: "", performed_by: "", infection_type: "", patient_id: "", quarantine_status: "none", quarantine_start: "", quarantine_end: "", severity: "low", notes: "" });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    const payload = {
      ...form, department_id: form.department_id || null, patient_id: form.patient_id || null,
      quarantine_start: form.quarantine_start || null, quarantine_end: form.quarantine_end || null,
      clinic_id: clinicId
    };
    if (editing) {
      await supabase.from("hms_infection_control").update(payload).eq("id", editing.id);
      toast({ title: "✅ Yangilandi" });
    } else {
      await supabase.from("hms_infection_control").insert(payload);
      toast({ title: "✅ Yozuv qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_infection_control").delete().eq("id", id);
    toast({ title: "O'chirildi" }); fetchData();
  };

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.full_name || "";

  const filtered = filter === "all" ? records : records.filter(r => r.record_type === filter);
  const quarantined = records.filter(r => r.quarantine_status === "active");
  const infections = records.filter(r => r.record_type === "infection");

  const severityColors: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-primary" /> Infektsiya nazorati</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi yozuv</Button>
      </div>

      {quarantined.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800 dark:text-red-200"><strong>{quarantined.length}</strong> ta karantin holati faol!</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami yozuvlar</p>
          <p className="text-lg font-bold text-foreground">{records.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Sterilizatsiya</p>
          <p className="text-lg font-bold text-green-600">{records.filter(r => r.record_type === "sterilization").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Infektsiyalar</p>
          <p className="text-lg font-bold text-red-600">{infections.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Karantin</p>
          <p className="text-lg font-bold text-orange-600">{quarantined.length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[{ id: "all", label: "Barchasi" }, { id: "sterilization", label: "Sterilizatsiya" }, { id: "infection", label: "Infektsiya" }, { id: "quarantine", label: "Karantin" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi yozuv"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.record_type} onChange={e => setForm({ ...form, record_type: e.target.value })}>
              <option value="sterilization">Sterilizatsiya</option>
              <option value="infection">Infektsiya holati</option>
              <option value="quarantine">Karantin</option>
            </select>
            <Input placeholder="Hudud/Xona" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Bo'lim</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {form.record_type === "sterilization" && (
              <>
                <Input placeholder="Jihoz nomi" value={form.equipment_name} onChange={e => setForm({ ...form, equipment_name: e.target.value })} />
                <Input placeholder="Sterilizatsiya usuli" value={form.sterilization_method} onChange={e => setForm({ ...form, sterilization_method: e.target.value })} />
                <Input placeholder="Bajaruvchi" value={form.performed_by} onChange={e => setForm({ ...form, performed_by: e.target.value })} />
              </>
            )}
            {(form.record_type === "infection" || form.record_type === "quarantine") && (
              <>
                <Input placeholder="Infektsiya turi" value={form.infection_type} onChange={e => setForm({ ...form, infection_type: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                  <option value="">Bemor</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.quarantine_status} onChange={e => setForm({ ...form, quarantine_status: e.target.value })}>
                  <option value="none">Yo'q</option>
                  <option value="active">Faol karantin</option>
                  <option value="completed">Tugallangan</option>
                </select>
                <Input type="date" placeholder="Boshlanish" value={form.quarantine_start} onChange={e => setForm({ ...form, quarantine_start: e.target.value })} />
                <Input type="date" placeholder="Tugash" value={form.quarantine_end} onChange={e => setForm({ ...form, quarantine_end: e.target.value })} />
              </>
            )}
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              <option value="low">Past</option>
              <option value="medium">O'rtacha</option>
              <option value="high">Yuqori</option>
              <option value="critical">Kritik</option>
            </select>
            <Input placeholder="Eslatmalar" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className={cn("bg-card rounded-2xl border p-5", r.quarantine_status === "active" ? "border-destructive/50" : "border-border")}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", r.record_type === "infection" ? "bg-destructive/10" : r.record_type === "quarantine" ? "bg-orange-100" : "bg-green-100")}>
                  {r.record_type === "sterilization" ? <Droplets className="w-5 h-5 text-green-700" /> : <ShieldAlert className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm">
                    {r.record_type === "sterilization" ? (r.equipment_name || "Sterilizatsiya") : (r.infection_type || "Infektsiya")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {r.area && `${r.area} • `}{getDeptName(r.department_id)}{getPatientName(r.patient_id) && ` • ${getPatientName(r.patient_id)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{r.record_type}</Badge>
                <Badge className={cn("text-[10px]", severityColors[r.severity])}>{r.severity}</Badge>
                {r.quarantine_status === "active" && <Badge className="text-[10px] bg-red-600 text-white">Karantin</Badge>}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(r); setForm({ record_type: r.record_type, area: r.area || "", department_id: r.department_id || "", equipment_name: r.equipment_name || "", sterilization_method: r.sterilization_method || "", performed_by: r.performed_by || "", infection_type: r.infection_type || "", patient_id: r.patient_id || "", quarantine_status: r.quarantine_status, quarantine_start: r.quarantine_start || "", quarantine_end: r.quarantine_end || "", severity: r.severity, notes: r.notes || "" }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
            {r.notes && <p className="text-xs text-muted-foreground mt-2">{r.notes}</p>}
            {r.performed_by && <p className="text-xs text-muted-foreground mt-1">Bajaruvchi: {r.performed_by}</p>}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Yozuvlar yo'q</p>}
    </div>
  );
};

export default HMSInfection;
