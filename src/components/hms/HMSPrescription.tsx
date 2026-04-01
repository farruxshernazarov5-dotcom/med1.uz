import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Pill, FileText, Printer, Search, AlertTriangle, Sparkles, Send, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";

interface Props { clinicId: string; }
interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions?: string; }

// Common drug interactions warning database (demo)
const DRUG_INTERACTIONS: Record<string, string[]> = {
  "aspirin": ["warfarin", "ibuprofen", "diklofenak"],
  "warfarin": ["aspirin", "ibuprofen", "paratsetamol"],
  "ibuprofen": ["aspirin", "warfarin", "prednizolon"],
  "metformin": ["alkogol", "kontrast modda"],
  "enalapril": ["kaliysaqlagan diuretiklar", "spironolakton"],
};

// Smart suggestion templates
const RX_TEMPLATES = [
  { diagnosis: "ORVI / Shamollash", meds: [{ name: "Paratsetamol", dosage: "500mg", frequency: "Kuniga 3 marta", duration: "5 kun" }, { name: "Vitamin C", dosage: "1000mg", frequency: "Kuniga 1 marta", duration: "10 kun" }] },
  { diagnosis: "Gipertoniya", meds: [{ name: "Enalapril", dosage: "10mg", frequency: "Kuniga 2 marta", duration: "Doimiy" }, { name: "Amlodipine", dosage: "5mg", frequency: "Kuniga 1 marta", duration: "Doimiy" }] },
  { diagnosis: "Diabet (2-tur)", meds: [{ name: "Metformin", dosage: "500mg", frequency: "Kuniga 2 marta", duration: "Doimiy" }] },
  { diagnosis: "Gastrit", meds: [{ name: "Omeprazol", dosage: "20mg", frequency: "Kuniga 1 marta ovqatdan oldin", duration: "14 kun" }, { name: "Antatsid", dosage: "10ml", frequency: "Kuniga 3 marta ovqatdan keyin", duration: "10 kun" }] },
];

const HMSPrescription = ({ clinicId }: Props) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinicName, setClinicName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [viewRx, setViewRx] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ patient_name: "", doctor_id: "", diagnosis: "", instructions: "", notes: "" });
  const [meds, setMeds] = useState<Medication[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchData = async () => {
    const [rxRes, dRes, cRes] = await Promise.all([
      supabase.from("hms_prescriptions").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(500),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("registered_clinics").select("name").eq("id", clinicId).single(),
    ]);
    setPrescriptions(rxRes.data || []);
    setDoctors(dRes.data || []);
    setClinicName(cRes.data?.name || "");
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  // Check drug interactions
  useEffect(() => {
    const medNames = meds.map(m => m.name.toLowerCase()).filter(Boolean);
    const warns: string[] = [];
    medNames.forEach(drug => {
      const interactions = DRUG_INTERACTIONS[drug];
      if (interactions) {
        medNames.forEach(other => {
          if (drug !== other && interactions.includes(other)) {
            warns.push(`⚠️ ${drug} va ${other} birgalikda qo'llanilmasligi kerak!`);
          }
        });
      }
    });
    setWarnings([...new Set(warns)]);
  }, [meds]);

  const resetForm = () => { setForm({ patient_name: "", doctor_id: "", diagnosis: "", instructions: "", notes: "" }); setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]); setShowForm(false); setWarnings([]); };

  const handleCreate = async () => {
    if (!form.patient_name || meds.every(m => !m.name)) { toast({ title: "Bemor va dori nomi majburiy!", variant: "destructive" }); return; }
    const validMeds = meds.filter(m => m.name);
    const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);
    await supabase.from("hms_prescriptions").insert([{
      clinic_id: clinicId, patient_name: form.patient_name, doctor_id: form.doctor_id || null,
      diagnosis: form.diagnosis, medications: validMeds as any, instructions: form.instructions,
      notes: form.notes, valid_until: validUntil.toISOString().split("T")[0],
      qr_code: `RX-${Date.now().toString(36).toUpperCase()}`
    }]);
    toast({ title: "✅ Retsept yaratildi" }); resetForm(); fetchData();
  };

  const applyTemplate = (tpl: typeof RX_TEMPLATES[0]) => {
    setForm({ ...form, diagnosis: tpl.diagnosis });
    setMeds(tpl.meds.map(m => ({ ...m, instructions: "" })));
    toast({ title: `📋 "${tpl.diagnosis}" shabloni qo'llanildi` });
  };

  const addMed = () => setMeds([...meds, { name: "", dosage: "", frequency: "", duration: "" }]);
  const updateMed = (i: number, field: keyof Medication, val: string) => {
    const updated = [...meds]; updated[i] = { ...updated[i], [field]: val }; setMeds(updated);
  };
  const removeMed = (i: number) => setMeds(meds.filter((_, idx) => idx !== i));

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "—";

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("hms_prescriptions").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData(); setViewRx(null);
  };

  const filtered = prescriptions.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch = !search || r.patient_name.toLowerCase().includes(search.toLowerCase()) || r.qr_code?.includes(search);
    return matchFilter && matchSearch;
  });

  // Stats
  const todayStr = new Date().toISOString().split("T")[0];
  const active = prescriptions.filter(r => r.status === "active").length;
  const today = prescriptions.filter(r => r.prescription_date === todayStr).length;
  const expired = prescriptions.filter(r => r.valid_until && r.valid_until < todayStr).length;
  const completed = prescriptions.filter(r => r.status === "completed").length;

  // Top medicines chart
  const medCounts: Record<string, number> = {};
  prescriptions.forEach(r => {
    (Array.isArray(r.medications) ? r.medications : []).forEach((m: any) => {
      medCounts[m.name] = (medCounts[m.name] || 0) + 1;
    });
  });
  const topMeds = Object.entries(medCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  // Monthly stats
  const monthlyData: Record<string, number> = {};
  prescriptions.forEach(r => {
    const m = r.prescription_date?.slice(0, 7) || "";
    monthlyData[m] = (monthlyData[m] || 0) + 1;
  });
  const monthChart = Object.entries(monthlyData).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }));

  const printRx = (rx: any) => {
    const rxMeds = Array.isArray(rx.medications) ? rx.medications : [];
    const html = `<html><head><title>Retsept - ${rx.qr_code}</title><style>body{font-family:Arial;padding:40px;max-width:700px;margin:auto}h1{color:#1a5f7a;border-bottom:2px solid #1a5f7a;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f0f8ff}.code{font-size:20px;font-weight:bold;color:#1a5f7a;background:#f0f8ff;padding:8px 16px;border-radius:8px;display:inline-block}.footer{margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:12px;color:#666}</style></head><body>
    <h1>🏥 ${clinicName || "Med1.uz"} — Retsept</h1><p class="code">${rx.qr_code}</p>
    <p><b>Bemor:</b> ${rx.patient_name}</p><p><b>Shifokor:</b> Dr. ${getDoctorName(rx.doctor_id)}</p><p><b>Tashxis:</b> ${rx.diagnosis || "—"}</p><p><b>Sana:</b> ${rx.prescription_date}</p><p><b>Amal qilish:</b> ${rx.valid_until || "—"}</p>
    <table><tr><th>Dori nomi</th><th>Dozasi</th><th>Qabul qilish</th><th>Davomiylik</th></tr>
    ${rxMeds.map((m: any) => `<tr><td><b>${m.name}</b></td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`).join("")}
    </table><p><b>Ko'rsatmalar:</b> ${rx.instructions || "—"}</p><p><b>Izoh:</b> ${rx.notes || "—"}</p>
    <div class="footer"><p>Med1.uz — Tibbiy platforma</p><p>⚠️ Bu retsept faqat ko'rsatilgan muddatgacha amal qiladi</p></div>
    </body></html>`;
    const w = window.open("", "_blank"); w?.document.write(html); w?.document.close(); w?.print();
  };

  const reportData: HMSReportData = {
    title: "Retseptlar hisoboti", moduleType: "HMS Retseptlar", clinicName,
    kpiCards: [
      { label: "Jami", value: String(prescriptions.length) },
      { label: "Faol", value: String(active) },
      { label: "Bugun", value: String(today) },
      { label: "Bajarilgan", value: String(completed) },
    ],
    sections: [{ heading: "Statistika", content: `Jami retseptlar: ${prescriptions.length}\nFaol: ${active}\nBugun yozilgan: ${today}\nMuddati o'tgan: ${expired}` }],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Dori retseptlari (e-Prescription)</h2>
        <div className="flex gap-2">
          <HMSDownloadMenu data={reportData} />
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi retsept</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Jami retseptlar", value: prescriptions.length, icon: FileText, color: "text-foreground" },
          { label: "Faol", value: active, icon: CheckCircle2, color: "text-green-600" },
          { label: "Bugun", value: today, icon: Clock, color: "text-blue-600" },
          { label: "Bajarilgan", value: completed, icon: Pill, color: "text-primary" },
          { label: "Muddati o'tgan", value: expired, icon: AlertTriangle, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="list">Ro'yxat</TabsTrigger>
          <TabsTrigger value="templates">Shablonlar</TabsTrigger>
          <TabsTrigger value="analytics">Statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {/* Search & Filter */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Bemor yoki retsept kodi bo'yicha qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {[{ id: "all", label: "Barchasi" }, { id: "active", label: "Faol" }, { id: "completed", label: "Bajarilgan" }].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">Yangi retsept</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>

              {/* Smart Templates */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Tayyor shablonlardan foydalaning:</p>
                <div className="flex gap-2 flex-wrap">
                  {RX_TEMPLATES.map((tpl, i) => (
                    <button key={i} onClick={() => applyTemplate(tpl)} className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">{tpl.diagnosis}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
                  <option value="">Shifokor tanlang</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>)}
                </select>
                <Input placeholder="Tashxis" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
              </div>

              {/* Drug Interaction Warnings */}
              {warnings.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-1"><AlertTriangle className="w-4 h-4" /> Dorilar o'zaro ta'sir ogohlantirishlari:</p>
                  {warnings.map((w, i) => <p key={i} className="text-xs text-red-600 dark:text-red-300">{w}</p>)}
                </div>
              )}

              <h4 className="font-semibold text-foreground text-sm mb-2">💊 Dorilar</h4>
              {meds.map((m, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                  <Input placeholder="Dori nomi *" value={m.name} onChange={e => updateMed(i, "name", e.target.value)} />
                  <Input placeholder="Dozasi (500mg)" value={m.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} />
                  <Input placeholder="Kuniga 3 marta" value={m.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} />
                  <Input placeholder="7 kun" value={m.duration} onChange={e => updateMed(i, "duration", e.target.value)} />
                  {meds.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeMed(i)}><X className="w-4 h-4 text-destructive" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" className="mb-3" onClick={addMed}><Plus className="w-3 h-3 mr-1" /> Dori qo'shish</Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Ko'rsatmalar" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
                <Input placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleCreate}>Yaratish</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          {/* Detail View */}
          {viewRx && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground">Retsept: {viewRx.qr_code}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => printRx(viewRx)}><Printer className="w-4 h-4 mr-1" /> Chop etish</Button>
                  {viewRx.status === "active" && <Button size="sm" variant="outline" onClick={() => updateStatus(viewRx.id, "completed")} className="text-green-600"><CheckCircle2 className="w-4 h-4 mr-1" /> Bajarildi</Button>}
                  <Button variant="ghost" size="icon" onClick={() => setViewRx(null)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                <p><span className="text-muted-foreground">Bemor:</span> <b>{viewRx.patient_name}</b></p>
                <p><span className="text-muted-foreground">Shifokor:</span> Dr. {getDoctorName(viewRx.doctor_id)}</p>
                <p><span className="text-muted-foreground">Tashxis:</span> {viewRx.diagnosis || "—"}</p>
                <p><span className="text-muted-foreground">Sana:</span> {viewRx.prescription_date}</p>
                <p><span className="text-muted-foreground">Amal qilish:</span> {viewRx.valid_until || "—"}</p>
                <p><span className="text-muted-foreground">Status:</span> <Badge className={cn("text-[10px]", viewRx.status === "active" ? "bg-green-100 text-green-800" : viewRx.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground")}>{viewRx.status === "active" ? "Faol" : viewRx.status === "completed" ? "Bajarilgan" : viewRx.status}</Badge></p>
              </div>
              <div className="border border-border rounded-xl overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead className="bg-muted"><tr><th className="p-3 text-left text-muted-foreground">Dori</th><th className="p-3 text-left text-muted-foreground">Doza</th><th className="p-3 text-left text-muted-foreground">Qabul</th><th className="p-3 text-left text-muted-foreground">Davomiylik</th></tr></thead>
                  <tbody>{(Array.isArray(viewRx.medications) ? viewRx.medications : []).map((m: any, i: number) => (
                    <tr key={i} className="border-t border-border"><td className="p-3 font-semibold text-foreground"><Pill className="w-3 h-3 inline mr-1 text-primary" />{m.name}</td><td className="p-3 text-foreground">{m.dosage}</td><td className="p-3 text-foreground">{m.frequency}</td><td className="p-3 text-foreground">{m.duration}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              {viewRx.instructions && <p className="text-sm text-foreground mb-1"><b>Ko'rsatmalar:</b> {viewRx.instructions}</p>}
              {viewRx.notes && <p className="text-sm text-muted-foreground"><b>Izoh:</b> {viewRx.notes}</p>}
            </div>
          )}

          {/* Prescriptions List */}
          <div className="space-y-2">
            {filtered.map(r => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setViewRx(r)}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", r.status === "active" ? "bg-green-100 dark:bg-green-900/30" : r.status === "completed" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted")}>
                    <FileText className={cn("w-5 h-5", r.status === "active" ? "text-green-600" : r.status === "completed" ? "text-blue-600" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{r.patient_name} <span className="text-xs text-muted-foreground ml-2">{r.qr_code}</span></p>
                    <p className="text-xs text-muted-foreground">Dr. {getDoctorName(r.doctor_id)} • {r.prescription_date} • {(Array.isArray(r.medications) ? r.medications : []).length} ta dori</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[10px]", r.status === "active" ? "bg-green-100 text-green-800" : r.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground")}>{r.status === "active" ? "Faol" : r.status === "completed" ? "Bajarilgan" : r.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); printRx(r); }}><Printer className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Retseptlar yo'q</p>}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <h3 className="font-heading font-bold text-foreground mb-4">📋 Tayyor retsept shablonlari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RX_TEMPLATES.map((tpl, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <h4 className="font-bold text-foreground mb-3">{tpl.diagnosis}</h4>
                <div className="space-y-2 mb-3">
                  {tpl.meds.map((m, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Pill className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">{m.name}</span>
                      <span className="text-muted-foreground">• {m.dosage} • {m.frequency} • {m.duration}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={() => { applyTemplate(tpl); setShowForm(true); }}><Sparkles className="w-3 h-3 mr-1" /> Shablondan yaratish</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {topMeds.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Eng ko'p yozilgan dorilar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={topMeds} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {topMeds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Oylik retseptlar soni</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthChart}><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSPrescription;
