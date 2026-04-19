import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Phone, User, Calendar } from "lucide-react";

interface Props { doctorId: string }

const DocPatients = ({ doctorId }: Props) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", date_of_birth: "", gender: "unspecified",
    blood_group: "", allergies: "", chronic_conditions: "", notes: "",
  });

  const load = async () => {
    const { data } = await supabase.from("doctor_patients")
      .select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    setPatients(data || []);
  };
  useEffect(() => { load(); }, [doctorId]);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: "", phone: "", email: "", date_of_birth: "", gender: "unspecified", blood_group: "", allergies: "", chronic_conditions: "", notes: "" });
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      full_name: p.full_name, phone: p.phone, email: p.email || "", date_of_birth: p.date_of_birth || "",
      gender: p.gender || "unspecified", blood_group: p.blood_group || "", allergies: p.allergies || "",
      chronic_conditions: p.chronic_conditions || "", notes: p.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Ism va telefon majburiy", variant: "destructive" }); return;
    }
    const payload = { ...form, doctor_id: doctorId, source: "manual", date_of_birth: form.date_of_birth || null };
    const { error } = editing
      ? await supabase.from("doctor_patients").update(payload).eq("id", editing.id)
      : await supabase.from("doctor_patients").insert(payload);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "✅ Yangilandi" : "✅ Qo'shildi" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Bemorni o'chirish?")) return;
    await supabase.from("doctor_patients").delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="font-heading font-bold text-xl text-foreground">Bemorlar ({patients.length})</h2>
        <Button onClick={openNew} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Plus className="w-4 h-4 mr-1" /> Yangi bemor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Ism yoki telefon bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          Hali bemorlar yo'q
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">{p.full_name}</p>
                  <Badge variant="outline" className="text-[10px]">{p.source === "manual" ? "Qo'lda" : "Avto"}</Badge>
                  {p.blood_group && <Badge className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">{p.blood_group}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                  {p.date_of_birth && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.date_of_birth).toLocaleDateString("uz-UZ")}</span>}
                  <span>Tashriflar: {p.visit_count || 0}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Bemorni tahrirlash" : "Yangi bemor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">To'liq ism *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Telefon *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Jinsi</Label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="unspecified">Belgilanmagan</option>
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Qon guruhi</Label>
                <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">—</option>
                  {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div><Label className="text-xs">Allergiyalar</Label><Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Surunkali kasalliklar</Label><Input value={form.chronic_conditions} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Eslatmalar</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            <Button onClick={save} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
              {editing ? "Yangilash" : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocPatients;
