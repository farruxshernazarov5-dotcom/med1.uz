import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Activity, X } from "lucide-react";
import TemplatePicker from "./TemplatePicker";
import { COURSE_TEMPLATES, COURSE_CATEGORIES } from "./courseTemplates";

interface Props { doctorId: string }

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const DocPlans = ({ doctorId }: Props) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: "", diagnosis: "", description: "", start_date: "", expected_end_date: "",
    steps: [] as { title: string; done: boolean }[], notes: "",
  });
  const [newStep, setNewStep] = useState("");

  const load = async () => {
    const [pl, pt] = await Promise.all([
      supabase.from("doctor_treatment_plans").select("*, doctor_patients(full_name)").eq("doctor_id", doctorId).order("created_at", { ascending: false }),
      supabase.from("doctor_patients").select("id, full_name").eq("doctor_id", doctorId),
    ]);
    setPlans(pl.data || []); setPatients(pt.data || []);
  };
  useEffect(() => { load(); }, [doctorId]);

  const save = async () => {
    if (!form.patient_id || !form.diagnosis.trim()) {
      toast({ title: "Bemor va tashxis majburiy", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("doctor_treatment_plans").insert({
      doctor_id: doctorId, patient_id: form.patient_id, diagnosis: form.diagnosis,
      description: form.description, steps: form.steps as any, notes: form.notes,
      start_date: form.start_date || null, expected_end_date: form.expected_end_date || null,
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Davolash kursi yaratildi" }); setOpen(false);
      setForm({ patient_id: "", diagnosis: "", description: "", start_date: "", expected_end_date: "", steps: [], notes: "" });
      load();
    }
  };

  const toggleStep = async (plan: any, idx: number) => {
    const steps = [...(plan.steps || [])];
    steps[idx] = { ...steps[idx], done: !steps[idx].done };
    const done = steps.filter((s: any) => s.done).length;
    const progress = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
    await supabase.from("doctor_treatment_plans").update({
      steps: steps as any, progress_percent: progress,
      status: progress === 100 ? "completed" : "active",
    }).eq("id", plan.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading font-bold text-xl text-foreground">Davolash kurslari</h2>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Plus className="w-4 h-4 mr-1" /> Yangi kurs
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" /> Hali davolash kurslari yo'q
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div>
                  <p className="font-semibold text-foreground">{p.diagnosis}</p>
                  <p className="text-xs text-muted-foreground">{p.doctor_patients?.full_name}</p>
                </div>
                <Badge variant="outline" className={p.status === "completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"}>
                  {p.status === "completed" ? "Tugallangan" : "Faol"}
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 my-2">
                <div className="bg-gradient-to-r from-secondary to-accent h-1.5 rounded-full" style={{ width: `${p.progress_percent || 0}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mb-2">{p.progress_percent || 0}% bajarildi</p>
              {(p.steps || []).length > 0 && (
                <div className="space-y-1">
                  {(p.steps || []).map((s: any, i: number) => (
                    <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={s.done} onChange={() => toggleStep(p, i)} />
                      <span className={s.done ? "line-through text-muted-foreground" : "text-foreground"}>{s.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-8">
              <DialogTitle>Yangi davolash kursi</DialogTitle>
              <TemplatePicker
                templates={COURSE_TEMPLATES}
                categories={COURSE_CATEGORIES}
                label="Kurs shabloni"
                preview={(t) => `${t.diagnosis} • ${t.duration_days} kun • ${t.steps.length} bosqich`}
                onPick={(t) => setForm((p) => ({
                  ...p,
                  diagnosis: t.diagnosis,
                  description: t.description,
                  notes: t.notes,
                  start_date: p.start_date || addDays(0),
                  expected_end_date: p.expected_end_date || addDays(t.duration_days),
                  steps: t.steps.map((s) => ({ ...s })),
                }))}
              />
            </div>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Bemor *</Label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Tanlang...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Tashxis *</Label><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Tavsif</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Boshlanish</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Tugash</Label><Input type="date" value={form.expected_end_date} onChange={(e) => setForm({ ...form, expected_end_date: e.target.value })} className="mt-1" /></div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Bosqichlar</Label>
              <div className="space-y-1 mb-2">
                {form.steps.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 text-sm">
                    <span>{s.title}</span>
                    <button onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newStep} onChange={(e) => setNewStep(e.target.value)} placeholder="Bosqich nomi..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), newStep.trim() && (setForm({ ...form, steps: [...form.steps, { title: newStep.trim(), done: false }] }), setNewStep("")))} />
                <Button type="button" size="sm" variant="outline" onClick={() => newStep.trim() && (setForm({ ...form, steps: [...form.steps, { title: newStep.trim(), done: false }] }), setNewStep(""))}><Plus className="w-3 h-3" /></Button>
              </div>
            </div>
            <Button onClick={save} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocPlans;
