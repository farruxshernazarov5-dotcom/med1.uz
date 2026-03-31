import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, Siren, Ambulance, Clock, MapPin, Phone, Users, Activity, TrendingUp, AlertTriangle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props { clinicId: string; }

const COLORS = ["hsl(0, 72%, 55%)", "hsl(32, 87%, 52%)", "hsl(45, 93%, 47%)", "hsl(214, 84%, 56%)", "hsl(145, 63%, 42%)"];

const HMSEmergency = ({ clinicId }: Props) => {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("active");
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);
  const [form, setForm] = useState({
    patient_name: "", patient_phone: "", patient_id: "", emergency_type: "general",
    severity: "moderate", description: "", location: "", ambulance_dispatched: false,
    ambulance_plate: "", assigned_doctor_id: ""
  });

  const fetchData = async () => {
    const [emRes, patRes, docRes] = await Promise.all([
      supabase.from("hms_emergency").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name, phone").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("doctors").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setEmergencies(emRes.data || []);
    setPatients(patRes.data || []);
    setDoctors(docRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ patient_name: "", patient_phone: "", patient_id: "", emergency_type: "general", severity: "moderate", description: "", location: "", ambulance_dispatched: false, ambulance_plate: "", assigned_doctor_id: "" });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.patient_name) { toast({ title: "Bemor ismi majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, patient_id: form.patient_id || null, assigned_doctor_id: form.assigned_doctor_id || null, clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_emergency").update(payload).eq("id", editing.id);
      toast({ title: "✅ Yangilandi" });
    } else {
      await supabase.from("hms_emergency").insert(payload);
      toast({ title: "🚨 Shoshilinch holat qo'shildi!" });
    }
    resetForm(); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "treating") updates.arrival_time = new Date().toISOString();
    await supabase.from("hms_emergency").update(updates).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_emergency").delete().eq("id", id);
    toast({ title: "O'chirildi" }); fetchData();
  };

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "";
  const activeStatuses = ["reported", "dispatched", "en_route", "treating"];
  const filtered = filter === "active" ? emergencies.filter(e => activeStatuses.includes(e.status)) : filter === "all" ? emergencies : emergencies.filter(e => e.status === filter);

  const activeCount = emergencies.filter(e => activeStatuses.includes(e.status)).length;
  const criticalCount = emergencies.filter(e => e.severity === "critical" && activeStatuses.includes(e.status)).length;
  const ambulanceActive = emergencies.filter(e => e.ambulance_dispatched && activeStatuses.includes(e.status)).length;
  const resolvedToday = emergencies.filter(e => e.status === "resolved" && new Date(e.updated_at).toDateString() === new Date().toDateString()).length;

  // Charts data
  const typeStats = ["general", "cardiac", "trauma", "respiratory", "neurological", "poisoning", "obstetric"].map(t => ({
    name: t === "general" ? "Umumiy" : t === "cardiac" ? "Yurak" : t === "trauma" ? "Travma" : t === "respiratory" ? "Nafas" : t === "neurological" ? "Nevrologik" : t === "poisoning" ? "Zaharlanish" : "Tug'ruq",
    value: emergencies.filter(e => e.emergency_type === t).length
  })).filter(d => d.value > 0);

  const severityStats = [
    { name: "Kritik", value: emergencies.filter(e => e.severity === "critical").length },
    { name: "Og'ir", value: emergencies.filter(e => e.severity === "severe").length },
    { name: "O'rtacha", value: emergencies.filter(e => e.severity === "moderate").length },
    { name: "Engil", value: emergencies.filter(e => e.severity === "mild").length },
  ].filter(d => d.value > 0);

  const severityColors: Record<string, string> = { critical: "bg-red-600 text-white", severe: "bg-red-100 text-red-800", moderate: "bg-yellow-100 text-yellow-800", mild: "bg-green-100 text-green-800" };
  const statusColors: Record<string, string> = { reported: "bg-red-100 text-red-800", dispatched: "bg-orange-100 text-orange-800", en_route: "bg-yellow-100 text-yellow-800", treating: "bg-blue-100 text-blue-800", resolved: "bg-green-100 text-green-800" };
  const statusLabels: Record<string, string> = { reported: "Xabar berildi", dispatched: "Yuborildi", en_route: "Yo'lda", treating: "Davolanmoqda", resolved: "Hal qilindi" };
  const typeLabels: Record<string, string> = { general: "Umumiy", cardiac: "Yurak", trauma: "Travma", respiratory: "Nafas olish", neurological: "Nevrologik", poisoning: "Zaharlanish", obstetric: "Tug'ruq" };

  // Calculate avg response time
  const resolvedWithArrival = emergencies.filter(e => e.status === "resolved" && e.arrival_time);
  const avgResponseMin = resolvedWithArrival.length > 0
    ? Math.round(resolvedWithArrival.reduce((s, e) => s + (new Date(e.arrival_time).getTime() - new Date(e.created_at).getTime()) / 60000, 0) / resolvedWithArrival.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center shadow-lg animate-pulse">
            <Siren className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Tez yordam boshqaruvi</h2>
            <p className="text-xs text-muted-foreground">{activeCount} ta faol chaqiruv</p>
          </div>
        </div>
        <Button size="sm" className="bg-destructive text-destructive-foreground" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Shoshilinch holat
        </Button>
      </div>

      {/* Critical alert */}
      {criticalCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <p className="font-bold text-red-800 dark:text-red-200">⚠️ {criticalCount} ta KRITIK holat!</p>
            <p className="text-sm text-red-600 dark:text-red-300">Darhol aralashuv talab qilinadi</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Siren, label: "Faol chaqiruvlar", value: activeCount, color: "from-red-500 to-red-600" },
          { icon: AlertTriangle, label: "Kritik holatlar", value: criticalCount, color: "from-red-700 to-red-800" },
          { icon: Ambulance, label: "Faol ambulanslar", value: ambulanceActive, color: "from-orange-500 to-orange-600" },
          { icon: Activity, label: "Bugun hal qilingan", value: resolvedToday, color: "from-green-500 to-green-600" },
          { icon: Clock, label: "O'rtacha javob (min)", value: avgResponseMin || "—", color: "from-blue-500 to-blue-600" },
        ].map(k => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${k.color} p-4 text-white shadow-lg`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-4 translate-x-4" />
            <k.icon className="w-5 h-5 text-white/80 mb-1" />
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-white/70">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {emergencies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground text-sm mb-4">Holat turlari</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeStats} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {typeStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {typeStats.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name}: {d.value}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground text-sm mb-4">Og'irlik darajasi</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Soni" fill="hsl(0, 72%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: "active", label: `Faol (${activeCount})` },
          { id: "all", label: "Barchasi" },
          { id: "reported", label: "Xabar berilgan" },
          { id: "dispatched", label: "Yuborilgan" },
          { id: "en_route", label: "Yo'lda" },
          { id: "treating", label: "Davolanmoqda" },
          { id: "resolved", label: "Hal qilingan" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1.5 text-xs rounded-full whitespace-nowrap font-medium transition-all", filter === f.id ? "bg-destructive text-destructive-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{f.label}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border-2 border-destructive/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "🚨 Yangi shoshilinch holat"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
            <Input placeholder="Telefon (+998...)" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => {
              const p = patients.find(p => p.id === e.target.value);
              setForm({ ...form, patient_id: e.target.value, patient_name: p?.full_name || form.patient_name, patient_phone: p?.phone || form.patient_phone });
            }}>
              <option value="">Tizimdan bemor (ixtiyoriy)</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.emergency_type} onChange={e => setForm({ ...form, emergency_type: e.target.value })}>
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              <option value="mild">Engil</option>
              <option value="moderate">O'rtacha</option>
              <option value="severe">Og'ir</option>
              <option value="critical">⚠️ Kritik</option>
            </select>
            <Input placeholder="📍 Manzil/Joylashuv" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.assigned_doctor_id} onChange={e => setForm({ ...form, assigned_doctor_id: e.target.value })}>
              <option value="">Shifokor tayinlash</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <Input placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.ambulance_dispatched} onChange={e => setForm({ ...form, ambulance_dispatched: e.target.checked })} className="rounded" />
              <Ambulance className="w-4 h-4" /> Ambulans yuborildi
            </label>
            {form.ambulance_dispatched && <Input placeholder="Avtomobil raqami" value={form.ambulance_plate} onChange={e => setForm({ ...form, ambulance_plate: e.target.value })} />}
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="bg-destructive text-destructive-foreground" onClick={handleSave}>{editing ? "Yangilash" : "🚨 Qo'shish"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Detail view */}
      {selectedEmergency && (
        <div className="bg-card rounded-2xl border-2 border-primary/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">📋 Batafsil ma'lumot</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedEmergency(null)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Bemor</p><p className="font-bold">{selectedEmergency.patient_name}</p></div>
            <div><p className="text-xs text-muted-foreground">Telefon</p><p className="font-medium">{selectedEmergency.patient_phone || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Holat turi</p><p className="font-medium">{typeLabels[selectedEmergency.emergency_type] || selectedEmergency.emergency_type}</p></div>
            <div><p className="text-xs text-muted-foreground">Og'irlik</p><Badge className={cn("text-xs", severityColors[selectedEmergency.severity])}>{selectedEmergency.severity}</Badge></div>
            <div><p className="text-xs text-muted-foreground">Status</p><Badge className={cn("text-xs", statusColors[selectedEmergency.status])}>{statusLabels[selectedEmergency.status]}</Badge></div>
            <div><p className="text-xs text-muted-foreground">Shifokor</p><p className="font-medium">{getDoctorName(selectedEmergency.assigned_doctor_id) || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Manzil</p><p className="font-medium">{selectedEmergency.location || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Chaqiruv vaqti</p><p className="font-medium">{new Date(selectedEmergency.created_at).toLocaleString("uz")}</p></div>
            {selectedEmergency.arrival_time && <div><p className="text-xs text-muted-foreground">Yetib borish</p><p className="font-medium">{new Date(selectedEmergency.arrival_time).toLocaleString("uz")}</p></div>}
            {selectedEmergency.ambulance_dispatched && <div><p className="text-xs text-muted-foreground">Ambulans</p><p className="font-medium flex items-center gap-1"><Ambulance className="w-4 h-4" /> {selectedEmergency.ambulance_plate || "Yuborildi"}</p></div>}
          </div>
          {selectedEmergency.description && <div className="mt-4 p-3 bg-muted/50 rounded-lg"><p className="text-sm">{selectedEmergency.description}</p></div>}
          {selectedEmergency.resolution && <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"><p className="text-sm text-green-800 dark:text-green-200">✅ {selectedEmergency.resolution}</p></div>}
        </div>
      )}

      {/* Emergency list */}
      <div className="space-y-3">
        {filtered.map(em => (
          <div key={em.id} className={cn("bg-card rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-all", em.severity === "critical" ? "border-destructive/50 shadow-red-100 dark:shadow-red-900/20" : "border-border")} onClick={() => setSelectedEmergency(em)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", em.severity === "critical" ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-destructive/10")}>
                  <Siren className={cn("w-5 h-5", em.severity !== "critical" && "text-destructive")} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm">{em.patient_name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                    <span>{typeLabels[em.emergency_type] || em.emergency_type}</span>
                    {em.location && <><MapPin className="w-3 h-3" />{em.location}</>}
                    {getDoctorName(em.assigned_doctor_id) && <><Users className="w-3 h-3" />Dr. {getDoctorName(em.assigned_doctor_id)}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-[10px]", severityColors[em.severity])}>{em.severity}</Badge>
                <Badge className={cn("text-[10px]", statusColors[em.status])}>{statusLabels[em.status] || em.status}</Badge>
                {em.ambulance_dispatched && <Badge variant="outline" className="text-[10px]"><Ambulance className="w-3 h-3 mr-1" /> {em.ambulance_plate || "Yuborildi"}</Badge>}
              </div>
            </div>
            {em.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{em.description}</p>}
            <div className="flex items-center gap-2 mt-3 flex-wrap" onClick={e => e.stopPropagation()}>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(em.created_at).toLocaleString("uz")}</span>
              <div className="ml-auto flex gap-1">
                {em.status === "reported" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(em.id, "dispatched")}>🚑 Yuborish</Button>}
                {em.status === "dispatched" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(em.id, "en_route")}>🛣️ Yo'lda</Button>}
                {em.status === "en_route" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(em.id, "treating")}>🏥 Yetib keldi</Button>}
                {em.status === "treating" && <Button size="sm" variant="outline" className="text-xs h-7 text-green-700" onClick={() => updateStatus(em.id, "resolved")}>✅ Hal qilish</Button>}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(em); setForm({ patient_name: em.patient_name, patient_phone: em.patient_phone || "", patient_id: em.patient_id || "", emergency_type: em.emergency_type, severity: em.severity, description: em.description || "", location: em.location || "", ambulance_dispatched: em.ambulance_dispatched, ambulance_plate: em.ambulance_plate || "", assigned_doctor_id: em.assigned_doctor_id || "" }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(em.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Shoshilinch holatlar yo'q</p>}
    </div>
  );
};

export default HMSEmergency;
