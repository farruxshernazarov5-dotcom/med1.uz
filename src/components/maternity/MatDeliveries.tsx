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
import { Plus, Heart, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = { normal: "Normal", c_section: "Kesarevo", vacuum: "Vakuum", forceps: "Forsep" };
const OUTCOME_COLORS: Record<string, string> = { successful: "bg-emerald-500/10 text-emerald-600", complications: "bg-amber-500/10 text-amber-600", stillbirth: "bg-red-500/10 text-red-600" };

export const MatDeliveries = ({ centerId }: { centerId: string }) => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ patient_id: "", delivery_type: "normal", duration_hours: 0, doctor_name: "", midwife_name: "", room_number: "", complications: "", blood_loss_ml: 0, outcome: "successful", notes: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const [d, p] = await Promise.all([
      supabase.from("maternity_deliveries" as any).select("*, maternity_patients(full_name)").eq("center_id", centerId).order("delivery_date", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId).eq("status", "active"),
    ]);
    setDeliveries((d.data as any) || []);
    setPatients((p.data as any) || []);
  };

  const save = async () => {
    if (!form.patient_id) { toast({ title: "Bemor majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("maternity_deliveries" as any).insert({ ...form, center_id: centerId });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    // Update patient status
    await supabase.from("maternity_patients" as any).update({ status: "delivered" }).eq("id", form.patient_id);
    toast({ title: "✅ Tug'ruq qayd etildi" });
    setOpen(false);
    setForm({ patient_id: "", delivery_type: "normal", duration_hours: 0, doctor_name: "", midwife_name: "", room_number: "", complications: "", blood_loss_ml: 0, outcome: "successful", notes: "" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("maternity_deliveries" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> Tug'ruqlar ({deliveries.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi tug'ruq</Button></DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Tug'ruq qaydi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Bemor *</Label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Turi</Label>
                  <select value={form.delivery_type} onChange={(e) => setForm({ ...form, delivery_type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><Label>Davomiyligi (soat)</Label><Input type="number" step="0.1" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: +e.target.value })} className="mt-1" /></div>
                <div><Label>Shifokor</Label><Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Akusher</Label><Input value={form.midwife_name} onChange={(e) => setForm({ ...form, midwife_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Palata</Label><Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} className="mt-1" /></div>
                <div><Label>Qon yo'qotish (ml)</Label><Input type="number" value={form.blood_loss_ml} onChange={(e) => setForm({ ...form, blood_loss_ml: +e.target.value })} className="mt-1" /></div>
                <div className="col-span-2"><Label>Natija</Label>
                  <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="successful">Muvaffaqiyatli</option>
                    <option value="complications">Asoratlar bilan</option>
                    <option value="stillbirth">Yo'qotish</option>
                  </select></div>
              </div>
              <div><Label>Asoratlar</Label><Textarea value={form.complications} onChange={(e) => setForm({ ...form, complications: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Izoh</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" /></div>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {deliveries.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Tug'ruqlar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {deliveries.map((d: any) => (
            <Card key={d.id}><CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium">{d.maternity_patients?.full_name}</span>
                    <Badge variant="outline">{TYPE_LABELS[d.delivery_type]}</Badge>
                    <Badge className={OUTCOME_COLORS[d.outcome]}>{d.outcome === "successful" ? "Muvaffaqiyatli" : d.outcome === "complications" ? "Asoratlar" : "Yo'qotish"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <div>📅 {new Date(d.delivery_date).toLocaleString("uz-UZ")} • Davomiyligi: {d.duration_hours}s</div>
                    {d.doctor_name && <div>👨‍⚕️ Shifokor: {d.doctor_name}</div>}
                    {d.midwife_name && <div>👩‍⚕️ Akusher: {d.midwife_name}</div>}
                    {d.room_number && <div>🚪 Palata: {d.room_number}</div>}
                    {d.complications && <div className="text-amber-600">⚠️ {d.complications}</div>}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(d.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
