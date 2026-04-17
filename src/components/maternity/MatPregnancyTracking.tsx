import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Activity, Calendar, Trash2 } from "lucide-react";

export const MatPregnancyTracking = ({ centerId }: { centerId: string }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ patient_id: "", week_number: 0, weight_kg: 0, blood_pressure: "", fetal_heart_rate: 0, fundal_height_cm: 0, symptoms: "", doctor_notes: "", recommendations: "", next_visit_date: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const [l, p] = await Promise.all([
      supabase.from("maternity_pregnancy_logs" as any).select("*, maternity_patients(full_name)").eq("center_id", centerId).order("visit_date", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId).eq("status", "active"),
    ]);
    setLogs((l.data as any) || []);
    setPatients((p.data as any) || []);
  };

  const save = async () => {
    if (!form.patient_id || !form.week_number) { toast({ title: "Bemor va hafta majburiy", variant: "destructive" }); return; }
    const payload = { ...form, center_id: centerId, next_visit_date: form.next_visit_date || null };
    const { error } = await supabase.from("maternity_pregnancy_logs" as any).insert(payload);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Kuzatuv qo'shildi" });
    setOpen(false);
    setForm({ patient_id: "", week_number: 0, weight_kg: 0, blood_pressure: "", fetal_heart_rate: 0, fundal_height_cm: 0, symptoms: "", doctor_notes: "", recommendations: "", next_visit_date: "" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("maternity_pregnancy_logs" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Homiladorlik kuzatuvi ({logs.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi yozuv</Button></DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Haftalik kuzatuv</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Bemor *</Label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Hafta *</Label><Input type="number" value={form.week_number} onChange={(e) => setForm({ ...form, week_number: +e.target.value })} className="mt-1" /></div>
                <div><Label>Vazn (kg)</Label><Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: +e.target.value })} className="mt-1" /></div>
                <div><Label>Bosim</Label><Input value={form.blood_pressure} onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })} placeholder="120/80" className="mt-1" /></div>
                <div><Label>Homila puls</Label><Input type="number" value={form.fetal_heart_rate} onChange={(e) => setForm({ ...form, fetal_heart_rate: +e.target.value })} className="mt-1" /></div>
                <div><Label>Bachadon balandligi (sm)</Label><Input type="number" step="0.1" value={form.fundal_height_cm} onChange={(e) => setForm({ ...form, fundal_height_cm: +e.target.value })} className="mt-1" /></div>
                <div><Label>Keyingi tashrif</Label><Input type="date" value={form.next_visit_date} onChange={(e) => setForm({ ...form, next_visit_date: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>Simptomlar</Label><Textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Shifokor izohi</Label><Textarea value={form.doctor_notes} onChange={(e) => setForm({ ...form, doctor_notes: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Tavsiyalar</Label><Textarea value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} rows={2} className="mt-1" /></div>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {logs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Yozuvlar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {logs.map((l: any) => (
            <Card key={l.id}><CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium">{l.maternity_patients?.full_name}</span>
                    <span className="text-sm text-primary font-semibold">{l.week_number}-hafta</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {l.visit_date}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    {l.weight_kg > 0 && <div>Vazn: <span className="text-foreground font-medium">{l.weight_kg} kg</span></div>}
                    {l.blood_pressure && <div>Bosim: <span className="text-foreground font-medium">{l.blood_pressure}</span></div>}
                    {l.fetal_heart_rate > 0 && <div>Puls: <span className="text-foreground font-medium">{l.fetal_heart_rate}</span></div>}
                    {l.fundal_height_cm > 0 && <div>Balandlik: <span className="text-foreground font-medium">{l.fundal_height_cm} sm</span></div>}
                  </div>
                  {l.doctor_notes && <p className="text-sm mt-2 text-muted-foreground"><strong>Izoh:</strong> {l.doctor_notes}</p>}
                  {l.recommendations && <p className="text-sm mt-1 text-muted-foreground"><strong>Tavsiya:</strong> {l.recommendations}</p>}
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(l.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
