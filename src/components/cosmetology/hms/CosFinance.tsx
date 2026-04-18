import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Wallet, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CosFinance = ({ centerId }: { centerId: string }) => {
  const [txs, setTxs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "income", category: "service", amount: "", payment_method: "cash", description: "", client_id: "" });

  const load = async () => {
    const [t, c] = await Promise.all([
      supabase.from("cosmetology_transactions" as any).select("*, cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }).limit(100),
      supabase.from("cosmetology_clients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setTxs((t.data as any[]) || []);
    setClients((c.data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.amount) { toast({ title: "Summa kiriting", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_transactions" as any).insert({
      center_id: centerId, type: form.type, category: form.category, amount: parseFloat(form.amount),
      payment_method: form.payment_method, description: form.description, client_id: form.client_id || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Tranzaksiya saqlandi" });
    setShowForm(false);
    setForm({ type: "income", category: "service", amount: "", payment_method: "cash", description: "", client_id: "" });
    load();
  };

  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const profit = income - expense;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <TrendingUp className="w-6 h-6 text-emerald-500 mb-2" />
          <p className="text-lg font-bold text-emerald-500">{income.toLocaleString()} so'm</p>
          <p className="text-xs text-muted-foreground">Daromad</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <TrendingDown className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-lg font-bold text-red-500">{expense.toLocaleString()} so'm</p>
          <p className="text-xs text-muted-foreground">Xarajat</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Wallet className="w-6 h-6 text-primary mb-2" />
          <p className="text-lg font-bold text-primary">{profit.toLocaleString()} so'm</p>
          <p className="text-xs text-muted-foreground">Foyda</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Tranzaksiyalar</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tur</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Daromad</option><option value="expense">Xarajat</option>
              </select>
            </div>
            <div>
              <Label>Kategoriya</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="service">Xizmat</option><option value="package">Paket</option><option value="product">Mahsulot</option><option value="rent">Ijara</option><option value="salary">Maosh</option><option value="other">Boshqa</option>
              </select>
            </div>
            <div><Label>Summa *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>To'lov usuli</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="cash">Naqd</option><option value="card">Karta</option><option value="online">Online</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Mijoz</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div className="col-span-2"><Label>Tavsif</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {txs.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{t.description || t.category}</p>
                <Badge variant="outline" className="text-xs">{t.payment_method}</Badge>
                {t.invoice_number && <span className="text-[10px] text-muted-foreground">#{t.invoice_number}</span>}
              </div>
              <p className="text-xs text-muted-foreground">{t.cosmetology_clients?.full_name} · {new Date(t.created_at).toLocaleDateString("uz-UZ")}</p>
            </div>
            <p className={cn("text-sm font-bold", t.type === "income" ? "text-emerald-500" : "text-red-500")}>
              {t.type === "income" ? "+" : "−"} {Number(t.amount).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CosFinance;
