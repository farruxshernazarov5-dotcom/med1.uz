import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, FileText, Calendar } from "lucide-react";

interface Props { doctorId: string }

const DocRecords = ({ doctorId }: Props) => {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: "", diagnosis: "", symptoms: "", icd_code: "", notes: "", record_date: new Date().toISOString().split("T")[0] });

  const load = async () => {
    const [r, p] = await Promise.all([
      supabase.from("doctor_records").select("*, doctor_patients(full_name)").eq("doctor_id", doctorId).order("created_at", { ascending: false }).limit(50),
      supabase.from("doctor_patients").select("id, full_name").eq("doctor_id", doctorId),
    ]);
    setRecords(r.data || []); setPatients(p.data || []);
  };
  useEffect(() => { load(); }, [doctorId]);

  const save = async () => {
    if (!form.patient_id || !form.diagnosis.trim()) {
      toast({ title: "Bemor va tashxis majburiy", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("doctor_records").insert({
      doctor_id: doctorId,
      patient_id: form.patient_id,
      diagnosis: form.diagnosis,
      symptoms: form.symptoms,
      icd_code: form.icd_code,
      notes: form.notes,
      record_date: form.record_date,
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Yozuv saqlandi" }); setOpen(false); load(); }
  };

  const patientName = (id: string) => patients.find(p => p.id === id)?.full_name || "—";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading font-bold text-xl text-foreground">Tibbiy yozuvlar</h2>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Plus className="w-4 h-4 mr-1" /> Yangi tashxis
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /> Hali tibbiy yozuvlar yo'q
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">{r.diagnosis}</p>
                  <p className="text-xs text-muted-foreground">{r.doctor_patients?.full_name || "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.record_date || r.created_at).toLocaleDateString("uz-UZ")}</span>
              </div>
              {r.symptoms && <p className="text-sm text-muted-foreground"><strong>Simptomlar:</strong> {r.symptoms}</p>}
              {r.icd_code && <p className="text-xs text-muted-foreground mt-1">ICD: {r.icd_code}</p>}
              {r.notes && <p className="text-sm text-foreground mt-2">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yangi tibbiy yozuv</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Bemor *</Label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Tanlang...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Sana</Label><Input type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Tashxis *</Label><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">ICD-10 kodi</Label><Input value={form.icd_code} onChange={(e) => setForm({ ...form, icd_code: e.target.value })} placeholder="masalan: J06.9" className="mt-1" /></div>
            <div><Label className="text-xs">Simptomlar</Label><Textarea rows={2} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Shifokor xulosasi</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            <Button onClick={save} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocRecords;
