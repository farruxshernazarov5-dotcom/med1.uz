import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const CATS = ["sale", "rental", "maintenance", "inventory", "salary", "other"];

const MTFinance = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "income", category: "other", amount: "", description: "", transaction_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const { data } = await supabase.from("medtech_transactions").select("*").eq("vendor_id", vendorId).order("transaction_date", { ascending: false }).limit(100);
    setItems(data || []);
  };
  useEffect(() => { load(); }, [vendorId]);

  const save = async () => {
    if (!form.amount) return toast({ title: "Summa majburiy", variant: "destructive" });
    const { error } = await supabase.from("medtech_transactions").insert({ vendor_id: vendorId, type: form.type, category: form.category, amount: parseFloat(form.amount), description: form.description || null, related_type: "manual", transaction_date: form.transaction_date });
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    toast({ title: "✅ Saqlandi" });
    setShowForm(false); setForm({ type: "income", category: "other", amount: "", description: "", transaction_date: new Date().toISOString().slice(0, 10) });
    load();
  };

  const income = items.filter(i => i.type === "income").reduce((s, i) => s + Number(i.amount), 0);
  const expense = items.filter(i => i.type === "expense").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"><TrendingUp className="w-6 h-6 text-emerald-500 mb-2" /><p className="text-2xl font-bold">{income.toLocaleString()} UZS</p><p className="text-xs text-muted-foreground">Tushum</p></div>
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-destructive/10 to-destructive/5"><TrendingDown className="w-6 h-6 text-destructive mb-2" /><p className="text-2xl font-bold">{expense.toLocaleString()} UZS</p><p className="text-xs text-muted-foreground">Xarajat</p></div>
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-primary/10 to-primary/5"><DollarSign className="w-6 h-6 text-primary mb-2" /><p className="text-2xl font-bold">{(income - expense).toLocaleString()} UZS</p><p className="text-xs text-muted-foreground">Sof foyda</p></div>
      </div>

      <div className="flex justify-between items-center"><h3 className="font-semibold">Tranzaksiyalar</h3><Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button></div>

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">Yangi tranzaksiya</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Turi</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">📈 Tushum</SelectItem><SelectItem value="expense">📉 Xarajat</SelectItem></SelectContent></Select></div>
              <div><Label>Kategoriya</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Summa (UZS)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div>
              <div><Label>Sana</Label><Input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Izoh</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="flex gap-2"><Button onClick={save}>Saqlash</Button><Button variant="outline" onClick={() => setShowForm(false)}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Tranzaksiyalar yo'q</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map(t => (
            <Card key={t.id}>
              <CardContent className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{t.description || t.category}</p>
                  <p className="text-xs text-muted-foreground">{t.transaction_date} • {t.category}</p>
                </div>
                <p className={`font-bold ${t.type === "income" ? "text-emerald-600" : "text-destructive"}`}>{t.type === "income" ? "+" : "-"}{Number(t.amount).toLocaleString()} UZS</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MTFinance;
