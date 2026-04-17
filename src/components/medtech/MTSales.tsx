import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, ShoppingCart } from "lucide-react";

const METHODS = [{ v: "cash", l: "💵 Naqd" }, { v: "card", l: "💳 Karta" }, { v: "transfer", l: "🏦 O'tkazma" }, { v: "click", l: "Click" }, { v: "payme", l: "Payme" }];
const PAY_STATUSES = [{ v: "pending", l: "Kutilmoqda", c: "bg-amber-500/15 text-amber-700" }, { v: "partial", l: "Qisman", c: "bg-blue-500/15 text-blue-700" }, { v: "paid", l: "To'langan", c: "bg-emerald-500/15 text-emerald-700" }];

const MTSales = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ equipment_id: "", client_id: "", sale_price: "", paid_amount: "", payment_method: "cash", payment_status: "pending", sale_date: new Date().toISOString().slice(0, 10), notes: "" });

  const load = async () => {
    const [s, e, c] = await Promise.all([
      supabase.from("medtech_sales").select("*, medtech_equipment(name), medtech_clients(name)").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("medtech_equipment").select("id, name, sell_price").eq("vendor_id", vendorId).neq("status", "in_use"),
      supabase.from("medtech_clients").select("id, name").eq("vendor_id", vendorId),
    ]);
    setItems(s.data || []); setEquipment(e.data || []); setClients(c.data || []);
  };
  useEffect(() => { load(); }, [vendorId]);

  const save = async () => {
    if (!form.client_id || !form.sale_price) return toast({ title: "Mijoz va narx majburiy", variant: "destructive" });
    const price = parseFloat(form.sale_price) || 0;
    const paid = parseFloat(form.paid_amount) || 0;
    const status = paid >= price ? "paid" : paid > 0 ? "partial" : "pending";
    const { data, error } = await supabase.from("medtech_sales").insert({ vendor_id: vendorId, equipment_id: form.equipment_id || null, client_id: form.client_id, sale_price: price, paid_amount: paid, payment_method: form.payment_method, payment_status: status, sale_date: form.sale_date, notes: form.notes || null }).select().single();
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    if (paid > 0) {
      await supabase.from("medtech_transactions").insert({ vendor_id: vendorId, type: "income", category: "sale", amount: paid, description: `Sotuv: ${equipment.find(e => e.id === form.equipment_id)?.name || "Mahsulot"}`, related_id: data?.id, related_type: "sale", transaction_date: form.sale_date });
    }
    toast({ title: `✅ Sotildi (${data?.invoice_number || ""})` });
    setShowForm(false); setForm({ equipment_id: "", client_id: "", sale_price: "", paid_amount: "", payment_method: "cash", payment_status: "pending", sale_date: new Date().toISOString().slice(0, 10), notes: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-semibold">Sotuvlar ({items.length})</h3><Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Yangi sotuv</Button></div>

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">Yangi sotuv</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Uskuna</Label><Select value={form.equipment_id} onValueChange={v => { const eq = equipment.find(e => e.id === v); setForm({ ...form, equipment_id: v, sale_price: String(eq?.sell_price || form.sale_price) }); }}><SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Mijoz *</Label><Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Narx (UZS) *</Label><Input type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} className="mt-1" /></div>
              <div><Label>To'langan</Label><Input type="number" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} className="mt-1" /></div>
              <div><Label>To'lov usuli</Label><Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{METHODS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Sana</Label><Input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Eslatma</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            <div className="flex gap-2"><Button onClick={save}>Saqlash</Button><Button variant="outline" onClick={() => setShowForm(false)}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />Sotuvlar yo'q</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(s => {
            const st = PAY_STATUSES.find(p => p.v === s.payment_status);
            return (
              <Card key={s.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2"><p className="font-semibold">{s.medtech_equipment?.name || "—"}</p><Badge className={st?.c}>{st?.l}</Badge></div>
                      <p className="text-xs text-muted-foreground mt-1">👤 {s.medtech_clients?.name} • {s.sale_date}</p>
                      {s.invoice_number && <p className="text-xs text-muted-foreground">🧾 {s.invoice_number}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{Number(s.sale_price).toLocaleString()} UZS</p>
                      <p className="text-xs text-muted-foreground">To'langan: {Number(s.paid_amount).toLocaleString()}</p>
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

export default MTSales;
