import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Building, X, Edit2, Trash2, Users } from "lucide-react";

interface Props { clinicId: string; }

const HMSDepartments = ({ clinicId }: Props) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", floor: "", room_count: 0, head_staff_id: "" });

  const fetchData = async () => {
    const [deptRes, staffRes, bedRes] = await Promise.all([
      supabase.from("hms_departments").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("name"),
      supabase.from("hms_staff").select("id, full_name, role").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_beds").select("id, department_id, status").eq("clinic_id", clinicId),
    ]);
    setDepartments(deptRes.data || []);
    setStaff(staffRes.data || []);
    setBeds(bedRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ name: "", description: "", floor: "", room_count: 0, head_staff_id: "" }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Bo'lim nomi majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, room_count: Number(form.room_count), head_staff_id: form.head_staff_id || null, clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_departments").update(payload).eq("id", editing.id);
      toast({ title: "✅ Bo'lim yangilandi" });
    } else {
      await supabase.from("hms_departments").insert(payload);
      toast({ title: "✅ Bo'lim qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_departments").update({ is_active: false }).eq("id", id);
    toast({ title: "Bo'lim o'chirildi" }); fetchData();
  };

  const getStaffName = (id: string) => staff.find(s => s.id === id)?.full_name || "";
  const getDeptBeds = (id: string) => beds.filter(b => b.department_id === id);
  const getDeptStaffCount = (deptName: string) => staff.filter(s => s.role === deptName).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Departamentlar ({departments.length})</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi bo'lim</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi bo'lim"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Bo'lim nomi *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Qavat" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
            <Input type="number" placeholder="Xonalar soni" value={form.room_count || ""} onChange={e => setForm({ ...form, room_count: Number(e.target.value) })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.head_staff_id} onChange={e => setForm({ ...form, head_staff_id: e.target.value })}>
              <option value="">Bo'lim boshlig'i</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptBeds = getDeptBeds(dept.id);
          const availableBeds = deptBeds.filter(b => b.status === "available").length;
          return (
            <div key={dept.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-sm">{dept.name}</h3>
                    {dept.floor && <p className="text-xs text-muted-foreground">{dept.floor}-qavat</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(dept); setForm({ name: dept.name, description: dept.description || "", floor: dept.floor || "", room_count: dept.room_count, head_staff_id: dept.head_staff_id || "" }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(dept.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
              {dept.description && <p className="text-xs text-muted-foreground mb-3">{dept.description}</p>}
              <div className="flex flex-wrap gap-2">
                {dept.room_count > 0 && <Badge variant="outline" className="text-[10px]">{dept.room_count} xona</Badge>}
                <Badge variant="outline" className="text-[10px]">{deptBeds.length} to'shak ({availableBeds} bo'sh)</Badge>
                {getStaffName(dept.head_staff_id) && <Badge variant="outline" className="text-[10px]"><Users className="w-3 h-3 mr-1" /> {getStaffName(dept.head_staff_id)}</Badge>}
              </div>
            </div>
          );
        })}
      </div>
      {departments.length === 0 && <p className="text-center py-8 text-muted-foreground">Bo'limlar yo'q</p>}
    </div>
  );
};

export default HMSDepartments;
