import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Brain, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RECOVERY = [
  { v: "normal", l: "Normal", color: "bg-emerald-100 text-emerald-700" },
  { v: "concerning", l: "Diqqat", color: "bg-amber-100 text-amber-700" },
  { v: "critical", l: "Kritik", color: "bg-red-100 text-red-700" },
];

const BREASTFEEDING = [
  { v: "exclusive", l: "Faqat ko'krak suti" },
  { v: "mixed", l: "Aralash" },
  { v: "formula", l: "Aralashma" },
];

export const MatPostpartum = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: "", check_date: new Date().toISOString().split("T")[0], days_postpartum: "",
    recovery_status: "normal", breastfeeding_status: "exclusive", mood_score: "8", bleeding_status: "", notes: "",
  });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [d, p] = await Promise.all([
      supabase.from("maternity_postpartum" as any).select("*").eq("center_id", centerId).order("check_date", { ascending: false }).limit(100),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setItems((d.data as any) || []);
    setPatients((p.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.patient_id) { toast({ title: "Bemor tanlang", variant: "destructive" }); return; }
    const { error } = await supabase.from("maternity_postpartum" as any).insert({
      center_id: centerId,
      patient_id: form.patient_id,
      check_date: form.check_date,
      days_postpartum: form.days_postpartum ? parseInt(form.days_postpartum) : null,
      recovery_status: form.recovery_status,
      breastfeeding_status: form.breastfeeding_status,
      mood_score: parseInt(form.mood_score),
      bleeding_status: form.bleeding_status || null,
      notes: form.notes || null,
    });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saqlandi ✅" });
    setOpen(false);
    setForm({ patient_id: "", check_date: new Date().toISOString().split("T")[0], days_postpartum: "", recovery_status: "normal", breastfeeding_status: "exclusive", mood_score: "8", bleeding_status: "", notes: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" /> Postpartum Care
          </h2>
          <p className="text-sm text-muted-foreground">Tug'ruqdan keyingi tiklanish, emizish va ruhiy holat monitoringi</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white"><Plus className="w-4 h-4 mr-2" />Yangi tekshiruv</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Postpartum tekshiruv</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={form.check_date} onChange={e => setForm({ ...form, check_date: e.target.value })} />
                <Input placeholder="Kun (tug'ruqdan keyingi)" type="number" value={form.days_postpartum} onChange={e => setForm({ ...form, days_postpartum: e.target.value })} />
              </div>
              <Select value={form.recovery_status} onValueChange={v => setForm({ ...form, recovery_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RECOVERY.map(r => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.breastfeeding_status} onValueChange={v => setForm({ ...form, breastfeeding_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BREASTFEEDING.map(b => <SelectItem key={b.v} value={b.v}>{b.l}</SelectItem>)}</SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground">Kayfiyat (1-10): {form.mood_score}</label>
                <input type="range" min="1" max="10" value={form.mood_score} onChange={e => setForm({ ...form, mood_score: e.target.value })} className="w-full accent-pink-500" />
              </div>
              <Input placeholder="Qon ketishi holati" value={form.bleeding_status} onChange={e => setForm({ ...form, bleeding_status: e.target.value })} />
              <Textarea placeholder="Izoh..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={save} className="w-full bg-rose-500 text-white">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> : items.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Hali postpartum yozuvlar yo'q</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((it) => {
            const patient = patients.find(p => p.id === it.patient_id);
            const rec = RECOVERY.find(r => r.v === it.recovery_status);
            const moodLow = it.mood_score && it.mood_score <= 4;
            return (
              <Card key={it.id} className={`border-l-4 ${moodLow ? "border-l-amber-500" : "border-l-rose-300"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{patient?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(it.check_date).toLocaleDateString("uz-UZ")}
                        {it.days_postpartum != null && <span> · {it.days_postpartum}-kun</span>}
                      </p>
                    </div>
                    <Badge className={rec?.color}>{rec?.l}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded flex items-center gap-1"><Baby className="w-3 h-3 text-pink-500" /> {BREASTFEEDING.find(b => b.v === it.breastfeeding_status)?.l}</div>
                    <div className={`p-2 rounded flex items-center gap-1 ${moodLow ? "bg-amber-50 text-amber-700" : "bg-white"}`}><Brain className="w-3 h-3" /> Kayfiyat: {it.mood_score}/10</div>
                    {it.bleeding_status && <div className="bg-white p-2 rounded">🩸 {it.bleeding_status}</div>}
                  </div>
                  {moodLow && <p className="text-xs text-amber-700 mt-2">⚠️ AI: Past kayfiyat — postpartum depressiya skriningi tavsiya etiladi</p>}
                  {it.notes && <p className="text-sm text-muted-foreground mt-2">{it.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
