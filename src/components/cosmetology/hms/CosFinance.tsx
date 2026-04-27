import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Wallet, Plus, TrendingUp, TrendingDown, Loader2, Receipt, Download, Filter, DollarSign, CreditCard, Smartphone, Banknote, Building2, PieChart as PieIcon, BarChart3, Trash2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from "recharts";
import { downloadHMSReceipt } from "@/utils/downloadHMSReceipt";

const EXPENSE_CATEGORIES = ["rent", "salary", "supplies", "marketing", "utilities", "equipment", "other"];
const INCOME_CATEGORIES = ["service", "package_sale", "course", "product", "other"];
const PAY_METHODS = [
  { v: "cash", label: "Naqd", icon: Banknote, color: "emerald" },
  { v: "card", label: "Karta", icon: CreditCard, color: "blue" },
  { v: "click", label: "Click", icon: Smartphone, color: "violet" },
  { v: "payme", label: "Payme", icon: Smartphone, color: "cyan" },
  { v: "transfer", label: "O'tkazma", icon: Building2, color: "amber" },
];
const PIE_COLORS = ["hsl(var(--primary))", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const CosFinance = ({ centerId }: { centerId: string }) => {
  const [txs, setTxs] = useState<any[]>([]);
  const [center, setCenter] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [form, setForm] = useState({ type: "income", category: "service", amount: "", payment_method: "cash", description: "", client_id: "" });
  const [splitForm, setSplitForm] = useState({ client_id: "", description: "", total: "", cash: "", card: "", click: "", payme: "", transfer: "" });

  const load = async () => {
    const [t, c, ct] = await Promise.all([
      supabase.from("cosmetology_transactions" as any).select("*, cosmetology_clients(full_name, phone)").eq("center_id", centerId).order("created_at", { ascending: false }).limit(500),
      supabase.from("cosmetology_clients" as any).select("id, full_name, phone").eq("center_id", centerId).order("full_name"),
      supabase.from("registered_cosmetology" as any).select("center_name, brand_name").eq("id", centerId).single(),
    ]);
    setTxs((t.data as any[]) || []);
    setClients((c.data as any[]) || []);
    setCenter(ct.data || null);
  };
  useEffect(() => { load(); }, [centerId]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = period === "today" ? now - 86400000 : period === "week" ? now - 7 * 86400000 : period === "month" ? now - 30 * 86400000 : 0;
    return txs.filter((t) => {
      if (cutoff && new Date(t.created_at).getTime() < cutoff) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      return true;
    });
  }, [txs, period, filterType]);

  const stats = useMemo(() => {
    const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    const avgTicket = filtered.filter((t) => t.type === "income").length > 0 ? income / filtered.filter((t) => t.type === "income").length : 0;
    return { income, expense, profit, margin, avgTicket, count: filtered.length };
  }, [filtered]);

  const chartData = useMemo(() => {
    const days = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 60;
    const map = new Map<string, { date: string; income: number; expense: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = d.toISOString().split("T")[0];
      map.set(k, { date: d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }), income: 0, expense: 0 });
    }
    filtered.forEach((t) => {
      const k = new Date(t.created_at).toISOString().split("T")[0];
      const e = map.get(k);
      if (e) {
        if (t.type === "income") e.income += Number(t.amount || 0);
        else e.expense += Number(t.amount || 0);
      }
    });
    return Array.from(map.values());
  }, [filtered, period]);

  const methodData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter((t) => t.type === "income").forEach((t) => {
      const k = t.payment_method || "other";
      map.set(k, (map.get(k) || 0) + Number(t.amount || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name: PAY_METHODS.find((p) => p.v === name)?.label || name, value }));
  }, [filtered]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter((t) => t.type === "expense").forEach((t) => {
      const k = t.category || "other";
      map.set(k, (map.get(k) || 0) + Number(t.amount || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast({ title: "Summa kiriting", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_transactions" as any).insert({
      center_id: centerId, type: form.type, category: form.category, amount: parseFloat(form.amount),
      payment_method: form.payment_method, description: form.description, client_id: form.client_id || null,
      status: "paid",
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Tranzaksiya saqlandi" });
    setShowForm(false);
    setForm({ type: "income", category: "service", amount: "", payment_method: "cash", description: "", client_id: "" });
    load();
  };

  const saveSplit = async () => {
    const total = Number(splitForm.total || 0);
    const parts = [
      { method: "cash", amt: Number(splitForm.cash || 0) },
      { method: "card", amt: Number(splitForm.card || 0) },
      { method: "click", amt: Number(splitForm.click || 0) },
      { method: "payme", amt: Number(splitForm.payme || 0) },
      { method: "transfer", amt: Number(splitForm.transfer || 0) },
    ].filter((p) => p.amt > 0);
    const sum = parts.reduce((s, p) => s + p.amt, 0);
    if (total <= 0 || parts.length === 0) { toast({ title: "Summalarni kiriting", variant: "destructive" }); return; }
    if (Math.abs(sum - total) > 0.01) { toast({ title: `Summa mos kelmadi: ${sum.toLocaleString()} ≠ ${total.toLocaleString()}`, variant: "destructive" }); return; }
    setSaving(true);
    const rows = parts.map((p) => ({
      center_id: centerId, type: "income", category: "service", amount: p.amt,
      payment_method: p.method, description: `${splitForm.description} (split ${parts.length} qism)`,
      client_id: splitForm.client_id || null, status: "paid",
    }));
    const { error } = await supabase.from("cosmetology_transactions" as any).insert(rows as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Split to'lov saqlandi", description: `${parts.length} ta qism, jami ${total.toLocaleString()} so'm` });
    setShowSplit(false);
    setSplitForm({ client_id: "", description: "", total: "", cash: "", card: "", click: "", payme: "", transfer: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("cosmetology_transactions" as any).delete().eq("id", id);
    load();
  };

  const printReceipt = (t: any) => {
    downloadHMSReceipt({
      clinicName: center?.brand_name || center?.center_name || "Cosmetology Center",
      patientName: t.cosmetology_clients?.full_name || "Mijoz",
      patientPhone: t.cosmetology_clients?.phone,
      invoiceNumber: t.invoice_number || `COS-${t.id.slice(0, 8)}`,
      date: new Date(t.created_at).toLocaleDateString("uz-UZ"),
      items: [{ name: t.description || t.category, qty: 1, price: Number(t.amount) }],
      paymentMethod: t.payment_method,
    });
  };

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {[{ v: "today", l: "Bugun" }, { v: "week", l: "Hafta" }, { v: "month", l: "Oy" }, { v: "all", l: "Hammasi" }].map((p) => (
            <button key={p.v} onClick={() => setPeriod(p.v as any)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${period === p.v ? "bg-background shadow text-primary" : "text-muted-foreground"}`}>{p.l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowSplit(true)}><Receipt className="w-4 h-4 mr-1" /> Split to'lov</Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Tranzaksiya</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-emerald-600"><TrendingUp className="w-3 h-3" /> Daromad</div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{(stats.income / 1000000).toFixed(2)}M</p>
          <p className="text-[10px] text-muted-foreground">{stats.income.toLocaleString()} so'm</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-rose-600"><TrendingDown className="w-3 h-3" /> Xarajat</div>
          <p className="text-xl font-bold text-rose-600 mt-1">{(stats.expense / 1000000).toFixed(2)}M</p>
          <p className="text-[10px] text-muted-foreground">{stats.expense.toLocaleString()} so'm</p>
        </CardContent></Card>
        <Card className={`bg-gradient-to-br ${stats.profit >= 0 ? "from-primary/10 to-primary/5 border-primary/20" : "from-destructive/10 to-destructive/5 border-destructive/20"}`}><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs"><DollarSign className="w-3 h-3" /> Sof foyda</div>
          <p className={`text-xl font-bold mt-1 ${stats.profit >= 0 ? "text-primary" : "text-destructive"}`}>{(stats.profit / 1000000).toFixed(2)}M</p>
          <p className="text-[10px] text-muted-foreground">Marja: {stats.margin.toFixed(1)}%</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-blue-600"><Receipt className="w-3 h-3" /> O'rta chek</div>
          <p className="text-xl font-bold text-blue-600 mt-1">{(stats.avgTicket / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-muted-foreground">so'm</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-violet-600"><BarChart3 className="w-3 h-3" /> Tranzaksiya</div>
          <p className="text-xl font-bold text-violet-600 mt-1">{stats.count}</p>
          <p className="text-[10px] text-muted-foreground">{period === "today" ? "bugun" : period === "week" ? "haftada" : period === "month" ? "oyda" : "jami"}</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2"><CardContent className="p-4">
          <h4 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Daromad vs Xarajat</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} so'm`} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incG)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent className="p-4">
          <h4 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><PieIcon className="w-4 h-4 text-primary" /> To'lov usullari</h4>
          {methodData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Ma'lumot yo'q</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {methodData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} so'm`} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent></Card>
      </div>

      {/* Expense breakdown */}
      {categoryData.length > 0 && (
        <Card><CardContent className="p-4">
          <h4 className="font-heading font-semibold text-sm mb-3">Xarajatlar tarkibi</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} so'm`} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      )}

      {/* Inline form */}
      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Turi</Label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? "service" : "rent" })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="income">📈 Daromad</option>
                <option value="expense">📉 Xarajat</option>
              </select>
            </div>
            <div>
              <Label>Kategoriya</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Summa *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>To'lov</Label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                {PAY_METHODS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
              </select>
            </div>
            {form.type === "income" && (
              <div className="col-span-2">
                <Label>Mijoz (ixtiyoriy)</Label>
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">— Yo'q —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
            )}
            <div className={form.type === "income" ? "col-span-2" : "col-span-4"}>
              <Label>Izoh</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {/* Tx list */}
      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading font-semibold text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> Tranzaksiyalar ({filtered.length})</h4>
          <div className="flex gap-1">
            {[{ v: "all", l: "Hammasi" }, { v: "income", l: "Daromad" }, { v: "expense", l: "Xarajat" }].map((f) => (
              <button key={f.v} onClick={() => setFilterType(f.v as any)} className={`px-2 py-1 text-[10px] rounded ${filterType === f.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f.l}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Tranzaksiyalar yo'q</div>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filtered.map((t) => {
              const pm = PAY_METHODS.find((p) => p.v === t.payment_method);
              const Icon = pm?.icon || Wallet;
              return (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.description || t.category}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.cosmetology_clients?.full_name && `👤 ${t.cosmetology_clients.full_name} · `}
                      {pm?.label || t.payment_method} · {new Date(t.created_at).toLocaleDateString("uz-UZ")} {new Date(t.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${t.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                      {t.type === "income" ? "+" : "−"}{Number(t.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">so'm</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {t.type === "income" && (
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => printReceipt(t)} title="Chek"><Download className="w-3 h-3" /></Button>
                    )}
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => remove(t.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent></Card>

      {/* Split Payment Dialog */}
      <Dialog open={showSplit} onOpenChange={setShowSplit}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Split to'lov (bir nechta usulda)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mijoz</Label>
              <select value={splitForm.client_id} onChange={(e) => setSplitForm({ ...splitForm, client_id: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">— Yo'q —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div><Label>Izoh</Label><Input value={splitForm.description} onChange={(e) => setSplitForm({ ...splitForm, description: e.target.value })} placeholder="Xizmat nomi" className="mt-1" /></div>
            <div><Label>Umumiy summa *</Label><Input type="number" value={splitForm.total} onChange={(e) => setSplitForm({ ...splitForm, total: e.target.value })} className="mt-1 font-bold text-lg" /></div>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "card", "click", "payme", "transfer"] as const).map((m) => {
                const pm = PAY_METHODS.find((p) => p.v === m)!;
                return (
                  <div key={m}>
                    <Label className="text-xs flex items-center gap-1"><pm.icon className="w-3 h-3" /> {pm.label}</Label>
                    <Input type="number" value={(splitForm as any)[m]} onChange={(e) => setSplitForm({ ...splitForm, [m]: e.target.value })} className="mt-1" placeholder="0" />
                  </div>
                );
              })}
            </div>
            {splitForm.total && (
              <div className="bg-muted/50 rounded-lg p-2 text-xs flex justify-between">
                <span>Yig'ildi:</span>
                <span className="font-bold">
                  {(Number(splitForm.cash || 0) + Number(splitForm.card || 0) + Number(splitForm.click || 0) + Number(splitForm.payme || 0) + Number(splitForm.transfer || 0)).toLocaleString()} / {Number(splitForm.total).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={saveSplit} disabled={saving} className="flex-1">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
              <Button variant="outline" onClick={() => setShowSplit(false)}>Bekor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CosFinance;
