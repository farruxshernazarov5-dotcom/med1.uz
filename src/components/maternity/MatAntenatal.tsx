import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Plus, Calendar, Heart, Scale, Activity, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MatAntenatal = ({ centerId }: { centerId: string }) => {
  const [visits, setVisits] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: "", visit_date: new Date().toISOString().split("T")[0], gestational_week: "",
    weight_kg: "", blood_pressure: "", fetal_heartbeat: "", fundal_height_cm: "", notes: "", next_visit_date: "",
  });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [v, p] = await Promise.all([
      supabase.from("maternity_antenatal_visits" as any).select("*").eq("center_id", centerId).order("visit_date", { ascending: false }).limit(100),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setVisits((v.data as any) || []);
    setPatients((p.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.patient_id) { toast({ title: "Bemor tanlang", variant: "destructive" }); return; }
    const payload: any = {
      center_id: centerId,
      patient_id: form.patient_id,
      visit_date: form.visit_date,
      gestational_week: form.gestational_week ? parseInt(form.gestational_week) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      blood_pressure: form.blood_pressure || null,
      fetal_heartbeat: form.fetal_heartbeat ? parseInt(form.fetal_heartbeat) : null,
      fundal_height_cm: form.fundal_height_cm ? parseFloat(form.fundal_height_cm) : null,
      notes: form.notes || null,
      next_visit_date: form.next_visit_date || null,
    };
    const { error } = await supabase.from("maternity_antenatal_visits" as any).insert(payload);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Tashrif saqlandi ✅" });
    setOpen(false);
    setForm({ patient_id: "", visit_date: new Date().toISOString().split("T")[0], gestational_week: "", weight_kg: "", blood_pressure: "", fetal_heartbeat: "", fundal_height_cm: "", notes: "", next_visit_date: "" });
    load();
  };

  const aiFlag = (v: any) => {
    // simple risk heuristic
    const bp = (v.blood_pressure || "").match(/(\d+)\/(\d+)/);
    if (bp && (parseInt(bp[1]) >= 140 || parseInt(bp[2]) >= 90)) return "BP yuqori";
    if (v.fetal_heartbeat && (v.fetal_heartbeat < 110 || v.fetal_heartbeat > 160)) return "FHR anormal";
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-pink-500" /> Antenatal Care
          </h2>
          <p className="text-sm text-muted-foreground">Homiladorlarning kuzatuv tashriflari va AI risk monitoringi</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"><Plus className="w-4 h-4 mr-2" />Yangi tashrif</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Antenatal tashrif</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} />
                <Input placeholder="Hafta (gestational)" type="number" value={form.gestational_week} onChange={e => setForm({ ...form, gestational_week: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Vazn (kg)" type="number" step="0.1" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
                <Input placeholder="BP (120/80)" value={form.blood_pressure} onChange={e => setForm({ ...form, blood_pressure: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="FHR (bpm)" type="number" value={form.fetal_heartbeat} onChange={e => setForm({ ...form, fetal_heartbeat: e.target.value })} />
                <Input placeholder="Fundal (cm)" type="number" step="0.1" value={form.fundal_height_cm} onChange={e => setForm({ ...form, fundal_height_cm: e.target.value })} />
              </div>
              <Input type="date" placeholder="Keyingi tashrif" value={form.next_visit_date} onChange={e => setForm({ ...form, next_visit_date: e.target.value })} />
              <Textarea placeholder="Izoh..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={save} className="w-full bg-pink-500 text-white">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> : visits.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Hali tashriflar yo'q</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {visits.map((v) => {
            const patient = patients.find(p => p.id === v.patient_id);
            const flag = aiFlag(v);
            return (
              <Card key={v.id} className={`border-l-4 ${flag ? "border-l-amber-500 bg-amber-50/30" : "border-l-pink-300"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{patient?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(v.visit_date).toLocaleDateString("uz-UZ")}
                        {v.gestational_week && <span> · {v.gestational_week}-hafta</span>}
                      </p>
                    </div>
                    {flag && <Badge className="bg-amber-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />{flag}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {v.weight_kg && <div className="bg-white p-2 rounded flex items-center gap-1"><Scale className="w-3 h-3 text-pink-500" /> {v.weight_kg} kg</div>}
                    {v.blood_pressure && <div className="bg-white p-2 rounded flex items-center gap-1"><Activity className="w-3 h-3 text-purple-500" /> {v.blood_pressure}</div>}
                    {v.fetal_heartbeat && <div className="bg-white p-2 rounded flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" /> {v.fetal_heartbeat} bpm</div>}
                    {v.fundal_height_cm && <div className="bg-white p-2 rounded">📏 {v.fundal_height_cm} cm</div>}
                  </div>
                  {v.notes && <p className="text-sm text-muted-foreground mt-2">{v.notes}</p>}
                  {v.next_visit_date && <p className="text-xs text-pink-600 mt-2">📅 Keyingi: {new Date(v.next_visit_date).toLocaleDateString("uz-UZ")}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
