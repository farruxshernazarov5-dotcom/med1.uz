import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Pill, FileText, Printer, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

interface Medication { name: string; dosage: string; frequency: string; duration: string; }

const HMSPrescription = ({ clinicId }: Props) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [viewRx, setViewRx] = useState<any>(null);
  const [form, setForm] = useState({ patient_name: "", doctor_id: "", diagnosis: "", instructions: "", notes: "" });
  const [meds, setMeds] = useState<Medication[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);

  const fetchData = async () => {
    const [rxRes, dRes] = await Promise.all([
      supabase.from("hms_prescriptions").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(200),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setPrescriptions(rxRes.data || []);
    setDoctors(dRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ patient_name: "", doctor_id: "", diagnosis: "", instructions: "", notes: "" }); setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]); setShowForm(false); };

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

  const addMed = () => setMeds([...meds, { name: "", dosage: "", frequency: "", duration: "" }]);
  const updateMed = (i: number, field: keyof Medication, val: string) => {
    const updated = [...meds]; updated[i] = { ...updated[i], [field]: val }; setMeds(updated);
  };
  const removeMed = (i: number) => setMeds(meds.filter((_, idx) => idx !== i));

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "—";
  const filtered = prescriptions.filter(r => !search || r.patient_name.toLowerCase().includes(search.toLowerCase()) || r.qr_code?.includes(search));

  const printRx = (rx: any) => {
    const meds = Array.isArray(rx.medications) ? rx.medications : [];
    const html = `<html><head><title>Retsept - ${rx.qr_code}</title><style>body{font-family:Arial;padding:40px}h1{color:#1a5f7a}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f0f0f0}.code{font-size:24px;font-weight:bold;color:#1a5f7a}</style></head><body>
    <h1>🏥 Retsept</h1><p class="code">${rx.qr_code}</p>
    <p><b>Bemor:</b> ${rx.patient_name}</p><p><b>Shifokor:</b> Dr. ${getDoctorName(rx.doctor_id)}</p><p><b>Tashxis:</b> ${rx.diagnosis || "—"}</p><p><b>Sana:</b> ${rx.prescription_date}</p><p><b>Amal qilish:</b> ${rx.valid_until || "—"}</p>
    <table><tr><th>Dori nomi</th><th>Dozasi</th><th>Qabul qilish</th><th>Davomiylik</th></tr>
    ${meds.map((m: any) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`).join("")}
    </table><p><b>Ko'rsatmalar:</b> ${rx.instructions || "—"}</p><p><b>Izoh:</b> ${rx.notes || "—"}</p>
    </body></html>`;
    const w = window.open("", "_blank"); w?.document.write(html); w?.document.close(); w?.print();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Dori retseptlari (e-Prescription)</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi retsept</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jami retseptlar", value: prescriptions.length },
          { label: "Faol", value: prescriptions.filter(r => r.status === "active").length, color: "text-green-600" },
          { label: "Bugun", value: prescriptions.filter(r => r.prescription_date === new Date().toISOString().split("T")[0]).length, color: "text-blue-600" },
          { label: "Muddati o'tgan", value: prescriptions.filter(r => r.valid_until && r.valid_until < new Date().toISOString().split("T")[0]).length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color || "text-foreground")}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input className="pl-9" placeholder="Bemor yoki retsept kodi bo'yicha qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Yangi retsept</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Shifokor tanlang</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>)}
            </select>
            <Input placeholder="Tashxis" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
          </div>
          <h4 className="font-semibold text-foreground text-sm mb-2">Dorilar</h4>
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

      {viewRx && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Retsept: {viewRx.qr_code}</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => printRx(viewRx)}><Printer className="w-4 h-4 mr-1" /> Chop etish</Button>
              <Button variant="ghost" size="icon" onClick={() => setViewRx(null)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
            <p><span className="text-muted-foreground">Bemor:</span> <b>{viewRx.patient_name}</b></p>
            <p><span className="text-muted-foreground">Shifokor:</span> Dr. {getDoctorName(viewRx.doctor_id)}</p>
            <p><span className="text-muted-foreground">Tashxis:</span> {viewRx.diagnosis || "—"}</p>
            <p><span className="text-muted-foreground">Sana:</span> {viewRx.prescription_date}</p>
          </div>
          <div className="border border-border rounded-xl overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="p-2 text-left text-muted-foreground">Dori</th><th className="p-2 text-left text-muted-foreground">Doza</th><th className="p-2 text-left text-muted-foreground">Qabul</th><th className="p-2 text-left text-muted-foreground">Davomiylik</th></tr></thead>
              <tbody>{(Array.isArray(viewRx.medications) ? viewRx.medications : []).map((m: any, i: number) => (
                <tr key={i} className="border-t border-border"><td className="p-2 font-semibold text-foreground">{m.name}</td><td className="p-2 text-foreground">{m.dosage}</td><td className="p-2 text-foreground">{m.frequency}</td><td className="p-2 text-foreground">{m.duration}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setViewRx(r)}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{r.patient_name} <span className="text-xs text-muted-foreground ml-2">{r.qr_code}</span></p>
                <p className="text-xs text-muted-foreground">Dr. {getDoctorName(r.doctor_id)} • {r.prescription_date} • {(Array.isArray(r.medications) ? r.medications : []).length} ta dori</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[10px]", r.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>{r.status === "active" ? "Faol" : r.status}</Badge>
              <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); printRx(r); }}><Printer className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Retseptlar yo'q</p>}
      </div>
    </div>
  );
};

export default HMSPrescription;
