import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, ScanLine, Trash2 } from "lucide-react";

export const MatUltrasound = ({ centerId }: { centerId: string }) => {
  const [scans, setScans] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ patient_id: "", gestational_week: 0, fetal_weight_g: 0, fetal_position: "", amniotic_fluid: "", placenta_position: "", abnormalities: "", doctor_name: "", conclusion: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const [s, p] = await Promise.all([
      supabase.from("maternity_ultrasound" as any).select("*, maternity_patients(full_name)").eq("center_id", centerId).order("scan_date", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setScans((s.data as any) || []);
    setPatients((p.data as any) || []);
  };

  const save = async () => {
    if (!form.patient_id) { toast({ title: "Bemor majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("maternity_ultrasound" as any).insert({ ...form, center_id: centerId });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ UZI saqlandi" });
    setOpen(false);
    setForm({ patient_id: "", gestational_week: 0, fetal_weight_g: 0, fetal_position: "", amniotic_fluid: "", placenta_position: "", abnormalities: "", doctor_name: "", conclusion: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("maternity_ultrasound" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><ScanLine className="w-5 h-5 text-primary" /> UZI tekshiruvi ({scans.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi UZI</Button></DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>UZI natijasi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Bemor *</Label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Hafta</Label><Input type="number" value={form.gestational_week} onChange={(e) => setForm({ ...form, gestational_week: +e.target.value })} className="mt-1" /></div>
                <div><Label>Homila vazni (g)</Label><Input type="number" value={form.fetal_weight_g} onChange={(e) => setForm({ ...form, fetal_weight_g: +e.target.value })} className="mt-1" /></div>
                <div><Label>Homila holati</Label><Input value={form.fetal_position} onChange={(e) => setForm({ ...form, fetal_position: e.target.value })} placeholder="Bosh prezentatsiyasi" className="mt-1" /></div>
                <div><Label>Amniotik suyuqlik</Label><Input value={form.amniotic_fluid} onChange={(e) => setForm({ ...form, amniotic_fluid: e.target.value })} placeholder="Normal" className="mt-1" /></div>
                <div><Label>Platsenta</Label><Input value={form.placenta_position} onChange={(e) => setForm({ ...form, placenta_position: e.target.value })} className="mt-1" /></div>
                <div><Label>Shifokor</Label><Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>Anomaliyalar</Label><Textarea value={form.abnormalities} onChange={(e) => setForm({ ...form, abnormalities: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Xulosa</Label><Textarea value={form.conclusion} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} rows={3} className="mt-1" /></div>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {scans.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">UZI yozuvlari yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {scans.map((s: any) => (
            <Card key={s.id}><CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium">{s.maternity_patients?.full_name}</span>
                    <span className="text-sm text-primary">{s.gestational_week}-hafta</span>
                    <span className="text-xs text-muted-foreground">{s.scan_date}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {s.fetal_weight_g > 0 && <div><span className="text-muted-foreground">Vazn:</span> <span className="font-medium">{s.fetal_weight_g}g</span></div>}
                    {s.fetal_position && <div><span className="text-muted-foreground">Holat:</span> <span className="font-medium">{s.fetal_position}</span></div>}
                    {s.placenta_position && <div><span className="text-muted-foreground">Platsenta:</span> <span className="font-medium">{s.placenta_position}</span></div>}
                  </div>
                  {s.conclusion && <p className="text-sm mt-2"><strong>Xulosa:</strong> {s.conclusion}</p>}
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
