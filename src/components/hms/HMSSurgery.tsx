import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, Scissors, Clock, Calendar, Users, FileText, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface Props { clinicId: string; }

const HMSSurgery = ({ clinicId }: Props) => {
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");
  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", surgery_name: "", surgery_type: "planned",
    scheduled_date: "", scheduled_time: "", duration_minutes: 60,
    operating_room: "", anesthesia_type: "", pre_op_notes: "", post_op_notes: "",
    cost: 0, team_members: "", assistants: "", anesthesiologist: "",
    instruments_used: "", complications: "", outcome: "successful"
  });

  const fetchData = async () => {
    const [surgRes, patRes, docRes] = await Promise.all([
      supabase.from("hms_surgeries").select("*").eq("clinic_id", clinicId).order("scheduled_date", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setSurgeries(surgRes.data || []);
    setPatients(patRes.data || []);
    setDoctors(docRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ patient_id: "", doctor_id: "", surgery_name: "", surgery_type: "planned", scheduled_date: "", scheduled_time: "", duration_minutes: 60, operating_room: "", anesthesia_type: "", pre_op_notes: "", post_op_notes: "", cost: 0, team_members: "", assistants: "", anesthesiologist: "", instruments_used: "", complications: "", outcome: "successful" });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.patient_id || !form.surgery_name || !form.scheduled_date) {
      toast({ title: "Bemor, operatsiya nomi va sana majburiy!", variant: "destructive" }); return;
    }
    const payload: any = {
      patient_id: form.patient_id, doctor_id: form.doctor_id || null, surgery_name: form.surgery_name,
      surgery_type: form.surgery_type, scheduled_date: form.scheduled_date, scheduled_time: form.scheduled_time || null,
      duration_minutes: Number(form.duration_minutes), operating_room: form.operating_room,
      anesthesia_type: form.anesthesia_type, pre_op_notes: form.pre_op_notes,
      cost: Number(form.cost), team_members: form.team_members, clinic_id: clinicId
    };
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
    const updates: any = { status };
    if (status === "in_progress") updates.start_time = new Date().toISOString();
    if (status === "completed") updates.end_time = new Date().toISOString();
    await supabase.from("hms_surgeries").update(updates).eq("id", id);
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
  const statusLabels: Record<string, string> = {
    scheduled: "Rejalashtirilgan", in_progress: "Jarayonda", completed: "Tugallangan", cancelled: "Bekor"
  };

  const todaySurgeries = surgeries.filter(s => s.scheduled_date === new Date().toISOString().split("T")[0]);
  const totalRevenue = surgeries.filter(s => s.status === "completed").reduce((sum, s) => sum + Number(s.cost || 0), 0);

  const typeStats = surgeries.reduce((acc: any, s) => {
    acc[s.surgery_type] = (acc[s.surgery_type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeStats).map(([name, value]) => ({ name: name === "planned" ? "Rejalashtirilgan" : name === "emergency" ? "Shoshilinch" : "Ixtiyoriy", value }));
  const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--accent))"];

  const openDetail = (s: any) => { setSelectedSurgery(s); setActiveTab("detail"); };

  if (activeTab === "detail" && selectedSurgery) {
    const s = selectedSurgery;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => { setActiveTab("list"); setSelectedSurgery(null); }} className="mb-4">← Orqaga</Button>
        <div className="bg-card rounded-2xl border border-border p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Scissors className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">{s.surgery_name}</h2>
              <p className="text-sm text-muted-foreground">{getPatientName(s.patient_id)} • {s.scheduled_date}</p>
            </div>
            <Badge className={cn("ml-auto text-xs", statusColors[s.status])}>{statusLabels[s.status] || s.status}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Operatsiya jamoasi</h3>
              <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Jarroh:</span> <span className="font-medium text-foreground">{getDoctorName(s.doctor_id) || "—"}</span></p>
                <p><span className="text-muted-foreground">Anesteziolog:</span> <span className="font-medium text-foreground">{s.anesthesia_type || "—"}</span></p>
                <p><span className="text-muted-foreground">Jamoa:</span> <span className="font-medium text-foreground">{s.team_members || "—"}</span></p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Vaqt va joy</h3>
              <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Sana:</span> <span className="font-medium text-foreground">{s.scheduled_date}</span></p>
                <p><span className="text-muted-foreground">Vaqt:</span> <span className="font-medium text-foreground">{s.scheduled_time?.slice(0, 5) || "—"}</span></p>
                <p><span className="text-muted-foreground">Xona:</span> <span className="font-medium text-foreground">{s.operating_room || "—"}</span></p>
                <p><span className="text-muted-foreground">Davomiyligi:</span> <span className="font-medium text-foreground">{s.duration_minutes} min</span></p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4" /> Ma'lumotlar</h3>
              <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Turi:</span> <span className="font-medium text-foreground">{s.surgery_type === "planned" ? "Rejalashtirilgan" : s.surgery_type === "emergency" ? "Shoshilinch" : "Ixtiyoriy"}</span></p>
                <p><span className="text-muted-foreground">Narxi:</span> <span className="font-medium text-primary">{Number(s.cost).toLocaleString()} so'm</span></p>
              </div>
            </div>
          </div>

          {s.pre_op_notes && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h4 className="font-semibold text-foreground text-sm mb-1">📋 Operatsiya oldi eslatmalari</h4>
              <p className="text-sm text-muted-foreground">{s.pre_op_notes}</p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {s.status === "scheduled" && <Button size="sm" onClick={() => { updateStatus(s.id, "in_progress"); setSelectedSurgery({ ...s, status: "in_progress" }); }}>▶ Boshlash</Button>}
            {s.status === "in_progress" && <Button size="sm" onClick={() => { updateStatus(s.id, "completed"); setSelectedSurgery({ ...s, status: "completed" }); }}>✅ Tugallash</Button>}
            {s.status === "scheduled" && <Button size="sm" variant="destructive" onClick={() => { updateStatus(s.id, "cancelled"); setSelectedSurgery({ ...s, status: "cancelled" }); }}>Bekor qilish</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Operatsiyalar boshqaruvi</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi operatsiya</Button>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami</p>
          <p className="text-2xl font-bold text-foreground">{surgeries.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Bugungi</p>
          <p className="text-2xl font-bold text-primary">{todaySurgeries.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Yakunlangan</p>
          <p className="text-2xl font-bold text-green-600">{surgeries.filter(s => s.status === "completed").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jarayonda</p>
          <p className="text-2xl font-bold text-yellow-600">{surgeries.filter(s => s.status === "in_progress").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Daromad</p>
          <p className="text-lg font-bold text-primary">{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      {typeData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Operatsiya turlari</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value as number}`}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Operatsiya xonalari bandligi</h3>
            <div className="space-y-2 mt-4">
              {Array.from(new Set(surgeries.filter(s => s.operating_room).map(s => s.operating_room))).map(room => {
                const count = surgeries.filter(s => s.operating_room === room).length;
                return (
                  <div key={room} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 truncate">{room}</span>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className="bg-primary rounded-full h-3" style={{ width: `${Math.min((count / surgeries.length) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            <Input placeholder="Operatsiya oldi eslatmalari" value={form.pre_op_notes} onChange={e => setForm({ ...form, pre_op_notes: e.target.value })} className="md:col-span-2" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openDetail(s)}>
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
              <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" /> {s.scheduled_date}
                  {s.scheduled_time && <><Clock className="w-3 h-3 ml-1" /> {s.scheduled_time?.slice(0, 5)}</>}
                </div>
                {s.cost > 0 && <span className="text-xs font-bold text-primary">{Number(s.cost).toLocaleString()} so'm</span>}
                <Badge className={cn("text-[10px]", statusColors[s.status] || "bg-muted text-muted-foreground")}>{statusLabels[s.status] || s.status}</Badge>
                {s.status === "scheduled" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(s.id, "in_progress")}>Boshlash</Button>}
                {s.status === "in_progress" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(s.id, "completed")}>Tugallash</Button>}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setForm({ patient_id: s.patient_id, doctor_id: s.doctor_id || "", surgery_name: s.surgery_name, surgery_type: s.surgery_type, scheduled_date: s.scheduled_date, scheduled_time: s.scheduled_time || "", duration_minutes: s.duration_minutes, operating_room: s.operating_room, anesthesia_type: s.anesthesia_type, pre_op_notes: s.pre_op_notes, post_op_notes: "", cost: s.cost, team_members: s.team_members, assistants: "", anesthesiologist: "", instruments_used: "", complications: "", outcome: "successful" }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(s.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
            {s.operating_room && (
              <div className="flex items-center gap-2 mt-2">
                {s.operating_room && <Badge variant="outline" className="text-[10px]">Xona: {s.operating_room}</Badge>}
                {s.anesthesia_type && <Badge variant="outline" className="text-[10px]">{s.anesthesia_type}</Badge>}
                {s.duration_minutes > 0 && <Badge variant="outline" className="text-[10px]">{s.duration_minutes} min</Badge>}
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Operatsiyalar yo'q</p>}
    </div>
  );
};

export default HMSSurgery;