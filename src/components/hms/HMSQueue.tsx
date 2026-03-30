import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Phone, Clock, Users, ArrowRight, Volume2, SkipForward, CheckCircle, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props { clinicId: string; }

const HMSQueue = ({ clinicId }: Props) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [allQueue, setAllQueue] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", patient_id: "", doctor_id: "", department_id: "", priority: "normal", estimated_wait_minutes: 15, notes: "" });

  const fetchData = async () => {
    const [qRes, allRes, patRes, docRes, deptRes] = await Promise.all([
      supabase.from("hms_queue").select("*").eq("clinic_id", clinicId).in("status", ["waiting", "called"]).order("priority", { ascending: true }).order("queue_number"),
      supabase.from("hms_queue").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(200),
      supabase.from("hms_patients").select("id, full_name, phone").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("doctors").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setQueue(qRes.data || []);
    setAllQueue(allRes.data || []);
    setPatients(patRes.data || []);
    setDoctors(docRes.data || []);
    setDepartments(deptRes.data || []);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel("queue-changes").on("postgres_changes", { event: "*", schema: "public", table: "hms_queue", filter: `clinic_id=eq.${clinicId}` }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  const resetForm = () => { setForm({ patient_name: "", patient_phone: "", patient_id: "", doctor_id: "", department_id: "", priority: "normal", estimated_wait_minutes: 15, notes: "" }); setShowForm(false); };

  const handleAdd = async () => {
    if (!form.patient_name) { toast({ title: "Ism majburiy!", variant: "destructive" }); return; }
    const maxNum = queue.reduce((m, q) => Math.max(m, q.queue_number), 0);
    await supabase.from("hms_queue").insert({
      ...form, queue_number: maxNum + 1, estimated_wait_minutes: Number(form.estimated_wait_minutes),
      patient_id: form.patient_id || null, doctor_id: form.doctor_id || null, department_id: form.department_id || null,
      clinic_id: clinicId
    });
    toast({ title: `✅ #${maxNum + 1} navbatga qo'shildi` }); resetForm(); fetchData();
  };

  const callNext = async (id: string) => {
    await supabase.from("hms_queue").update({ status: "called", called_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "🔔 Bemor chaqirildi!" }); fetchData();
  };

  const complete = async (id: string) => {
    await supabase.from("hms_queue").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "✅ Qabul tugadi" }); fetchData();
  };

  const skip = async (id: string) => {
    await supabase.from("hms_queue").update({ status: "skipped" }).eq("id", id);
    toast({ title: "Bemor o'tkazib yuborildi" }); fetchData();
  };

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "";
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";

  const waiting = queue.filter(q => q.status === "waiting");
  const called = queue.filter(q => q.status === "called");
  const todayCompleted = allQueue.filter(q => q.status === "completed" && q.completed_at?.startsWith(new Date().toISOString().split("T")[0]));

  const priorityColors: Record<string, string> = { urgent: "bg-red-100 text-red-800", high: "bg-orange-100 text-orange-800", normal: "bg-blue-100 text-blue-800", low: "bg-muted text-muted-foreground" };
  const priorityLabels: Record<string, string> = { urgent: "🔴 Shoshilinch", high: "🟠 Yuqori", normal: "🔵 Oddiy", low: "⚪ Past" };

  const selectPatient = (pid: string) => {
    const p = patients.find(pt => pt.id === pid);
    if (p) setForm({ ...form, patient_id: pid, patient_name: p.full_name, patient_phone: p.phone || "" });
  };

  // Doctor workload
  const doctorLoad = doctors.map(d => ({
    name: d.full_name.split(" ").slice(-1)[0],
    waiting: waiting.filter(q => q.doctor_id === d.id).length,
    completed: todayCompleted.filter(q => q.doctor_id === d.id).length
  })).filter(d => d.waiting > 0 || d.completed > 0);

  // Display mode
  if (showDisplay) {
    return (
      <div className="min-h-[600px] bg-background">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">📺 Navbat ekrani</h2>
          <Button variant="outline" size="sm" onClick={() => setShowDisplay(false)}>← Orqaga</Button>
        </div>

        {called.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading text-lg font-bold text-primary mb-4 animate-pulse">🔔 CHAQIRILGANLAR</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {called.map(q => (
                <div key={q.id} className="bg-primary/10 border-2 border-primary rounded-2xl p-6 text-center">
                  <p className="text-5xl font-bold text-primary mb-2">#{q.queue_number}</p>
                  <p className="text-lg font-semibold text-foreground">{q.patient_name}</p>
                  {getDoctorName(q.doctor_id) && <p className="text-sm text-muted-foreground mt-1">Dr. {getDoctorName(q.doctor_id)}</p>}
                  {getDeptName(q.department_id) && <Badge variant="outline" className="mt-2">{getDeptName(q.department_id)}</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="font-heading text-lg font-bold text-foreground mb-4">Kutayotganlar ({waiting.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {waiting.map(q => (
            <div key={q.id} className={cn("rounded-xl p-4 text-center border", q.priority === "urgent" ? "bg-red-50 dark:bg-red-900/20 border-red-200" : "bg-card border-border")}>
              <p className="text-2xl font-bold text-foreground">#{q.queue_number}</p>
              <p className="text-xs text-muted-foreground truncate">{q.patient_name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Navbat boshqaruvi</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowDisplay(true)}><Monitor className="w-4 h-4 mr-1" /> Ekran</Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Navbatga qo'shish</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Kutayotganlar</p>
          <p className="text-2xl font-bold text-foreground">{waiting.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Chaqirilganlar</p>
          <p className="text-2xl font-bold text-primary">{called.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">O'rtacha kutish</p>
          <p className="text-2xl font-bold text-foreground">{waiting.length > 0 ? Math.round(waiting.reduce((s, q) => s + (q.estimated_wait_minutes || 15), 0) / waiting.length) : 0} min</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Bugun tugallangan</p>
          <p className="text-2xl font-bold text-green-600">{todayCompleted.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Shoshilinch</p>
          <p className="text-2xl font-bold text-destructive">{queue.filter(q => q.priority === "urgent").length}</p>
        </div>
      </div>

      {/* Doctor workload chart */}
      {doctorLoad.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <h3 className="font-semibold text-foreground text-sm mb-3">Shifokorlar yuklamasi</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={doctorLoad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="waiting" name="Kutayotgan" fill="#eab308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Tugallangan" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Navbatga qo'shish</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => selectPatient(e.target.value)}>
              <option value="">Bemorni tanlang (ixtiyoriy)</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
            <Input placeholder="Telefon" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Shifokor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Bo'lim</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Past</option>
              <option value="normal">Oddiy</option>
              <option value="high">Yuqori</option>
              <option value="urgent">Shoshilinch</option>
            </select>
            <Input type="number" placeholder="Kutish vaqti (min)" value={form.estimated_wait_minutes} onChange={e => setForm({ ...form, estimated_wait_minutes: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAdd}>Qo'shish</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Called patients */}
      {called.length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2"><Volume2 className="w-4 h-4 text-primary animate-pulse" /> Chaqirilganlar</h3>
          <div className="space-y-2">
            {called.map(q => (
              <div key={q.id} className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">#{q.queue_number}</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{q.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{getDoctorName(q.doctor_id) && `Dr. ${getDoctorName(q.doctor_id)} • `}{getDeptName(q.department_id)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => complete(q.id)}><CheckCircle className="w-4 h-4 mr-1" /> Tugallash</Button>
                  <Button size="sm" variant="outline" onClick={() => skip(q.id)}><SkipForward className="w-4 h-4 mr-1" /> O'tkazish</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting patients */}
      <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Kutayotganlar ({waiting.length})</h3>
      <div className="space-y-2">
        {waiting.map((q, idx) => (
          <div key={q.id} className={cn("bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3", q.priority === "urgent" ? "border-red-300 bg-red-50/50 dark:bg-red-900/10" : "border-border")}>
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-foreground", q.priority === "urgent" ? "bg-red-100 text-red-800" : "bg-muted")}>#{q.queue_number}</div>
              <div>
                <p className="font-semibold text-foreground text-sm">{q.patient_name}</p>
                <p className="text-xs text-muted-foreground">{q.patient_phone} {getDoctorName(q.doctor_id) && `• Dr. ${getDoctorName(q.doctor_id)}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[10px]", priorityColors[q.priority])}>{priorityLabels[q.priority]}</Badge>
              <span className="text-xs text-muted-foreground">~{q.estimated_wait_minutes} min</span>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => callNext(q.id)}><Phone className="w-3 h-3 mr-1" /> Chaqirish</Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => skip(q.id)}><SkipForward className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
      {waiting.length === 0 && called.length === 0 && <p className="text-center py-8 text-muted-foreground">Navbat bo'sh</p>}
    </div>
  );
};

export default HMSQueue;