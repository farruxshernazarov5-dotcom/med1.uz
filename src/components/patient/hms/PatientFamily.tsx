import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Trash2, Heart, AlertCircle } from "lucide-react";

const RELATIONSHIPS = [
  { value: "spouse", label: "Turmush o'rtog'i" },
  { value: "child", label: "Farzand" },
  { value: "parent", label: "Ota-ona" },
  { value: "sibling", label: "Aka/uka/opa/singil" },
  { value: "grandparent", label: "Bobo/buvi" },
  { value: "other", label: "Boshqa" },
];

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const emptyForm = {
  full_name: "", relationship: "child", date_of_birth: "", gender: "male",
  blood_group: "", phone: "", allergies: "", chronic_conditions: "", notes: "",
};

const PatientFamily = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("family_members").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      full_name: m.full_name, relationship: m.relationship,
      date_of_birth: m.date_of_birth || "", gender: m.gender || "male",
      blood_group: m.blood_group || "", phone: m.phone || "",
      allergies: m.allergies || "", chronic_conditions: m.chronic_conditions || "", notes: m.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user || !form.full_name) return toast({ title: "Ism kiriting", variant: "destructive" });
    const payload = { ...form, user_id: user.id, date_of_birth: form.date_of_birth || null };
    const { error } = editing
      ? await supabase.from("family_members").update(payload).eq("id", editing.id)
      : await supabase.from("family_members").insert(payload);
    if (error) return toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    toast({ title: editing ? "Yangilandi ✅" : "Qo'shildi ✅" });
    setOpen(false);
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("family_members").delete().eq("id", id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const calcAge = (dob: string) => {
    if (!dob) return null;
    const ms = Date.now() - new Date(dob).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">👨‍👩‍👧 Oila a'zolari</h2>
        <Button onClick={openNew} size="sm" className="bg-hero-gradient text-primary-foreground border-0">
          <Plus className="w-4 h-4 mr-1" /> Qo'shish
        </Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> :
        members.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">Oila a'zolari qo'shilmagan</p>
            <Button onClick={openNew} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Birinchi a'zo qo'shish</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map(m => {
              const age = calcAge(m.date_of_birth);
              const rel = RELATIONSHIPS.find(r => r.value === m.relationship);
              return (
                <div key={m.id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {m.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{m.full_name}</p>
                        <p className="text-xs text-muted-foreground">{rel?.label}{age !== null && ` • ${age} yosh`}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {m.blood_group && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {m.blood_group}</span>}
                    {m.phone && <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{m.phone}</span>}
                    {m.allergies && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Allergiya</span>}
                    {m.chronic_conditions && <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-600">Surunkali</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Tahrirlash" : "Yangi a'zo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>To'liq ism *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Munosabat</Label>
                <Select value={form.relationship} onValueChange={v => setForm({ ...form, relationship: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RELATIONSHIPS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jinsi</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
              <div>
                <Label>Qon guruhi</Label>
                <Select value={form.blood_group} onValueChange={v => setForm({ ...form, blood_group: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998..." /></div>
            <div><Label>Allergiyalar</Label><Textarea rows={2} value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} /></div>
            <div><Label>Surunkali kasalliklar</Label><Textarea rows={2} value={form.chronic_conditions} onChange={e => setForm({ ...form, chronic_conditions: e.target.value })} /></div>
            <div><Label>Izoh</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={save} className="w-full bg-hero-gradient text-primary-foreground border-0">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientFamily;
