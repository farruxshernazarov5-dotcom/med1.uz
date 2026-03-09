import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, BedDouble, User, X, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSBeds = ({ clinicId }: Props) => {
  const [beds, setBeds] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ bed_number: "", room_number: "", floor: "", bed_type: "standard", department_id: "", daily_rate: 0 });

  const fetchData = async () => {
    const [bedRes, deptRes, patRes] = await Promise.all([
      supabase.from("hms_beds").select("*").eq("clinic_id", clinicId).order("bed_number"),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setBeds(bedRes.data || []);
    setDepartments(deptRes.data || []);
    setPatients(patRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ bed_number: "", room_number: "", floor: "", bed_type: "standard", department_id: "", daily_rate: 0 }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.bed_number) { toast({ title: "To'shak raqami majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, daily_rate: Number(form.daily_rate), clinic_id: clinicId, department_id: form.department_id || null };
    if (editing) {
      await supabase.from("hms_beds").update(payload).eq("id", editing.id);
      toast({ title: "✅ To'shak yangilandi" });
    } else {
      await supabase.from("hms_beds").insert(payload);
      toast({ title: "✅ To'shak qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_beds").delete().eq("id", id);
    toast({ title: "To'shak o'chirildi" }); fetchData();
  };

  const handleAssignPatient = async (bedId: string, patientId: string | null) => {
    await supabase.from("hms_beds").update({
      patient_id: patientId, status: patientId ? "occupied" : "available",
      admitted_at: patientId ? new Date().toISOString() : null,
    }).eq("id", bedId);
    toast({ title: patientId ? "✅ Bemor joylashtirildi" : "To'shak bo'shatildi" }); fetchData();
  };

  const available = beds.filter(b => b.status === "available").length;
  const occupied = beds.filter(b => b.status === "occupied").length;
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.full_name || "";

  const statusColors: Record<string, string> = { available: "bg-green-100 text-green-800", occupied: "bg-red-100 text-red-800", maintenance: "bg-yellow-100 text-yellow-800" };
  const statusLabels: Record<string, string> = { available: "Bo'sh", occupied: "Band", maintenance: "Ta'mirda" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">To'shak boshqaruvi</h2>
          <div className="flex gap-3 text-sm text-muted-foreground mt-1">
            <span>Jami: <strong className="text-foreground">{beds.length}</strong></span>
            <span>Bo'sh: <strong className="text-green-600">{available}</strong></span>
            <span>Band: <strong className="text-red-600">{occupied}</strong></span>
          </div>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi to'shak</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi to'shak"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="To'shak raqami *" value={form.bed_number} onChange={e => setForm({ ...form, bed_number: e.target.value })} />
            <Input placeholder="Xona raqami" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} />
            <Input placeholder="Qavat" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.bed_type} onChange={e => setForm({ ...form, bed_type: e.target.value })}>
              <option value="standard">Standart</option>
              <option value="icu">Reanimatsiya</option>
              <option value="vip">VIP</option>
              <option value="pediatric">Bolalar</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Bo'lim tanlang</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <Input type="number" placeholder="Kunlik narx (so'm)" value={form.daily_rate || ""} onChange={e => setForm({ ...form, daily_rate: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {beds.map(bed => (
          <div key={bed.id} className={cn("bg-card rounded-xl border p-4", bed.status === "occupied" ? "border-red-200" : "border-border")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BedDouble className={cn("w-5 h-5", bed.status === "available" ? "text-green-600" : "text-red-500")} />
                <span className="font-bold text-foreground text-sm">#{bed.bed_number}</span>
              </div>
              <Badge className={cn("text-[10px]", statusColors[bed.status] || "bg-muted text-muted-foreground")}>{statusLabels[bed.status] || bed.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {bed.room_number && <p>Xona: {bed.room_number}{bed.floor ? `, ${bed.floor}-qavat` : ""}</p>}
              {getDeptName(bed.department_id) && <p>Bo'lim: {getDeptName(bed.department_id)}</p>}
              {bed.daily_rate > 0 && <p className="text-primary font-medium">{Number(bed.daily_rate).toLocaleString()} so'm/kun</p>}
              {bed.patient_id && <p className="text-foreground font-medium flex items-center gap-1"><User className="w-3 h-3" /> {getPatientName(bed.patient_id)}</p>}
            </div>
            <div className="flex gap-1 mt-3">
              {bed.status === "available" ? (
                <select className="h-8 rounded-md border border-input bg-background px-2 text-xs flex-1" defaultValue="" onChange={e => { if (e.target.value) handleAssignPatient(bed.id, e.target.value); }}>
                  <option value="">Bemor joylashtirish...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              ) : bed.status === "occupied" ? (
                <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => handleAssignPatient(bed.id, null)}>Bo'shatish</Button>
              ) : null}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(bed); setForm({ bed_number: bed.bed_number, room_number: bed.room_number || "", floor: bed.floor || "", bed_type: bed.bed_type, department_id: bed.department_id || "", daily_rate: bed.daily_rate }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(bed.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
      {beds.length === 0 && <p className="text-center py-8 text-muted-foreground">To'shaklar yo'q. Yangi qo'shing!</p>}
    </div>
  );
};

export default HMSBeds;
