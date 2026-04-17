import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar } from "lucide-react";

const STATUSES = [{ v: "active", l: "Aktiv", c: "bg-blue-500/15 text-blue-700" }, { v: "returned", l: "Qaytarilgan", c: "bg-emerald-500/15 text-emerald-700" }, { v: "overdue", l: "Muddati o'tgan", c: "bg-destructive/15 text-destructive" }, { v: "cancelled", l: "Bekor", c: "bg-muted text-muted-foreground" }];

const MTRentals = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ equipment_id: "", client_id: "", start_date: new Date().toISOString().slice(0, 10), end_date: "", daily_price: "", deposit: "", notes: "" });

  const load = async () => {
    const [r, e, c] = await Promise.all([
      supabase.from("medtech_rentals").select("*, medtech_equipment(name), medtech_clients(name, phone)").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("medtech_equipment").select("id, name, rental_daily_price").eq("vendor_id", vendorId),
      supabase.from("medtech_clients").select("id, name").eq("vendor_id", vendorId),
    ]);
    setItems(r.data || []); setEquipment(e.data || []); setClients(c.data || []);
  };
  useEffect(() => { load(); }, [vendorId]);

  const save = async () => {
    if (!form.equipment_id || !form.client_id || !form.end_date) return toast({ title: "Barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
    const days = Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000);
    const total = days * (parseFloat(form.daily_price) || 0);
    const { error } = await supabase.from("medtech_rentals").insert({ vendor_id: vendorId, equipment_id: form.equipment_id, client_id: form.client_id, start_date: form.start_date, end_date: form.end_date, daily_price: parseFloat(form.daily_price) || 0, total_amount: total, deposit: parseFloat(form.deposit) || 0, status: "active", notes: form.notes || null });
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    await supabase.from("medtech_equipment").update({ status: "in_use" }).eq("id", form.equipment_id);
    toast({ title: "✅ Ijara yozildi" });
    setShowForm(false); setForm({ equipment_id: "", client_id: "", start_date: new Date().toISOString().slice(0, 10), end_date: "", daily_price: "", deposit: "", notes: "" });
    load();
  };

  const returnRental = async (rental: any) => {
    if (!confirm("Uskunani qaytarmoqchimisiz?")) return;
    await supabase.from("medtech_rentals").update({ status: "returned", return_date: new Date().toISOString().slice(0, 10) }).eq("id", rental.id);
    await supabase.from("medtech_equipment").update({ status: "active" }).eq("id", rental.equipment_id);
    if (rental.total_amount > 0) {
      await supabase.from("medtech_transactions").insert({ vendor_id: vendorId, type: "income", category: "rental", amount: rental.total_amount, description: `Ijara: ${rental.medtech_equipment?.name}`, related_id: rental.id, related_type: "rental" });
    }
    toast({ title: "✅ Qaytarildi" });
    load();
  };

  const selEq = equipment.find(e => e.id === form.equipment_id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-semibold">Ijara ({items.length})</h3><Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Yangi ijara</Button></div>

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">Yangi ijara</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Uskuna *</Label><Select value={form.equipment_id} onValueChange={v => { const eq = equipment.find(e => e.id === v); setForm({ ...form, equipment_id: v, daily_price: String(eq?.rental_daily_price || "") }); }}><SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Mijoz *</Label><Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Boshlanish</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="mt-1" /></div>
              <div><Label>Tugash *</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="mt-1" /></div>
              <div><Label>Kunlik narx (UZS)</Label><Input type="number" value={form.daily_price} onChange={e => setForm({ ...form, daily_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Garov (UZS)</Label><Input type="number" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Eslatma</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            <div className="flex gap-2"><Button onClick={save}>Saqlash</Button><Button variant="outline" onClick={() => setShowForm(false)}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />Ijaralar yo'q</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(r => {
            const st = STATUSES.find(s => s.v === r.status);
            const overdue = r.status === "active" && new Date(r.end_date) < new Date();
            return (
              <Card key={r.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2"><p className="font-semibold">{r.medtech_equipment?.name}</p><Badge className={overdue ? "bg-destructive/15 text-destructive" : st?.c}>{overdue ? "Muddati o'tgan" : st?.l}</Badge></div>
                      <p className="text-xs text-muted-foreground mt-1">👤 {r.medtech_clients?.name} {r.medtech_clients?.phone && `• ${r.medtech_clients.phone}`}</p>
                      <p className="text-xs text-muted-foreground">📅 {r.start_date} → {r.end_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{Number(r.total_amount).toLocaleString()} UZS</p>
                      <p className="text-xs text-muted-foreground">{Number(r.daily_price).toLocaleString()}/kun</p>
                      {r.status === "active" && <Button size="sm" className="mt-2" onClick={() => returnRental(r)}>Qaytarildi</Button>}
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

export default MTRentals;
