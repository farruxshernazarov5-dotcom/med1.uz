import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Trash2,
  CheckCircle2, Clock, FileDown, Receipt, Package, Banknote, Edit2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

interface Txn {
  id: string;
  center_id: string;
  patient_id: string | null;
  order_id: string | null;
  invoice_number: string | null;
  amount: number;
  status: string | null;
  payment_method: string | null;
  notes: string | null;
  description?: string | null;
  transaction_type?: string | null;
  paid_at?: string | null;
  created_at: string;
}
interface Expense {
  id: string;
  center_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string | null;
  vendor: string | null;
  notes: string | null;
  created_at: string;
}
interface Patient { id: string; full_name: string; phone?: string }
interface LabOrder { id: string; order_number: string | null; patient_id?: string | null; test_name?: string | null }

interface Props {
  centerId: string;
  transactions: Txn[];
  patients?: Patient[];
  orders?: LabOrder[];
  onReload: () => void;
}

const COLORS = ["hsl(214, 84%, 56%)", "hsl(145, 63%, 42%)", "hsl(32, 87%, 52%)", "hsl(0, 72%, 55%)", "hsl(250, 100%, 69%)", "hsl(180, 60%, 50%)"];

const EXPENSE_CATEGORIES = [
  { v: "reagent", l: "Reagentlar" },
  { v: "salary", l: "Oyliklar" },
  { v: "rent", l: "Ijara" },
  { v: "utilities", l: "Kommunal" },
  { v: "equipment", l: "Asbob-uskunalar" },
  { v: "marketing", l: "Marketing" },
  { v: "tax", l: "Soliq" },
  { v: "other", l: "Boshqa" },
];

const PAYMENT_METHODS = [
  { v: "cash", l: "Naqd" },
  { v: "card", l: "Karta" },
  { v: "transfer", l: "O'tkazma" },
  { v: "click", l: "Click" },
  { v: "payme", l: "Payme" },
];

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n)) + " so'm";

const DiagFinance = ({ centerId, transactions, patients = [], orders = [], onReload }: Props) => {
  const [tab, setTab] = useState<"overview" | "income" | "expenses">("overview");
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("month");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showInvForm, setShowInvForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingExp, setEditingExp] = useState<Expense | null>(null);

  const [invForm, setInvForm] = useState({
    patient_id: "", order_id: "", amount: "",
    payment_method: "cash", description: "", status: "unpaid",
  });
  const [expForm, setExpForm] = useState({
    category: "reagent", description: "", amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    payment_method: "cash", vendor: "", notes: "",
  });

  const loadExpenses = async () => {
    const { data } = await supabase.from("diagnostics_expenses" as any)
      .select("*").eq("center_id", centerId).order("expense_date", { ascending: false }).limit(300) as any;
    setExpenses(data || []);
  };
  useEffect(() => { loadExpenses(); }, [centerId]);

  const patientMap = useMemo(() => {
    const m: Record<string, Patient> = {};
    patients.forEach(p => (m[p.id] = p));
    return m;
  }, [patients]);
  const orderMap = useMemo(() => {
    const m: Record<string, LabOrder> = {};
    orders.forEach(o => (m[o.id] = o));
    return m;
  }, [orders]);

  // PERIOD FILTER
  const periodStart = useMemo(() => {
    const d = new Date();
    if (period === "today") { d.setHours(0, 0, 0, 0); return d; }
    if (period === "week") { d.setDate(d.getDate() - 7); return d; }
    if (period === "month") { d.setMonth(d.getMonth() - 1); return d; }
    d.setFullYear(d.getFullYear() - 1); return d;
  }, [period]);

  const periodTxns = useMemo(
    () => transactions.filter(t => new Date(t.created_at) >= periodStart),
    [transactions, periodStart]
  );
  const periodExps = useMemo(
    () => expenses.filter(e => new Date(e.expense_date) >= periodStart),
    [expenses, periodStart]
  );

  const paidTxns = periodTxns.filter(t => t.status === "paid");
  const totalIncome = paidTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpenses = periodExps.reduce((s, e) => s + Number(e.amount || 0), 0);
  const profit = totalIncome - totalExpenses;
  const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;
  const unpaidCount = periodTxns.filter(t => t.status === "unpaid" || t.status === "pending").length;
  const unpaidAmount = periodTxns.filter(t => t.status === "unpaid" || t.status === "pending")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // Trend chart (last 30 days)
  const trendData = useMemo(() => {
    const days = 30;
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const inc = transactions
        .filter(t => t.status === "paid" && new Date(t.created_at) >= d && new Date(t.created_at) < next)
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = expenses
        .filter(e => {
          const ed = new Date(e.expense_date);
          return ed >= d && ed < next;
        })
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      arr.push({
        name: d.toLocaleDateString("uz", { day: "numeric", month: "short" }),
        Daromad: inc, Xarajat: exp,
      });
    }
    return arr;
  }, [transactions, expenses]);

  // Expense category pie
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    periodExps.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount || 0); });
    return Object.entries(map).map(([k, v]) => ({
      name: EXPENSE_CATEGORIES.find(c => c.v === k)?.l || k, value: v,
    })).sort((a, b) => b.value - a.value);
  }, [periodExps]);

  // Payment method bar
  const incomeByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    paidTxns.forEach(t => {
      const k = t.payment_method || "other";
      map[k] = (map[k] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map).map(([k, v]) => ({
      name: PAYMENT_METHODS.find(m => m.v === k)?.l || k, value: v,
    }));
  }, [paidTxns]);

  // INVOICE save
  const saveInvoice = async () => {
    const amount = parseFloat(invForm.amount);
    if (!amount || amount <= 0) { toast({ title: "Summa kiriting", variant: "destructive" }); return; }
    const { error } = await supabase.from("diagnostics_transactions" as any).insert({
      center_id: centerId,
      patient_id: invForm.patient_id || null,
      order_id: invForm.order_id || null,
      amount,
      status: invForm.status,
      payment_method: invForm.payment_method,
      description: invForm.description.trim() || null,
      transaction_type: "income",
      paid_at: invForm.status === "paid" ? new Date().toISOString() : null,
    });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Hisob-faktura yaratildi" });
    setInvForm({ patient_id: "", order_id: "", amount: "", payment_method: "cash", description: "", status: "unpaid" });
    setShowInvForm(false);
    onReload();
  };

  const markPaid = async (id: string) => {
    await supabase.from("diagnostics_transactions" as any).update({
      status: "paid", paid_at: new Date().toISOString(),
    }).eq("id", id);
    toast({ title: "💰 To'landi deb belgilandi" });
    onReload();
  };

  const deleteTxn = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("diagnostics_transactions" as any).delete().eq("id", id);
    onReload();
  };

  // EXPENSE save
  const resetExp = () => {
    setExpForm({
      category: "reagent", description: "", amount: "",
      expense_date: new Date().toISOString().slice(0, 10),
      payment_method: "cash", vendor: "", notes: "",
    });
    setEditingExp(null); setShowExpForm(false);
  };
  const saveExpense = async () => {
    const amount = parseFloat(expForm.amount);
    if (!expForm.description.trim() || !amount || amount <= 0) {
      toast({ title: "Tavsif va summa majburiy", variant: "destructive" }); return;
    }
    const payload: any = {
      center_id: centerId,
      category: expForm.category,
      description: expForm.description.trim(),
      amount,
      expense_date: expForm.expense_date,
      payment_method: expForm.payment_method,
      vendor: expForm.vendor.trim() || null,
      notes: expForm.notes.trim() || null,
    };
    let err;
    if (editingExp) {
      ({ error: err } = await supabase.from("diagnostics_expenses" as any).update(payload).eq("id", editingExp.id));
    } else {
      ({ error: err } = await supabase.from("diagnostics_expenses" as any).insert(payload));
    }
    if (err) { toast({ title: "Xatolik", description: err.message, variant: "destructive" }); return; }
    toast({ title: editingExp ? "✅ Yangilandi" : "✅ Xarajat saqlandi" });
    resetExp(); loadExpenses();
  };
  const startEditExp = (e: Expense) => {
    setEditingExp(e);
    setExpForm({
      category: e.category, description: e.description, amount: String(e.amount),
      expense_date: e.expense_date, payment_method: e.payment_method || "cash",
      vendor: e.vendor || "", notes: e.notes || "",
    });
    setShowExpForm(true);
  };
  const deleteExp = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("diagnostics_expenses" as any).delete().eq("id", id);
    loadExpenses();
  };

  // CSV export
  const exportCSV = () => {
    const rows = [["Sana", "Tur", "Tavsif", "Summa", "To'lov usuli", "Status"]];
    paidTxns.forEach(t => {
      rows.push([
        new Date(t.created_at).toLocaleDateString("uz"),
        "Daromad",
        t.description || t.invoice_number || "—",
        String(t.amount),
        t.payment_method || "—",
        t.status || "—",
      ]);
    });
    periodExps.forEach(e => {
      rows.push([
        e.expense_date,
        "Xarajat — " + (EXPENSE_CATEGORIES.find(c => c.v === e.category)?.l || e.category),
        e.description,
        String(e.amount),
        e.payment_method || "—",
        "paid",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `diagnostika-moliya-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "📥 CSV yuklab olindi" });
  };

  const statusBadge = (s?: string | null) => {
    if (s === "paid") return <Badge className="bg-green-500 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />To'langan</Badge>;
    if (s === "unpaid" || s === "pending") return <Badge className="bg-yellow-500 text-[10px]"><Clock className="w-3 h-3 mr-1" />Kutilmoqda</Badge>;
    if (s === "refunded") return <Badge variant="destructive" className="text-[10px]">Qaytarilgan</Badge>;
    return <Badge variant="outline" className="text-[10px]">{s || "—"}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">Moliya — Daromad va xarajatlar</h2>
            <p className="text-xs text-muted-foreground">Hisob-fakturalar, P&L, kategoriya analitikasi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs">
            <option value="today">Bugun</option>
            <option value="week">7 kun</option>
            <option value="month">30 kun</option>
            <option value="year">Yil</option>
          </select>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <FileDown className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: TrendingUp, label: "Daromad", value: fmt(totalIncome), color: "from-green-500 to-green-600" },
          { icon: TrendingDown, label: "Xarajat", value: fmt(totalExpenses), color: "from-red-500 to-red-600" },
          { icon: Wallet, label: "Sof foyda", value: fmt(profit), color: profit >= 0 ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600" },
          { icon: Receipt, label: "Marja", value: `${margin}%`, color: "from-blue-500 to-blue-600" },
          { icon: Clock, label: "Qarzdor", value: fmt(unpaidAmount), color: "from-amber-500 to-amber-600", sub: `${unpaidCount} ta hisob` },
        ].map(k => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${k.color} p-4 text-white shadow-lg`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-4 translate-x-4" />
            <k.icon className="w-5 h-5 text-white/80 mb-1" />
            <p className="text-lg font-bold leading-tight">{k.value}</p>
            <p className="text-xs text-white/70">{k.label}</p>
            {k.sub && <p className="text-[10px] text-white/60 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview" as const, label: "Bosh ko'rinish" },
          { id: "income" as const, label: "Daromad / Hisoblar" },
          { id: "expenses" as const, label: "Xarajatlar" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap",
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Trend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Daromad / Xarajat trendi (30 kun)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(145, 63%, 42%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(145, 63%, 42%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="Daromad" stroke="hsl(145, 63%, 42%)" fill="url(#gradInc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Xarajat" stroke="hsl(0, 72%, 55%)" fill="url(#gradExp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense pie */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Xarajat kategoriyasi</CardTitle></CardHeader>
              <CardContent>
                {expensesByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Ma'lumot yo'q</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                          paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {expensesByCategory.map((d, i) => (
                        <span key={d.name} className="flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          {d.name}: {fmt(d.value)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment method bar */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">To'lov usullari (daromad)</CardTitle></CardHeader>
              <CardContent>
                {incomeByMethod.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Ma'lumot yo'q</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={incomeByMethod}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                      <Tooltip formatter={(v: any) => fmt(v)} />
                      <Bar dataKey="value" name="Summa" fill="hsl(214, 84%, 56%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* INCOME / INVOICES */}
      {tab === "income" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{periodTxns.length} ta hisob-faktura</p>
            <Button size="sm" onClick={() => setShowInvForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Hisob qo'shish
            </Button>
          </div>

          {showInvForm && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base">Yangi hisob-faktura</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowInvForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Bemor</Label>
                    <select value={invForm.patient_id} onChange={e => setInvForm({ ...invForm, patient_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                      <option value="">Tanlang...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Buyurtma</Label>
                    <select value={invForm.order_id} onChange={e => setInvForm({ ...invForm, order_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                      <option value="">—</option>
                      {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} • {o.test_name || ""}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Summa (so'm) *</Label>
                    <Input type="number" value={invForm.amount} onChange={e => setInvForm({ ...invForm, amount: e.target.value })} />
                  </div>
                  <div>
                    <Label>To'lov usuli</Label>
                    <select value={invForm.payment_method} onChange={e => setInvForm({ ...invForm, payment_method: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                      {PAYMENT_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select value={invForm.status} onChange={e => setInvForm({ ...invForm, status: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                      <option value="unpaid">To'lanmagan</option>
                      <option value="paid">To'langan</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Tavsif</Label>
                    <Input value={invForm.description} onChange={e => setInvForm({ ...invForm, description: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveInvoice}>Saqlash</Button>
                  <Button variant="outline" onClick={() => setShowInvForm(false)}>Bekor</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {periodTxns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Hisoblar yo'q</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>№</TableHead>
                        <TableHead>Bemor</TableHead>
                        <TableHead>Tavsif</TableHead>
                        <TableHead>Usul</TableHead>
                        <TableHead>Summa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodTxns.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">{new Date(t.created_at).toLocaleDateString("uz")}</TableCell>
                          <TableCell className="text-xs font-mono">{t.invoice_number || t.id.slice(0, 6)}</TableCell>
                          <TableCell className="text-xs">{patientMap[t.patient_id || ""]?.full_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {t.description || (t.order_id ? orderMap[t.order_id]?.test_name : "") || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {PAYMENT_METHODS.find(m => m.v === t.payment_method)?.l || t.payment_method || "—"}
                          </TableCell>
                          <TableCell className="text-xs font-bold">{fmt(t.amount)}</TableCell>
                          <TableCell>{statusBadge(t.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {t.status !== "paid" && (
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markPaid(t.id)} title="To'landi">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTxn(t.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* EXPENSES */}
      {tab === "expenses" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{periodExps.length} ta xarajat</p>
            <Button size="sm" onClick={() => { resetExp(); setShowExpForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Xarajat qo'shish
            </Button>
          </div>

          {showExpForm && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base">{editingExp ? "Xarajatni tahrirlash" : "Yangi xarajat"}</CardTitle>
                <Button variant="ghost" size="icon" onClick={resetExp}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Sana</Label>
                    <Input type="date" value={expForm.expense_date}
                      onChange={e => setExpForm({ ...expForm, expense_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Kategoriya</Label>
                    <select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                      {EXPENSE_CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Summa *</Label>
                    <Input type="number" value={expForm.amount}
                      onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Tavsif *</Label>
                    <Input value={expForm.description}
                      onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>To'lov usuli</Label>
                    <select value={expForm.payment_method}
                      onChange={e => setExpForm({ ...expForm, payment_method: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                      {PAYMENT_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Yetkazib beruvchi</Label>
                    <Input value={expForm.vendor}
                      onChange={e => setExpForm({ ...expForm, vendor: e.target.value })} />
                  </div>
                  <div>
                    <Label>Izoh</Label>
                    <Textarea rows={1} value={expForm.notes}
                      onChange={e => setExpForm({ ...expForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveExpense}>{editingExp ? "Yangilash" : "Saqlash"}</Button>
                  <Button variant="outline" onClick={resetExp}>Bekor</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {periodExps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Xarajatlar yo'q</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Kategoriya</TableHead>
                        <TableHead>Tavsif</TableHead>
                        <TableHead>Yetkazuvchi</TableHead>
                        <TableHead>Usul</TableHead>
                        <TableHead>Summa</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodExps.map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs">{new Date(e.expense_date).toLocaleDateString("uz")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              <Package className="w-3 h-3 mr-1" />
                              {EXPENSE_CATEGORIES.find(c => c.v === e.category)?.l || e.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{e.description}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{e.vendor || "—"}</TableCell>
                          <TableCell className="text-xs">
                            <Banknote className="w-3 h-3 inline mr-1" />
                            {PAYMENT_METHODS.find(m => m.v === e.payment_method)?.l || e.payment_method || "—"}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-red-600">−{fmt(e.amount)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditExp(e)}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteExp(e.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DiagFinance;
