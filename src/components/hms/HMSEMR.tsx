import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, FileText, Search, Calendar, User, Activity, Pill, TestTube, Stethoscope, Heart, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import HMSPatient360 from "./HMSPatient360";

interface Props { clinicId: string; }

const HMSEMR = ({ clinicId }: Props) => {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"records" | "timeline" | "profile">("records");
  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", record_date: new Date().toISOString().split("T")[0],
    record_type: "visit", diagnosis: "", symptoms: "", treatment: "", follow_up_date: "", notes: "", is_confidential: false
  });

  const fetchData = async () => {
    const [recRes, patRes, docRes] = await Promise.all([
      supabase.from("hms_medical_records").select("*").eq("clinic_id", clinicId).order("record_date", { ascending: false }),
      supabase.from("hms_patients").select("*").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setRecords(recRes.data || []);
    setPatients(patRes.data || []);
    setDoctors(docRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ patient_id: "", doctor_id: "", record_date: new Date().toISOString().split("T")[0], record_type: "visit", diagnosis: "", symptoms: "", treatment: "", follow_up_date: "", notes: "", is_confidential: false });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.patient_id) { toast({ title: "Bemor majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, doctor_id: form.doctor_id || null, follow_up_date: form.follow_up_date || null, clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_medical_records").update(payload).eq("id", editing.id);
      toast({ title: "✅ Yozuv yangilandi" });
    } else {
      await supabase.from("hms_medical_records").insert(payload);
      toast({ title: "✅ Yozuv qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_medical_records").delete().eq("id", id);
    toast({ title: "Yozuv o'chirildi" }); fetchData();
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.full_name || "—";
  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "";

  const filtered = records.filter(r => {
    const matchSearch = !search || getPatientName(r.patient_id).toLowerCase().includes(search.toLowerCase()) || r.diagnosis?.toLowerCase().includes(search.toLowerCase());
    const matchPatient = !selectedPatient || r.patient_id === selectedPatient;
    return matchSearch && matchPatient;
  });

  const typeLabels: Record<string, string> = { visit: "Qabul", diagnosis: "Tashxis", procedure: "Protsedura", lab: "Laboratoriya", imaging: "Tasvir", referral: "Yo'llama", follow_up: "Qayta qabul" };
  const typeIcons: Record<string, any> = { visit: Stethoscope, diagnosis: Activity, procedure: Heart, lab: TestTube, imaging: FileText, referral: User, follow_up: Calendar };
  const typeColors: Record<string, string> = { visit: "bg-blue-100 text-blue-800", diagnosis: "bg-purple-100 text-purple-800", procedure: "bg-green-100 text-green-800", lab: "bg-orange-100 text-orange-800", imaging: "bg-cyan-100 text-cyan-800", referral: "bg-pink-100 text-pink-800", follow_up: "bg-yellow-100 text-yellow-800" };

  // Stats
  const typePie = Object.entries(typeLabels).map(([k, v]) => ({ name: v, value: records.filter(r => r.record_type === k).length })).filter(d => d.value > 0);
  const PIE_COLORS = ["hsl(var(--primary))", "#8b5cf6", "#22c55e", "#f97316", "#06b6d4", "#ec4899", "#eab308"];

  const monthlyData = records.reduce((acc: any, r) => {
    const month = r.record_date?.slice(0, 7);
    if (month) acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(monthlyData).sort().slice(-12).map(([month, count]) => ({ month, count }));

  const openPatientProfile = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    if (p) {
      setPatientProfile(p);
      setSelectedPatient(patientId);
      setActiveTab("profile");
    }
  };

  // Detail view
  if (selectedRecord) {
    const r = selectedRecord;
    const Icon = typeIcons[r.record_type] || FileText;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)} className="mb-4">← Orqaga</Button>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", typeColors[r.record_type]?.replace("text-", "bg-").split(" ")[0] + "/20" || "bg-primary/10")}>
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">{typeLabels[r.record_type] || r.record_type}</h2>
              <p className="text-sm text-muted-foreground">{getPatientName(r.patient_id)} • {r.record_date}</p>
            </div>
            {r.is_confidential && <Badge className="ml-auto bg-red-100 text-red-800">🔒 Maxfiy</Badge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-2">👤 Bemor</h3>
                <p className="text-sm text-muted-foreground cursor-pointer hover:text-primary" onClick={() => openPatientProfile(r.patient_id)}>{getPatientName(r.patient_id)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-2">👨‍⚕️ Shifokor</h3>
                <p className="text-sm text-muted-foreground">{getDoctorName(r.doctor_id) ? `Dr. ${getDoctorName(r.doctor_id)}` : "—"}</p>
              </div>
              {r.diagnosis && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">🔬 Tashxis</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">{r.diagnosis}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {r.symptoms && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">🤒 Alomatlar</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">{r.symptoms}</p>
                </div>
              )}
              {r.treatment && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">💊 Davolash</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">{r.treatment}</p>
                </div>
              )}
              {r.notes && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">📝 Eslatmalar</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">{r.notes}</p>
                </div>
              )}
            </div>
          </div>

          {r.follow_up_date && (
            <div className="mt-4 bg-primary/5 rounded-xl p-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-sm text-primary font-medium">Qayta qabul: {r.follow_up_date}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Patient 360° profile (full EMR)
  if (activeTab === "profile" && patientProfile) {
    return (
      <HMSPatient360
        clinicId={clinicId}
        patient={patientProfile}
        onBack={() => { setActiveTab("records"); setPatientProfile(null); setSelectedPatient(""); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Elektron tibbiy karta (EMR)</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi yozuv</Button>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami yozuvlar</p>
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Bemorlar</p>
          <p className="text-2xl font-bold text-primary">{new Set(records.map(r => r.patient_id)).size}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Bugungi</p>
          <p className="text-2xl font-bold text-green-600">{records.filter(r => r.record_date === new Date().toISOString().split("T")[0]).length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Maxfiy</p>
          <p className="text-2xl font-bold text-destructive">{records.filter(r => r.is_confidential).length}</p>
        </div>
      </div>

      {/* Charts */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {typePie.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground text-sm mb-3">Yozuv turlari</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={typePie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value as number}`}>
                    {typePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {chartData.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground text-sm mb-3">Oylik dinamika</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedPatient} onChange={e => { setSelectedPatient(e.target.value); if (e.target.value) openPatientProfile(e.target.value); }}>
          <option value="">Barcha bemorlar</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi tibbiy yozuv"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Bemor tanlang *</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Shifokor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <Input type="date" value={form.record_date} onChange={e => setForm({ ...form, record_date: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.record_type} onChange={e => setForm({ ...form, record_type: e.target.value })}>
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Input placeholder="Tashxis" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
            <Input placeholder="Alomatlar" value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} />
            <Input placeholder="Davolash" value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} className="md:col-span-2" />
            <Input type="date" placeholder="Qayta qabul sanasi" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
            <Input placeholder="Eslatmalar" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.is_confidential} onChange={e => setForm({ ...form, is_confidential: e.target.checked })} /> Maxfiy
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(r => {
          const Icon = typeIcons[r.record_type] || FileText;
          return (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedRecord(r)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeColors[r.record_type] || "bg-primary/10")}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-sm">{getPatientName(r.patient_id)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {r.record_date} {getDoctorName(r.doctor_id) && `• Dr. ${getDoctorName(r.doctor_id)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Badge className={cn("text-[10px]", typeColors[r.record_type] || "bg-muted text-muted-foreground")}>{typeLabels[r.record_type] || r.record_type}</Badge>
                  {r.is_confidential && <Badge className="text-[10px] bg-red-100 text-red-800">🔒 Maxfiy</Badge>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Bemor 360°" onClick={() => openPatientProfile(r.patient_id)}><UserCircle2 className="w-3.5 h-3.5 text-primary" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(r); setForm({ patient_id: r.patient_id, doctor_id: r.doctor_id || "", record_date: r.record_date, record_type: r.record_type, diagnosis: r.diagnosis || "", symptoms: r.symptoms || "", treatment: r.treatment || "", follow_up_date: r.follow_up_date || "", notes: r.notes || "", is_confidential: r.is_confidential }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
              {(r.diagnosis || r.symptoms || r.treatment) && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {r.diagnosis && <div><span className="font-semibold text-foreground">Tashxis:</span> <span className="text-muted-foreground">{r.diagnosis}</span></div>}
                  {r.symptoms && <div><span className="font-semibold text-foreground">Alomatlar:</span> <span className="text-muted-foreground">{r.symptoms}</span></div>}
                  {r.treatment && <div><span className="font-semibold text-foreground">Davolash:</span> <span className="text-muted-foreground">{r.treatment}</span></div>}
                </div>
              )}
              {r.follow_up_date && <p className="text-xs text-primary mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Qayta qabul: {r.follow_up_date}</p>}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Tibbiy yozuvlar yo'q</p>}
    </div>
  );
};

export default HMSEMR;