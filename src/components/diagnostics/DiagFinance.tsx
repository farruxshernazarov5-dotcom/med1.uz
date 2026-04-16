import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, X, DollarSign, TrendingUp } from "lucide-react";

interface Patient { id: string; full_name: string; }
interface LabOrder { id: string; order_number: string; total_price: number; }
interface Transaction {
  id: string; patient_id: string | null; order_id: string | null;
  amount: number; payment_method: string; status: string;
  invoice_number: string; created_at: string;
}

interface Props {
  centerId: string;
  transactions: Transaction[];
  patients: Patient[];
  orders: LabOrder[];
  onReload: () => void;
}

const DiagFinance = ({ centerId, transactions, patients, orders, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: "", order_id: "", amount: "", payment_method: "cash", notes: "" });

  const totalRevenue = transactions.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast({ title: "Summani kiriting", variant: "destructive" }); return; }
    const { error } = await supabase.from("diagnostics_transactions" as any).insert({
      center_id: centerId, patient_id: form.patient_id || null, order_id: form.order_id || null,
      amount: parseFloat(form.amount), payment_method: form.payment_method, notes: form.notes || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ To'lov qayd etildi" });
    setShowForm(false);
    setForm({ patient_id: "", order_id: "", amount: "", payment_method: "cash", notes: "" });
    onReload();
  };

  const getPatientName = (id: string | null) => patients.find((p) => p.id === id)?.full_name || "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalRevenue.toLocaleString()} so'm</p>
            <p className="text-xs text-muted-foreground">Jami daromad</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
            <p className="text-xs text-muted-foreground">Jami tranzaksiyalar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-foreground">{transactions.length > 0 ? Math.round(totalRevenue / transactions.length).toLocaleString() : 0} so'm</p>
            <p className="text-xs text-muted-foreground">O'rtacha chek</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground">To'lovlar</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> To'lov qo'shish</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Bemor</Label>
                <select value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <Label>Buyurtma</Label>
                <select value={form.order_id} onChange={(e) => setForm((p) => ({ ...p, order_id: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang...</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.order_number} — {o.total_price.toLocaleString()} so'm</option>)}
                </select>
              </div>
              <div><Label>Summa *</Label><Input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>To'lov usuli</Label>
                <select value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="click">Click</option>
                  <option value="payme">Payme</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {transactions.slice(0, 20).map((t) => (
          <Card key={t.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{getPatientName(t.patient_id)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-muted-foreground">{t.invoice_number}</span>
                  <Badge variant="outline" className="text-[10px]">{t.payment_method}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{t.amount.toLocaleString()} so'm</p>
                <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("uz-UZ")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DiagFinance;
