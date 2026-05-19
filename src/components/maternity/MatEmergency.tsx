import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Siren, CheckCircle2, Plus, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TYPES = [
  { v: "bleeding", l: "🩸 Qon ketishi" },
  { v: "hypertension", l: "💢 Gipertenziya" },
  { v: "fetal_distress", l: "👶 Fetal distress" },
  { v: "preeclampsia", l: "⚠️ Preeklampsiya" },
  { v: "other", l: "Boshqa" },
];

const SEVERITIES = [
  { v: "critical", l: "Kritik", color: "bg-red-500 text-white animate-pulse" },
  { v: "high", l: "Yuqori", color: "bg-orange-500 text-white" },
  { v: "medium", l: "O'rta", color: "bg-amber-400 text-amber-900" },
];

export const MatEmergency = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: "", emergency_type: "bleeding", severity: "high", description: "" });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [em, pat] = await Promise.all([
      supabase.from("maternity_emergencies" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId).limit(200),
    ]);
    setItems((em.data as any) || []);
    setPatients((pat.data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`mat-emerg-${centerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "maternity_emergencies", filter: `center_id=eq.${centerId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [centerId]);

  const trigger = async () => {
    const { error } = await supabase.from("maternity_emergencies" as any).insert({
      ...form,
      patient_id: form.patient_id || null,
      center_id: centerId,
      status: "active",
    });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "🚨 Shoshilinch holat qo'shildi", description: "Jamoaga signal yuborildi" });
    setOpen(false);
    setForm({ patient_id: "", emergency_type: "bleeding", severity: "high", description: "" });
  };

  const resolve = async (id: string) => {
    await supabase.from("maternity_emergencies" as any).update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    }).eq("id", id);
    toast({ title: "Holat hal qilindi" });
  };

  const active = items.filter(i => i.status === "active");
  const resolved = items.filter(i => i.status !== "active");

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-6 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur"><Siren className="w-8 h-8" /></div>
            <div>
              <h2 className="text-2xl font-bold">Emergency Obstetric Dashboard</h2>
              <p className="text-sm text-white/90">Faol: {active.length} · Hal qilingan: {resolved.length}</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="secondary" className="bg-white text-rose-600 hover:bg-white/90 shadow-lg">
                <Plus className="w-5 h-5 mr-2" /> Yangi signal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>🚨 Shoshilinch holat</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Bemorni tanlang (ixtiyoriy)" /></SelectTrigger>
                  <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.emergency_type} onValueChange={v => setForm({ ...form, emergency_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Tafsilotlar..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <Button onClick={trigger} className="w-full bg-red-500 hover:bg-red-600 text-white">🚨 Signal yuborish</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> : (
        <>
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground"><Activity className="w-4 h-4 text-red-500" /> Faol holatlar</h3>
            {active.length === 0 ? (
              <Card><CardContent className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-muted-foreground">Faol shoshilinch holatlar yo'q ✨</p>
              </CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {active.map((e) => {
                  const sv = SEVERITIES.find(s => s.v === e.severity);
                  const tp = TYPES.find(t => t.v === e.emergency_type);
                  const patient = patients.find(p => p.id === e.patient_id);
                  return (
                    <Card key={e.id} className="border-l-4 border-l-red-500 bg-red-50/50">
                      <CardContent className="p-4 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={sv?.color}>{sv?.l}</Badge>
                            <span className="font-semibold text-foreground">{tp?.l}</span>
                          </div>
                          {patient && <p className="text-sm text-foreground">Bemor: <span className="font-medium">{patient.full_name}</span></p>}
                          {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
                          <p className="text-xs text-muted-foreground mt-2">{new Date(e.created_at).toLocaleString("uz-UZ")}</p>
                        </div>
                        <Button size="sm" onClick={() => resolve(e.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Hal qilish
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {resolved.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hal qilingan (oxirgi)</h3>
              <div className="grid gap-2">
                {resolved.slice(0, 10).map((e) => {
                  const tp = TYPES.find(t => t.v === e.emergency_type);
                  return (
                    <Card key={e.id} className="opacity-70"><CardContent className="p-3 flex items-center justify-between text-sm">
                      <span><AlertTriangle className="w-3 h-3 inline mr-1" /> {tp?.l}</span>
                      <span className="text-xs text-muted-foreground">{new Date(e.resolved_at || e.created_at).toLocaleDateString("uz-UZ")}</span>
                    </CardContent></Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
