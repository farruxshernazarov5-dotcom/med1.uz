import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calendar, Check, Microscope } from "lucide-react";

const DiagnosticsBookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    patient_name: "", patient_phone: "+998",
    service_id: "", service_name: "",
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "09:00",
    notes: "",
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [c, s] = await Promise.all([
        supabase.from("registered_diagnostics" as any).select("*").eq("id", id).maybeSingle() as any,
        supabase.from("diagnostics_services" as any).select("*").eq("center_id", id) as any,
      ]);
      setCenter(c.data);
      setServices(s.data || []);
      setLoading(false);
    })();
  }, [id]);

  const submit = async () => {
    if (!form.patient_name || !form.patient_phone || !form.service_id) {
      toast.error("Barcha maydonlarni to'ldiring"); return;
    }
    setSubmitting(true);
    const sv = services.find((x) => x.id === form.service_id);
    const { error } = await supabase.from("diagnostics_appointments" as any).insert({
      center_id: id,
      patient_name: form.patient_name,
      patient_phone: form.patient_phone,
      service_id: form.service_id,
      service_name: sv?.name || "",
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      duration_min: 30,
      appt_source: "online",
      status: "waiting",
      notes: form.notes,
    } as any);
    if (error) toast.error("Xatolik: " + error.message);
    else setDone(true);
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!center) return <div className="p-8 text-center"><p>Diagnostika markazi topilmadi</p></div>;

  if (done) {
    return (
      <div className="container max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Uchrashuv qabul qilindi!</h2>
            <p className="text-muted-foreground mb-6">{center.name} markazi siz bilan bog'lanadi.</p>
            <Button onClick={() => navigate("/")}>Bosh sahifaga</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Microscope className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>{center.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Online uchrashuv band qilish</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Ism Familiya *</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} /></div>
          <div><Label>Telefon *</Label><Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} placeholder="+998 ..." /></div>
          <div><Label>Xizmat *</Label>
            <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
              <SelectTrigger><SelectValue placeholder="Xizmatni tanlang" /></SelectTrigger>
              <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} {s.price ? `— ${s.price.toLocaleString()} so'm` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Sana *</Label><Input type="date" min={new Date().toISOString().split("T")[0]} value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} /></div>
            <div><Label>Vaqt *</Label><Input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} /></div>
          </div>
          <div><Label>Eslatma</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <Button className="w-full" size="lg" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
            Uchrashuvni band qilish
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticsBookingPage;
