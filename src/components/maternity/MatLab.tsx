import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, FlaskConical, Trash2 } from "lucide-react";

export const MatLab = ({ centerId }: { centerId: string }) => {
  const [results, setResults] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ patient_id: "", test_name: "", test_type: "blood", result_value: "", normal_range: "", is_abnormal: false, notes: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const [r, p] = await Promise.all([
      supabase.from("maternity_lab_results" as any).select("*, maternity_patients(full_name)").eq("center_id", centerId).order("test_date", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setResults((r.data as any) || []);
    setPatients((p.data as any) || []);
  };

  const save = async () => {
    if (!form.patient_id || !form.test_name) { toast({ title: "Bemor va test nomi majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("maternity_lab_results" as any).insert({ ...form, center_id: centerId });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Natija qo'shildi" });
    setOpen(false);
    setForm({ patient_id: "", test_name: "", test_type: "blood", result_value: "", normal_range: "", is_abnormal: false, notes: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("maternity_lab_results" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  const TYPE_LABELS: Record<string, string> = { blood: "Qon", hormone: "Gormon", infection: "Infeksiya", urine: "Siydik" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><FlaskConical className="w-5 h-5 text-primary" /> Laboratoriya ({results.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi natija</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Laboratoriya natijasi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Bemor *</Label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Test turi</Label>
                  <select value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><Label>Test nomi *</Label><Input value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Natija</Label><Input value={form.result_value} onChange={(e) => setForm({ ...form, result_value: e.target.value })} className="mt-1" /></div>
                <div><Label>Normal oraliq</Label><Input value={form.normal_range} onChange={(e) => setForm({ ...form, normal_range: e.target.value })} className="mt-1" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_abnormal} onChange={(e) => setForm({ ...form, is_abnormal: e.target.checked })} /> Anomaliya bor</label>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {results.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Natijalar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {results.map((r: any) => (
            <Card key={r.id}><CardContent className="p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.test_name}</span>
                  <Badge variant="outline" className="text-xs">{TYPE_LABELS[r.test_type]}</Badge>
                  {r.is_abnormal && <Badge className="bg-red-500/10 text-red-600 text-xs">Anomaliya</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {r.maternity_patients?.full_name} • {r.test_date} • Natija: <span className="text-foreground font-medium">{r.result_value}</span>
                  {r.normal_range && <> (Norma: {r.normal_range})</>}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
