import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Wallet, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PhFinance = ({ pharmacyId }: { pharmacyId: string }) => {
  const [tx, setTx] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: "", amount: "", description: "" });

  const load = async () => {
    const { data } = await supabase.from("pharmacy_transactions" as any).select("*").eq("pharmacy_id", pharmacyId).order("created_at", { ascending: false });
    setTx((data as any[]) || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const add = async () => {
    if (!form.amount) { toast({ title: "Summa majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("pharmacy_transactions" as any).insert({
      pharmacy_id: pharmacyId, type: form.type, category: form.category, amount: parseFloat(form.amount), description: form.description,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Tranzaksiya saqlandi" });
    setShow(false); setForm({ type: "expense", category: "", amount: "", description: "" });
    load();
  };

  const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const profit = income - expense;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <TrendingUp className="w-6 h-6 text-emerald-500 mb-2" />
          <p className="text-lg font-bold">{income.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Daromad</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <TrendingDown className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-lg font-bold">{expense.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Xarajat</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Wallet className="w-6 h-6 text-secondary mb-2" />
          <p className={cn("text-lg font-bold", profit >= 0 ? "text-emerald-500" : "text-red-500")}>{profit.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Foyda</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold">Tranzaksiyalar ({tx.length})</h3>
        <Button size="sm" onClick={() => setShow(!show)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>

      {show && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tur</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Xarajat</option>
                <option value="income">Daromad</option>
              </select>
            </div>
            <div><Label>Kategoriya</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="masalan: maosh, ijara" className="mt-1" /></div>
            <div><Label>Summa *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div>
            <div><Label>Izoh</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={add} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {tx.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge className={t.type === "income" ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}>{t.type === "income" ? "+" : "-"}</Badge>
                <p className="text-sm font-medium">{t.description || t.category || "—"}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString("uz-UZ")} {t.category && `· ${t.category}`}</p>
            </div>
            <span className={cn("font-bold", t.type === "income" ? "text-emerald-500" : "text-red-500")}>
              {t.type === "income" ? "+" : "-"}{Number(t.amount).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhFinance;
