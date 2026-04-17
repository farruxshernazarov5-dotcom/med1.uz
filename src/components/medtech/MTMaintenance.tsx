import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Wrench } from "lucide-react";

const TYPES = [{ v: "repair", l: "🛠 Ta'mirlash" }, { v: "routine", l: "🔧 Rejaviy" }, { v: "inspection", l: "🔍 Tekshiruv" }, { v: "calibration", l: "📐 Kalibrlash" }];
const STATUSES = [{ v: "pending", l: "Kutilmoqda", c: "bg-amber-500/15 text-amber-700" }, { v: "in_progress", l: "Jarayonda", c: "bg-blue-500/15 text-blue-700" }, { v: "completed", l: "Yakunlangan", c: "bg-emerald-500/15 text-emerald-700" }, { v: "cancelled", l: "Bekor", c: "bg-muted text-muted-foreground" }];

const MTMaintenance = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ equipment_id: "", technician_id: "", service_type: "repair", problem: "", solution: "", cost: "", status: "pending", service_date: new Date().toISOString().slice(0, 10), next_service_date: "", notes: "" });

  const load = async () => {
    const [m, e, t] = await Promise.all([
      supabase.from("medtech_maintenance").select("*, medtech_equipment(name), medtech_technicians(full_name)").eq("vendor_id", vendorId).order("service_date", { ascending: false }),
      supabase.from("medtech_equipment").select("id, name").eq("vendor_id", vendorId),
      supabase.from("medtech_technicians").select("id, full_name").eq("vendor_id", vendorId).eq("is_active", true),
    ]);
    setItems(m.data || []); setEquipment(e.data || []); setTechs(t.data || []);
  };
  useEffect(() => { load(); }, [vendorId]);

  const save = async () => {
    if (!form.equipment_id) return toast({ title: "Uskunani tanlang", variant: "destructive" });
    const payload: any = { vendor_id: vendorId, equipment_id: form.equipment_id, technician_id: form.technician_id || null, service_type: form.service_type, problem: form.problem || null, solution: form.solution || null, cost: parseFloat(form.cost) || 0, status: form.status, service_date: form.service_date, next_service_date: form.next_service_date || null, notes: form.notes || null };
    const { error } = await supabase.from("medtech_maintenance").insert(payload);
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    if (form.status === "completed" && parseFloat(form.cost) > 0) {
      await supabase.from("medtech_transactions").insert({ vendor_id: vendorId, type: "expense", category: "maintenance", amount: parseFloat(form.cost), description: `Servis: ${equipment.find(e => e.id === form.equipment_id)?.name}`, transaction_date: form.service_date });
    }
    toast({ title: "✅ Servis yozildi" });
    setShowForm(false); setForm({ equipment_id: "", technician_id: "", service_type: "repair", problem: "", solution: "", cost: "", status: "pending", service_date: new Date().toISOString().slice(0, 10), next_service_date: "", notes: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("medtech_maintenance").update({ status }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-semibold">Servis va ta'mirlash ({items.length})</h3><Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Servis qo'shish</Button></div>

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">Yangi servis yozuvi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Uskuna *</Label><Select value={form.equipment_id} onValueChange={v => setForm({ ...form, equipment_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Texnik</Label><Select value={form.technician_id} onValueChange={v => setForm({ ...form, technician_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent>{techs.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Servis turi</Label><Select value={form.service_type} onValueChange={v => setForm({ ...form, service_type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Sana</Label><Input type="date" value={form.service_date} onChange={e => setForm({ ...form, service_date: e.target.value })} className="mt-1" /></div>
              <div><Label>Keyingi servis</Label><Input type="date" value={form.next_service_date} onChange={e => setForm({ ...form, next_service_date: e.target.value })} className="mt-1" /></div>
              <div><Label>Xarajat (UZS)</Label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Muammo tavsifi</Label><Textarea value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} rows={2} className="mt-1" /></div>
            <div><Label>Yechim</Label><Textarea value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} rows={2} className="mt-1" /></div>
            <div className="flex gap-2"><Button onClick={save}>Saqlash</Button><Button variant="outline" onClick={() => setShowForm(false)}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" />Servis yozuvlari yo'q</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(m => {
            const st = STATUSES.find(s => s.v === m.status);
            return (
              <Card key={m.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{m.medtech_equipment?.name || "—"}</p>
                        <Badge className={st?.c}>{st?.l}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{TYPES.find(t => t.v === m.service_type)?.l} • {m.service_date}</p>
                      {m.medtech_technicians?.full_name && <p className="text-xs text-muted-foreground">👨‍🔧 {m.medtech_technicians.full_name}</p>}
                      {m.problem && <p className="text-sm mt-2">📋 {m.problem}</p>}
                      {m.solution && <p className="text-sm text-emerald-600 dark:text-emerald-400">✅ {m.solution}</p>}
                    </div>
                    <div className="text-right">
                      {m.cost > 0 && <p className="font-bold">{Number(m.cost).toLocaleString()} UZS</p>}
                      {m.next_service_date && <p className="text-xs text-muted-foreground mt-1">Keyingi: {m.next_service_date}</p>}
                    </div>
                  </div>
                  {m.status !== "completed" && m.status !== "cancelled" && (
                    <div className="flex gap-2 mt-3">
                      {m.status === "pending" && <Button size="sm" onClick={() => updateStatus(m.id, "in_progress")}>Boshlash</Button>}
                      {m.status === "in_progress" && <Button size="sm" onClick={() => updateStatus(m.id, "completed")}>Yakunlash</Button>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MTMaintenance;
