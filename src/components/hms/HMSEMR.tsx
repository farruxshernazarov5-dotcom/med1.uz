import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, FileText, Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSEMR = ({ clinicId }: Props) => {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", record_date: new Date().toISOString().split("T")[0],
    record_type: "visit", diagnosis: "", symptoms: "", treatment: "", follow_up_date: "", notes: "", is_confidential: false
  });

  const fetchData = async () => {
    const [recRes, patRes, docRes] = await Promise.all([
      supabase.from("hms_medical_records").select("*").eq("clinic_id", clinicId).order("record_date", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("doctors").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Tibbiy kartalar (EMR) ({records.length})</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi yozuv</Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
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
        {filtered.map(r => (
          <div key={r.id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm">{getPatientName(r.patient_id)}</h3>
                  <p className="text-xs text-muted-foreground">
                    {r.record_date} {getDoctorName(r.doctor_id) && `• Dr. ${getDoctorName(r.doctor_id)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{typeLabels[r.record_type] || r.record_type}</Badge>
                {r.is_confidential && <Badge className="text-[10px] bg-red-100 text-red-800">Maxfiy</Badge>}
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
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Tibbiy yozuvlar yo'q</p>}
    </div>
  );
};

export default HMSEMR;
