import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, FlaskConical, Send, X } from "lucide-react";

interface Props { doctorId: string }

const COMMON_TESTS = ["Umumiy qon tahlili (CBC)", "Qand", "Xolesterin", "Kreatinin", "TTG", "T3/T4", "AST/ALT", "Umumiy siydik"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Kutilmoqda", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  sent: { label: "Yuborilgan", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed: { label: "Tugallangan", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled: { label: "Bekor qilingan", color: "bg-muted text-muted-foreground" },
};

const DocLab = ({ doctorId }: Props) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: "", tests: [] as string[], clinical_info: "", urgency: "normal" });
  const [newTest, setNewTest] = useState("");

  const load = async () => {
    const [o, p] = await Promise.all([
      supabase.from("doctor_lab_orders").select("*, doctor_patients(full_name)").eq("doctor_id", doctorId).order("ordered_at", { ascending: false }),
      supabase.from("doctor_patients").select("id, full_name").eq("doctor_id", doctorId),
    ]);
    setOrders(o.data || []); setPatients(p.data || []);
  };
  useEffect(() => { load(); }, [doctorId]);

  const addTest = (t: string) => {
    const v = t.trim(); if (!v || form.tests.includes(v)) return;
    setForm({ ...form, tests: [...form.tests, v] }); setNewTest("");
  };

  const sendOrder = async () => {
    if (!form.patient_id || form.tests.length === 0) {
      toast({ title: "Bemor va kamida 1 ta tahlil tanlang", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("doctor_lab_orders").insert({
      doctor_id: doctorId, patient_id: form.patient_id, test_types: form.tests,
      clinical_info: form.clinical_info, urgency: form.urgency, status: "sent",
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Lab buyurtmasi yuborildi" });
      setOpen(false); setForm({ patient_id: "", tests: [], clinical_info: "", urgency: "normal" }); load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("doctor_lab_orders").update({
      status, completed_at: status === "completed" ? new Date().toISOString() : null,
    }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading font-bold text-xl text-foreground">Laboratoriya buyurtmalari</h2>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Send className="w-4 h-4 mr-1" /> Send to Lab
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" /> Hali lab buyurtmalari yo'q
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const s = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
            return (
              <div key={o.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{o.doctor_patients?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.ordered_at).toLocaleDateString("uz-UZ")} • {o.urgency === "urgent" ? "🚨 Shoshilinch" : "Oddiy"}</p>
                  </div>
                  <Badge variant="outline" className={s.color}>{s.label}</Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(o.test_types || []).map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
                {o.clinical_info && <p className="text-xs text-muted-foreground mt-2">{o.clinical_info}</p>}
                <div className="flex gap-2 mt-3">
                  {o.status === "sent" && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "completed")}>Tugallangan</Button>}
                  {o.status !== "cancelled" && o.status !== "completed" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(o.id, "cancelled")}>Bekor qilish</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yangi laboratoriya buyurtmasi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Bemor *</Label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Tanlang...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Tahlillar *</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_TESTS.map(t => (
                  <Badge key={t} variant={form.tests.includes(t) ? "default" : "outline"} className="cursor-pointer text-xs"
                    onClick={() => form.tests.includes(t) ? setForm({ ...form, tests: form.tests.filter(x => x !== t) }) : addTest(t)}>{t}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newTest} onChange={(e) => setNewTest(e.target.value)} placeholder="Boshqa tahlil..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTest(newTest))} />
                <Button type="button" size="sm" variant="outline" onClick={() => addTest(newTest)}><Plus className="w-3 h-3" /></Button>
              </div>
              {form.tests.filter(t => !COMMON_TESTS.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.tests.filter(t => !COMMON_TESTS.includes(t)).map(t => (
                    <Badge key={t} className="text-[10px] gap-1">{t}<button onClick={() => setForm({ ...form, tests: form.tests.filter(x => x !== t) })}><X className="w-2.5 h-2.5" /></button></Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Shoshilinchlik</Label>
              <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="normal">Oddiy</option>
                <option value="urgent">Shoshilinch</option>
              </select>
            </div>
            <div><Label className="text-xs">Klinik ma'lumot</Label><Textarea rows={2} value={form.clinical_info} onChange={(e) => setForm({ ...form, clinical_info: e.target.value })} className="mt-1" /></div>
            <Button onClick={sendOrder} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
              <Send className="w-4 h-4 mr-2" /> Yuborish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocLab;
