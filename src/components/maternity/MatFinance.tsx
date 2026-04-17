import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, DollarSign, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = { paid: "bg-emerald-500/10 text-emerald-600", unpaid: "bg-red-500/10 text-red-600", partial: "bg-amber-500/10 text-amber-600" };
const STATUS_LABELS: Record<string, string> = { paid: "To'langan", unpaid: "To'lanmagan", partial: "Qisman" };

export const MatFinance = ({ centerId }: { centerId: string }) => {
  const [tx, setTx] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ patient_id: "", type: "income", category: "delivery_package", amount: 0, paid_amount: 0, payment_method: "cash", status: "paid", description: "" });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const [t, p] = await Promise.all([
      supabase.from("maternity_transactions" as any).select("*, maternity_patients(full_name)").eq("center_id", centerId).order("transaction_date", { ascending: false }),
      supabase.from("maternity_patients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setTx((t.data as any) || []);
    setPatients((p.data as any) || []);
  };

  const save = async () => {
    if (!form.amount) { toast({ title: "Summa majburiy", variant: "destructive" }); return; }
    const status = form.paid_amount >= form.amount ? "paid" : form.paid_amount > 0 ? "partial" : "unpaid";
    const { error } = await supabase.from("maternity_transactions" as any).insert({ ...form, status, center_id: centerId, patient_id: form.patient_id || null });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Tranzaksiya qo'shildi" });
    setOpen(false);
    setForm({ patient_id: "", type: "income", category: "delivery_package", amount: 0, paid_amount: 0, payment_method: "cash", status: "paid", description: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("maternity_transactions" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  const income = tx.filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.paid_amount || t.amount), 0);
  const expense = tx.filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Number(t.paid_amount || t.amount), 0);
  const debt = tx.filter((t) => t.type === "income" && t.status !== "paid").reduce((s, t) => s + (Number(t.amount) - Number(t.paid_amount)), 0);

  const CATEGORIES = ["delivery_package", "consultation", "lab", "ultrasound", "medication", "salary", "supplies", "utilities", "other"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{income.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Daromad</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{expense.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Xarajat</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{debt.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Qarzdorlik</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg">Tranzaksiyalar ({tx.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Tranzaksiya</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Turi</Label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="income">Daromad</option><option value="expense">Xarajat</option>
                  </select></div>
                <div><Label>Kategoriya</Label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><Label>Summa *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value, paid_amount: +e.target.value })} className="mt-1" /></div>
                <div><Label>To'langan</Label><Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: +e.target.value })} className="mt-1" /></div>
                <div><Label>To'lov usuli</Label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="cash">Naqd</option><option value="card">Karta</option><option value="click">Click</option><option value="payme">Payme</option>
                  </select></div>
                <div><Label>Bemor</Label>
                  <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="">— Ixtiyoriy —</option>
                    {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select></div>
              </div>
              <div><Label>Tavsif</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tx.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Tranzaksiyalar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {tx.map((t: any) => (
            <Card key={t.id}><CardContent className="p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{t.invoice_number}</span>
                  <Badge variant={t.type === "income" ? "default" : "destructive"} className="text-xs">{t.type === "income" ? "Daromad" : "Xarajat"}</Badge>
                  <Badge className={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                  <span className="text-sm font-bold">{Number(t.amount).toLocaleString()} so'm</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.transaction_date} • {t.category} • {t.payment_method}
                  {t.maternity_patients && ` • ${t.maternity_patients.full_name}`}
                  {t.description && ` • ${t.description}`}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(t.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
