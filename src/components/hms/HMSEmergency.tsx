import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, Siren, Ambulance, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSEmergency = ({ clinicId }: Props) => {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("active");
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
    await supabase.from("hms_emergency").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_emergency").delete().eq("id", id);
    toast({ title: "O'chirildi" }); fetchData();
  };

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "";
  const activeStatuses = ["reported", "dispatched", "en_route", "treating"];
  const filtered = filter === "active" ? emergencies.filter(e => activeStatuses.includes(e.status)) : filter === "all" ? emergencies : emergencies.filter(e => e.status === filter);

  const severityColors: Record<string, string> = { critical: "bg-red-600 text-white", severe: "bg-red-100 text-red-800", moderate: "bg-yellow-100 text-yellow-800", mild: "bg-green-100 text-green-800" };
  const statusColors: Record<string, string> = { reported: "bg-red-100 text-red-800", dispatched: "bg-orange-100 text-orange-800", en_route: "bg-yellow-100 text-yellow-800", treating: "bg-blue-100 text-blue-800", resolved: "bg-green-100 text-green-800" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-destructive flex items-center gap-2"><Siren className="w-5 h-5" /> Tez yordam ({emergencies.filter(e => activeStatuses.includes(e.status)).length} faol)</h2>
        <Button size="sm" className="bg-destructive text-destructive-foreground" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Shoshilinch holat</Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[{ id: "active", label: "Faol" }, { id: "all", label: "Barchasi" }, { id: "resolved", label: "Hal qilingan" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border-2 border-destructive/30 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi shoshilinch holat"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
            <Input placeholder="Telefon" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.emergency_type} onChange={e => setForm({ ...form, emergency_type: e.target.value })}>
              <option value="general">Umumiy</option>
              <option value="cardiac">Yurak</option>
              <option value="trauma">Travma</option>
              <option value="respiratory">Nafas</option>
              <option value="neurological">Nevrologik</option>
              <option value="poisoning">Zaharlanish</option>
              <option value="obstetric">Tug'ruq</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              <option value="mild">Engil</option>
              <option value="moderate">O'rtacha</option>
              <option value="severe">Og'ir</option>
              <option value="critical">Kritik</option>
            </select>
            <Input placeholder="Manzil/Joylashuv" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.assigned_doctor_id} onChange={e => setForm({ ...form, assigned_doctor_id: e.target.value })}>
              <option value="">Shifokor tayinlash</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <Input placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.ambulance_dispatched} onChange={e => setForm({ ...form, ambulance_dispatched: e.target.checked })} /> Ambulans yuborildi
            </label>
            {form.ambulance_dispatched && <Input placeholder="Avtomobil raqami" value={form.ambulance_plate} onChange={e => setForm({ ...form, ambulance_plate: e.target.value })} />}
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="bg-destructive text-destructive-foreground" onClick={handleSave}>{editing ? "Yangilash" : "Qo'shish"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(em => (
          <div key={em.id} className={cn("bg-card rounded-2xl border p-5", em.severity === "critical" ? "border-destructive/50" : "border-border")}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", em.severity === "critical" ? "bg-destructive text-destructive-foreground" : "bg-destructive/10")}>
                  <Siren className={cn("w-5 h-5", em.severity !== "critical" && "text-destructive")} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm">{em.patient_name}</h3>
                  <p className="text-xs text-muted-foreground">{em.emergency_type} {em.location && `• ${em.location}`} {getDoctorName(em.assigned_doctor_id) && `• Dr. ${getDoctorName(em.assigned_doctor_id)}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-[10px]", severityColors[em.severity])}>{em.severity}</Badge>
                <Badge className={cn("text-[10px]", statusColors[em.status])}>{em.status}</Badge>
                {em.ambulance_dispatched && <Badge variant="outline" className="text-[10px]"><Ambulance className="w-3 h-3 mr-1" /> {em.ambulance_plate || "Yuborildi"}</Badge>}
              </div>
            </div>
            {em.description && <p className="text-xs text-muted-foreground mt-2">{em.description}</p>}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(em.created_at).toLocaleString("uz")}</span>
              <div className="ml-auto flex gap-1">
                {em.status === "reported" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(em.id, "dispatched")}>Yuborish</Button>}
                {em.status === "dispatched" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(em.id, "en_route")}>Yo'lda</Button>}
                {em.status === "en_route" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(em.id, "treating")}>Davolash</Button>}
                {em.status === "treating" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(em.id, "resolved")}>Hal qilish</Button>}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(em); setForm({ patient_name: em.patient_name, patient_phone: em.patient_phone || "", patient_id: em.patient_id || "", emergency_type: em.emergency_type, severity: em.severity, description: em.description, location: em.location, ambulance_dispatched: em.ambulance_dispatched, ambulance_plate: em.ambulance_plate, assigned_doctor_id: em.assigned_doctor_id || "" }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
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
