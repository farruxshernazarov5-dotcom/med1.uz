import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Baby, Trash2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = { healthy: "bg-emerald-500/10 text-emerald-600", observation: "bg-amber-500/10 text-amber-600", critical: "bg-red-500/10 text-red-600" };
const STATUS_LABELS: Record<string, string> = { healthy: "Sog'lom", observation: "Kuzatuvda", critical: "Kritik" };

export const MatNewborns = ({ centerId }: { centerId: string }) => {
  const [babies, setBabies] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ patient_id: "", delivery_id: "", baby_name: "", gender: "male", weight_g: 3500, height_cm: 50, head_circumference_cm: 35, apgar_score_1min: 8, apgar_score_5min: 9, blood_group: "", health_status: "healthy", notes: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const [b, p, d] = await Promise.all([
      supabase.from("maternity_newborns" as any).select("*, maternity_patients(full_name)").eq("center_id", centerId).order("birth_date", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId),
      supabase.from("maternity_deliveries" as any).select("id, patient_id, delivery_date").eq("center_id", centerId).order("delivery_date", { ascending: false }).limit(50),
    ]);
    setBabies((b.data as any) || []);
    setPatients((p.data as any) || []);
    setDeliveries((d.data as any) || []);
  };

  const save = async () => {
    if (!form.patient_id) { toast({ title: "Ona majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("maternity_newborns" as any).insert({ ...form, center_id: centerId, delivery_id: form.delivery_id || null });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Chaqaloq qo'shildi" });
    setOpen(false);
    setForm({ patient_id: "", delivery_id: "", baby_name: "", gender: "male", weight_g: 3500, height_cm: 50, head_circumference_cm: 35, apgar_score_1min: 8, apgar_score_5min: 9, blood_group: "", health_status: "healthy", notes: "" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("maternity_newborns" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Baby className="w-5 h-5 text-primary" /> Chaqaloqlar ({babies.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi chaqaloq</Button></DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Chaqaloq qaydi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Onasi *</Label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div><Label>Tug'ruq</Label>
                <select value={form.delivery_id} onChange={(e) => setForm({ ...form, delivery_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">— Tanlash mumkin —</option>
                  {deliveries.filter(d => d.patient_id === form.patient_id).map((d) => <option key={d.id} value={d.id}>{new Date(d.delivery_date).toLocaleString("uz-UZ")}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ismi</Label><Input value={form.baby_name} onChange={(e) => setForm({ ...form, baby_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Jinsi</Label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="male">O'g'il</option><option value="female">Qiz</option>
                  </select></div>
                <div><Label>Vazn (g)</Label><Input type="number" value={form.weight_g} onChange={(e) => setForm({ ...form, weight_g: +e.target.value })} className="mt-1" /></div>
                <div><Label>Bo'y (sm)</Label><Input type="number" step="0.1" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: +e.target.value })} className="mt-1" /></div>
                <div><Label>Bosh aylanasi (sm)</Label><Input type="number" step="0.1" value={form.head_circumference_cm} onChange={(e) => setForm({ ...form, head_circumference_cm: +e.target.value })} className="mt-1" /></div>
                <div><Label>Qon guruhi</Label><Input value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="mt-1" /></div>
                <div><Label>Apgar (1-min)</Label><Input type="number" min={0} max={10} value={form.apgar_score_1min} onChange={(e) => setForm({ ...form, apgar_score_1min: +e.target.value })} className="mt-1" /></div>
                <div><Label>Apgar (5-min)</Label><Input type="number" min={0} max={10} value={form.apgar_score_5min} onChange={(e) => setForm({ ...form, apgar_score_5min: +e.target.value })} className="mt-1" /></div>
                <div className="col-span-2"><Label>Holat</Label>
                  <select value={form.health_status} onChange={(e) => setForm({ ...form, health_status: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
              </div>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {babies.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Chaqaloqlar yo'q</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {babies.map((b: any) => (
            <Card key={b.id}><CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Baby className={`w-5 h-5 ${b.gender === "male" ? "text-blue-500" : "text-pink-500"}`} />
                  <span className="font-medium">{b.baby_name || "Ismsiz"}</span>
                  <Badge variant="outline">{b.gender === "male" ? "O'g'il" : "Qiz"}</Badge>
                  <Badge className={STATUS_COLORS[b.health_status]}>{STATUS_LABELS[b.health_status]}</Badge>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(b.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Onasi: {b.maternity_patients?.full_name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>⚖️ Vazn: <span className="font-medium text-foreground">{b.weight_g}g</span></div>
                <div>📏 Bo'y: <span className="font-medium text-foreground">{b.height_cm} sm</span></div>
                <div>🧠 Bosh: <span className="font-medium text-foreground">{b.head_circumference_cm} sm</span></div>
                <div>💯 Apgar: <span className="font-medium text-foreground">{b.apgar_score_1min}/{b.apgar_score_5min}</span></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">📅 {new Date(b.birth_date).toLocaleString("uz-UZ")}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
