import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Plus, CheckCircle, Loader2 } from "lucide-react";

const PhPrescriptions = ({ pharmacyId }: { pharmacyId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", doctor_name: "", clinic_name: "", diagnosis: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("pharmacy_prescriptions" as any).select("*").eq("pharmacy_id", pharmacyId).order("created_at", { ascending: false });
    setItems((data as any[]) || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const add = async () => {
    if (!form.patient_name) { toast({ title: "Bemor ismi majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("pharmacy_prescriptions" as any).insert({ pharmacy_id: pharmacyId, ...form } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Retsept qo'shildi" });
    setShow(false); setForm({ patient_name: "", patient_phone: "", doctor_name: "", clinic_name: "", diagnosis: "", notes: "" });
    load();
  };

  const dispense = async (id: string) => {
    await supabase.from("pharmacy_prescriptions" as any).update({ status: "dispensed", dispensed_at: new Date().toISOString() } as any).eq("id", id);
    toast({ title: "✅ Retsept berildi" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Retseptlar ({items.length})</h3>
        <Button size="sm" onClick={() => setShow(!show)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>
      {show && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Bemor ismi *</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Telefon</Label><Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Shifokor</Label><Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Klinika</Label><Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Tashxis</Label><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="mt-1" /></div>
          <div><Label>Izohlar / dorilar</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1" /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={add} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali retseptlar yo'q</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Card key={p.id}><CardContent className="p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{p.patient_name}</p>
                  <Badge variant={p.status === "dispensed" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.doctor_name && `Dr. ${p.doctor_name}`} {p.clinic_name && `· ${p.clinic_name}`}
                </p>
                {p.diagnosis && <p className="text-xs mt-1">Tashxis: <span className="text-foreground">{p.diagnosis}</span></p>}
                {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
              </div>
              {p.status !== "dispensed" && (
                <Button size="sm" variant="outline" className="text-secondary" onClick={() => dispense(p.id)}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Berish
                </Button>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhPrescriptions;
