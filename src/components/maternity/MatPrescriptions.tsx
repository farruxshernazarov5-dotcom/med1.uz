import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pill, Trash2 } from "lucide-react";

export const MatPrescriptions = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ patient_id: "", medication_name: "", dosage: "", frequency: "", duration: "", doctor_name: "", notes: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const [r, p] = await Promise.all([
      supabase.from("maternity_prescriptions" as any).select("*, maternity_patients(full_name)").eq("center_id", centerId).order("prescribed_date", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setItems((r.data as any) || []);
    setPatients((p.data as any) || []);
  };

  const save = async () => {
    if (!form.patient_id || !form.medication_name) { toast({ title: "Bemor va dori majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("maternity_prescriptions" as any).insert({ ...form, center_id: centerId });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Retsept qo'shildi" });
    setOpen(false);
    setForm({ patient_id: "", medication_name: "", dosage: "", frequency: "", duration: "", doctor_name: "", notes: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("maternity_prescriptions" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Pill className="w-5 h-5 text-primary" /> Retseptlar ({items.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi retsept</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Retsept</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Bemor *</Label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div><Label>Dori nomi *</Label><Input value={form.medication_name} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Doza</Label><Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="500mg" className="mt-1" /></div>
                <div><Label>Chastota</Label><Input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="3x kun" className="mt-1" /></div>
                <div><Label>Davomiyligi</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="7 kun" className="mt-1" /></div>
              </div>
              <div><Label>Shifokor</Label><Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Izoh</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" /></div>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Retseptlar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {items.map((p: any) => (
            <Card key={p.id}><CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill className="w-4 h-4 text-primary" />
                  <span className="font-medium">{p.medication_name}</span>
                  <span className="text-xs text-muted-foreground">{p.dosage} • {p.frequency} • {p.duration}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.maternity_patients?.full_name} • {p.prescribed_date} {p.doctor_name && `• ${p.doctor_name}`}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
