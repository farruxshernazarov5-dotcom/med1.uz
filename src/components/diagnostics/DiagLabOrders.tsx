import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Save, FlaskConical, CheckCircle, Clock, XCircle } from "lucide-react";

interface Patient { id: string; full_name: string; phone: string; }
interface Service { id: string; name: string; price: number; category: string; }
interface LabOrder {
  id: string; order_number: string; patient_id: string; service_id: string | null;
  doctor_name: string | null; status: string; priority: string; total_price: number;
  notes: string | null; created_at: string;
}

interface Props {
  centerId: string;
  orders: LabOrder[];
  patients: Patient[];
  services: Service[];
  onReload: () => void;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Kutilmoqda", variant: "default" },
  in_progress: { label: "Jarayonda", variant: "secondary" },
  completed: { label: "Tayyor", variant: "outline" },
  cancelled: { label: "Bekor", variant: "destructive" },
};

const DiagLabOrders = ({ centerId, orders, patients, services, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: "", service_id: "", doctor_name: "", priority: "normal", notes: "" });

  const handleSave = async () => {
    if (!form.patient_id) { toast({ title: "Bemorni tanlang", variant: "destructive" }); return; }
    const svc = services.find((s) => s.id === form.service_id);
    const { error } = await supabase.from("diagnostics_lab_orders" as any).insert({
      center_id: centerId, patient_id: form.patient_id,
      service_id: form.service_id || null, doctor_name: form.doctor_name || null,
      priority: form.priority, notes: form.notes || null,
      total_price: svc?.price || 0,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Buyurtma yaratildi" });
    setShowForm(false);
    setForm({ patient_id: "", service_id: "", doctor_name: "", priority: "normal", notes: "" });
    onReload();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("diagnostics_lab_orders" as any).update({ status } as any).eq("id", id);
    if (error) { toast({ title: "Xatolik", variant: "destructive" }); return; }
    toast({ title: `Holat "${STATUS_MAP[status]?.label}" ga o'zgartirildi` });
    onReload();
  };

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.full_name || "—";
  const getServiceName = (id: string | null) => services.find((s) => s.id === id)?.name || "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground">Laboratoriya buyurtmalari</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Yangi buyurtma</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Yangi buyurtma</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Bemor *</Label>
                <select value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} — {p.phone}</option>)}
                </select>
              </div>
              <div>
                <Label>Xizmat (analiz turi)</Label>
                <select value={form.service_id} onChange={(e) => setForm((p) => ({ ...p, service_id: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang...</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.price.toLocaleString()} so'm</option>)}
                </select>
              </div>
              <div><Label>Shifokor ismi</Label><Input value={form.doctor_name} onChange={(e) => setForm((p) => ({ ...p, doctor_name: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Muhimlik</Label>
                <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="normal">Oddiy</option>
                  <option value="urgent">Shoshilinch</option>
                  <option value="critical">Juda muhim</option>
                </select>
              </div>
            </div>
            <div><Label>Izoh</Label><Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Yaratish</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />Buyurtmalar yo'q</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
            return (
              <Card key={o.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{o.order_number}</span>
                        {o.priority === "urgent" && <Badge className="bg-amber-500/20 text-amber-600 text-[10px]">Shoshilinch</Badge>}
                        {o.priority === "critical" && <Badge className="bg-destructive/20 text-destructive text-[10px]">Juda muhim</Badge>}
                      </div>
                      <p className="font-medium text-foreground">{getPatientName(o.patient_id)}</p>
                      <p className="text-sm text-muted-foreground">{getServiceName(o.service_id)}</p>
                      {o.doctor_name && <p className="text-xs text-muted-foreground mt-1">👨‍⚕️ {o.doctor_name}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <span className="text-sm font-semibold text-primary">{o.total_price?.toLocaleString()} so'm</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {o.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "in_progress")}><Clock className="w-3 h-3 mr-1" /> Boshlash</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(o.id, "cancelled")}><XCircle className="w-3 h-3 mr-1" /> Bekor</Button>
                        </>
                      )}
                      {o.status === "in_progress" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "completed")}><CheckCircle className="w-3 h-3 mr-1" /> Tayyor</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiagLabOrders;
