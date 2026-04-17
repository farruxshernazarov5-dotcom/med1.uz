import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, User, Phone, Calendar, AlertCircle } from "lucide-react";

const RISK_COLORS: Record<string, string> = { low: "bg-emerald-500/10 text-emerald-600", medium: "bg-amber-500/10 text-amber-600", high: "bg-red-500/10 text-red-600" };
const RISK_LABELS: Record<string, string> = { low: "Past", medium: "O'rta", high: "Yuqori" };

export const MatPatients = ({ centerId }: { centerId: string }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ full_name: "", phone: "", date_of_birth: "", blood_group: "", rh_factor: "+", lmp_date: "", edd_date: "", gravida: 1, para: 0, risk_level: "low", husband_name: "", husband_phone: "", address: "", allergies: "", chronic_diseases: "", notes: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const { data } = await supabase.from("maternity_patients" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false });
    setPatients((data as any) || []);
  };

  const calculateEDD = (lmp: string) => {
    if (!lmp) return "";
    const d = new Date(lmp);
    d.setDate(d.getDate() + 280);
    return d.toISOString().split("T")[0];
  };

  const save = async () => {
    if (!form.full_name || !form.phone) { toast({ title: "Ism va telefon majburiy", variant: "destructive" }); return; }
    const payload = { ...form, center_id: centerId, edd_date: form.edd_date || calculateEDD(form.lmp_date) || null, lmp_date: form.lmp_date || null, date_of_birth: form.date_of_birth || null };
    const { error } = editing
      ? await supabase.from("maternity_patients" as any).update(payload).eq("id", editing.id)
      : await supabase.from("maternity_patients" as any).insert(payload);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "✅ Yangilandi" : "✅ Qo'shildi" });
    setOpen(false); setEditing(null);
    setForm({ full_name: "", phone: "", date_of_birth: "", blood_group: "", rh_factor: "+", lmp_date: "", edd_date: "", gravida: 1, para: 0, risk_level: "low", husband_name: "", husband_phone: "", address: "", allergies: "", chronic_diseases: "", notes: "" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("maternity_patients" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  const edit = (p: any) => {
    setEditing(p);
    setForm({ ...p, date_of_birth: p.date_of_birth || "", lmp_date: p.lmp_date || "", edd_date: p.edd_date || "" });
    setOpen(true);
  };

  const filtered = patients.filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-lg">Homiladorlar ({patients.length})</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi bemor</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Bemorni tahrirlash" : "Yangi homilador"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>F.I.O *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Telefon *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
                <div><Label>Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1" /></div>
                <div><Label>Qon guruhi</Label>
                  <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="">Tanlang</option>
                    {["I", "II", "III", "IV"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select></div>
                <div><Label>Oxirgi hayz (LMP)</Label><Input type="date" value={form.lmp_date} onChange={(e) => setForm({ ...form, lmp_date: e.target.value, edd_date: calculateEDD(e.target.value) })} className="mt-1" /></div>
                <div><Label>Tug'ilish kuni (EDD)</Label><Input type="date" value={form.edd_date} onChange={(e) => setForm({ ...form, edd_date: e.target.value })} className="mt-1" /></div>
                <div><Label>Gravida (homiladorlik)</Label><Input type="number" value={form.gravida} onChange={(e) => setForm({ ...form, gravida: +e.target.value })} className="mt-1" /></div>
                <div><Label>Para (tug'ruq)</Label><Input type="number" value={form.para} onChange={(e) => setForm({ ...form, para: +e.target.value })} className="mt-1" /></div>
                <div><Label>Risk darajasi</Label>
                  <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="low">Past</option><option value="medium">O'rta</option><option value="high">Yuqori</option>
                  </select></div>
                <div><Label>Rh faktor</Label>
                  <select value={form.rh_factor} onChange={(e) => setForm({ ...form, rh_factor: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="+">+</option><option value="-">-</option>
                  </select></div>
                <div><Label>Eri ismi</Label><Input value={form.husband_name} onChange={(e) => setForm({ ...form, husband_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Eri tel</Label><Input value={form.husband_phone} onChange={(e) => setForm({ ...form, husband_phone: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>Manzil</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
              <div><Label>Allergiyalar</Label><Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Surunkali kasalliklar</Label><Textarea value={form.chronic_diseases} onChange={(e) => setForm({ ...form, chronic_diseases: e.target.value })} rows={2} className="mt-1" /></div>
              <Button onClick={save} className="w-full">{editing ? "Yangilash" : "Saqlash"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Qidirish (ism, telefon)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Bemorlar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <Card key={p.id}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">{p.full_name}</span>
                    <Badge className={RISK_COLORS[p.risk_level] || ""}>{RISK_LABELS[p.risk_level]} risk</Badge>
                    {p.blood_group && <Badge variant="outline">{p.blood_group}{p.rh_factor}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>
                    {p.edd_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> EDD: {p.edd_date}</span>}
                    <span>G{p.gravida}P{p.para}</span>
                    {p.risk_level === "high" && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3" /> Yuqori xavf</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => edit(p)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
