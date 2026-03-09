import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, User, Phone, Calendar, Edit2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";

interface Props {
  clinicId: string;
}

const HMSPatients = ({ clinicId }: Props) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", date_of_birth: "", gender: "male",
    blood_group: "", address: "", passport_id: "", emergency_contact: "",
    allergies: "", chronic_diseases: "", notes: "",
  });

  const fetchPatients = async () => {
    const { data } = await supabase
      .from("hms_patients")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setPatients(data || []);
  };

  useEffect(() => { fetchPatients(); }, [clinicId]);

  const resetForm = () => {
    setForm({ full_name: "", phone: "", date_of_birth: "", gender: "male", blood_group: "", address: "", passport_id: "", emergency_contact: "", allergies: "", chronic_diseases: "", notes: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone) {
      toast({ title: "Ism va telefon majburiy!", variant: "destructive" });
      return;
    }
    const payload = { ...form, clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_patients").update(payload).eq("id", editing.id);
      toast({ title: "✅ Bemor yangilandi" });
    } else {
      await supabase.from("hms_patients").insert(payload);
      toast({ title: "✅ Bemor qo'shildi" });
    }
    resetForm();
    fetchPatients();
  };

  const handleEdit = (p: any) => {
    setForm({
      full_name: p.full_name, phone: p.phone, date_of_birth: p.date_of_birth || "",
      gender: p.gender, blood_group: p.blood_group || "", address: p.address || "",
      passport_id: p.passport_id || "", emergency_contact: p.emergency_contact || "",
      allergies: p.allergies || "", chronic_diseases: p.chronic_diseases || "", notes: p.notes || "",
    });
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_patients").update({ is_active: false }).eq("id", id);
    toast({ title: "Bemor o'chirildi" });
    fetchPatients();
  };

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  // Report data
  const reportData: HMSReportData = {
    title: "Bemorlar ro'yxati",
    moduleType: "HMS Bemorlar",
    kpiCards: [
      { label: "Jami bemorlar", value: String(patients.length) },
      { label: "Erkaklar", value: String(patients.filter(p => p.gender === "male").length) },
      { label: "Ayollar", value: String(patients.filter(p => p.gender === "female").length) },
    ],
    tables: patients.length > 0 ? [{
      title: "Bemorlar ma'lumotlari",
      table: {
        headers: ["Ism", "Telefon", "Tug'ilgan sana", "Jins", "Qon guruhi"],
        rows: patients.slice(0, 100).map(p => [
          p.full_name,
          p.phone,
          p.date_of_birth || "-",
          p.gender === "male" ? "Erkak" : "Ayol",
          p.blood_group || "-"
        ])
      }
    }] : undefined,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Bemorlar kartasi</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-60"
            />
          </div>
          <HMSDownloadMenu data={reportData} />
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Yangi bemor
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">
              {editing ? "Bemorni tahrirlash" : "Yangi bemor qo'shish"}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="To'liq ism *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input placeholder="Telefon *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input type="date" placeholder="Tug'ilgan sana" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">Erkak</option>
              <option value="female">Ayol</option>
            </select>
            <Input placeholder="Qon guruhi" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} />
            <Input placeholder="Pasport raqami" value={form.passport_id} onChange={(e) => setForm({ ...form, passport_id: e.target.value })} />
            <Input placeholder="Manzil" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
            <Input placeholder="Favqulodda aloqa" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
            <Input placeholder="Allergiyalar" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
            <Input placeholder="Surunkali kasalliklar" value={form.chronic_diseases} onChange={(e) => setForm({ ...form, chronic_diseases: e.target.value })} />
            <Input placeholder="Izoh" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button variant="outline" onClick={resetForm}>Bekor qilish</Button>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground mb-3">Jami: {filtered.length} bemor</div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{p.full_name}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                {p.date_of_birth && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.date_of_birth}</span>}
                {p.blood_group && <Badge variant="outline" className="text-[10px]">{p.blood_group}{p.rh_factor}</Badge>}
                <Badge variant="outline" className="text-[10px]">{p.gender === "male" ? "Erkak" : "Ayol"}</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Bemorlar topilmadi</p>}
      </div>
    </div>
  );
};

export default HMSPatients;
