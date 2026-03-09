import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, Scissors, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSSurgery = ({ clinicId }: Props) => {
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", surgery_name: "", surgery_type: "planned",
    scheduled_date: "", scheduled_time: "", duration_minutes: 60,
    operating_room: "", anesthesia_type: "", pre_op_notes: "", cost: 0, team_members: ""
  });

  const fetchData = async () => {
    const [surgRes, patRes, docRes] = await Promise.all([
      supabase.from("hms_surgeries").select("*").eq("clinic_id", clinicId).order("scheduled_date", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("doctors").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setSurgeries(surgRes.data || []);
    setPatients(patRes.data || []);
    setDoctors(docRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ patient_id: "", doctor_id: "", surgery_name: "", surgery_type: "planned", scheduled_date: "", scheduled_time: "", duration_minutes: 60, operating_room: "", anesthesia_type: "", pre_op_notes: "", cost: 0, team_members: "" });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.patient_id || !form.surgery_name || !form.scheduled_date) {
      toast({ title: "Bemor, operatsiya nomi va sana majburiy!", variant: "destructive" }); return;
    }
    const payload = { ...form, duration_minutes: Number(form.duration_minutes), cost: Number(form.cost), doctor_id: form.doctor_id || null, clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_surgeries").update(payload).eq("id", editing.id);
      toast({ title: "✅ Operatsiya yangilandi" });
    } else {
      await supabase.from("hms_surgeries").insert(payload);
      toast({ title: "✅ Operatsiya qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("hms_surgeries").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_surgeries").delete().eq("id", id);
    toast({ title: "Operatsiya o'chirildi" }); fetchData();
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.full_name || "—";
  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "";

  const filtered = filter === "all" ? surgeries : surgeries.filter(s => s.status === filter);
  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800", in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Operatsiyalar ({surgeries.length})</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi operatsiya</Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[{ id: "all", label: "Barchasi" }, { id: "scheduled", label: "Rejalashtirilgan" }, { id: "in_progress", label: "Jarayonda" }, { id: "completed", label: "Tugallangan" }, { id: "cancelled", label: "Bekor" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi operatsiya"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Bemor tanlang *</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Jarroh</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <Input placeholder="Operatsiya nomi *" value={form.surgery_name} onChange={e => setForm({ ...form, surgery_name: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.surgery_type} onChange={e => setForm({ ...form, surgery_type: e.target.value })}>
              <option value="planned">Rejalashtirilgan</option>
              <option value="emergency">Shoshilinch</option>
              <option value="elective">Ixtiyoriy</option>
            </select>
            <Input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
            <Input type="time" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} />
            <Input type="number" placeholder="Davomiyligi (min)" value={form.duration_minutes || ""} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            <Input placeholder="Operatsiya xonasi" value={form.operating_room} onChange={e => setForm({ ...form, operating_room: e.target.value })} />
            <Input placeholder="Anesteziya turi" value={form.anesthesia_type} onChange={e => setForm({ ...form, anesthesia_type: e.target.value })} />
            <Input type="number" placeholder="Narxi" value={form.cost || ""} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} />
            <Input placeholder="Jamoa a'zolari" value={form.team_members} onChange={e => setForm({ ...form, team_members: e.target.value })} />
            <Input placeholder="Operatsiya oldi eslatmalari" value={form.pre_op_notes} onChange={e => setForm({ ...form, pre_op_notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm">{s.surgery_name}</h3>
                  <p className="text-xs text-muted-foreground">{getPatientName(s.patient_id)} {getDoctorName(s.doctor_id) && `• Dr. ${getDoctorName(s.doctor_id)}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" /> {s.scheduled_date}
                  {s.scheduled_time && <><Clock className="w-3 h-3 ml-1" /> {s.scheduled_time?.slice(0, 5)}</>}
                </div>
                {s.cost > 0 && <span className="text-xs font-bold text-primary">{Number(s.cost).toLocaleString()} so'm</span>}
                <Badge className={cn("text-[10px]", statusColors[s.status] || "bg-muted text-muted-foreground")}>{s.status}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {s.operating_room && <Badge variant="outline" className="text-[10px]">Xona: {s.operating_room}</Badge>}
              {s.anesthesia_type && <Badge variant="outline" className="text-[10px]">{s.anesthesia_type}</Badge>}
              {s.duration_minutes > 0 && <Badge variant="outline" className="text-[10px]">{s.duration_minutes} min</Badge>}
              <div className="ml-auto flex gap-1">
                {s.status === "scheduled" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(s.id, "in_progress")}>Boshlash</Button>}
                {s.status === "in_progress" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(s.id, "completed")}>Tugallash</Button>}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setForm({ patient_id: s.patient_id, doctor_id: s.doctor_id || "", surgery_name: s.surgery_name, surgery_type: s.surgery_type, scheduled_date: s.scheduled_date, scheduled_time: s.scheduled_time || "", duration_minutes: s.duration_minutes, operating_room: s.operating_room, anesthesia_type: s.anesthesia_type, pre_op_notes: s.pre_op_notes, cost: s.cost, team_members: s.team_members }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(s.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Operatsiyalar yo'q</p>}
    </div>
  );
};

export default HMSSurgery;
