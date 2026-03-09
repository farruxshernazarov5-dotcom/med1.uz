import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, TrendingUp, TrendingDown, DollarSign, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";

interface Props { clinicId: string; }

const HMSFinance = ({ clinicId }: Props) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clinicName, setClinicName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ transaction_type: "income", category: "service", amount: "", description: "", payment_method: "cash", transaction_date: new Date().toISOString().split("T")[0], notes: "" });

  const fetchData = async () => {
    const [txRes, clinicRes] = await Promise.all([
      supabase.from("hms_finance").select("*").eq("clinic_id", clinicId).order("transaction_date", { ascending: false }).limit(500),
      supabase.from("registered_clinics").select("name").eq("id", clinicId).single(),
    ]);
    setTransactions(txRes.data || []);
    setClinicName(clinicRes.data?.name || "");
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ transaction_type: "income", category: "service", amount: "", description: "", payment_method: "cash", transaction_date: new Date().toISOString().split("T")[0], notes: "" }); setShowForm(false); };

  const handleCreate = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast({ title: "Summa majburiy!", variant: "destructive" }); return; }
    await supabase.from("hms_finance").insert({ ...form, amount: Number(form.amount), clinic_id: clinicId });
    toast({ title: "✅ Tranzaksiya qo'shildi" }); resetForm(); fetchData();
  };

  const totalIncome = transactions.filter(t => t.transaction_type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.transaction_type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const filtered = transactions.filter(t => {
    const matchFilter = filter === "all" || t.transaction_type === filter;
    const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const monthlyData: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const month = t.transaction_date?.slice(0, 7) || "";
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
    if (t.transaction_type === "income") monthlyData[month].income += Number(t.amount);
    else monthlyData[month].expense += Number(t.amount);
  });
  const chartData = Object.entries(monthlyData).sort().slice(-6).map(([month, d]) => ({ month: month.slice(5), ...d }));

  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount); });
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const categories = [
    { value: "service", label: "Xizmat" }, { value: "medicine", label: "Dori" }, { value: "salary", label: "Maosh" },
    { value: "rent", label: "Ijara" }, { value: "equipment", label: "Jihozlar" }, { value: "utilities", label: "Kommunal" }, { value: "other", label: "Boshqa" }
  ];

  // Report data for download
  const reportData: HMSReportData = {
    title: "Moliyaviy hisobot",
    moduleType: "HMS Moliya",
    clinicName,
    kpiCards: [
      { label: "Jami daromad", value: `${totalIncome.toLocaleString()} so'm` },
      { label: "Jami xarajat", value: `${totalExpense.toLocaleString()} so'm` },
      { label: "Balans", value: `${balance.toLocaleString()} so'm` },
      { label: "Tranzaksiyalar", value: String(transactions.length) },
    ],
    sections: [
      { heading: "Moliyaviy xulosa", content: `Daromad: ${totalIncome.toLocaleString()} so'm\nXarajat: ${totalExpense.toLocaleString()} so'm\nSof foyda: ${balance.toLocaleString()} so'm` },
    ],
    tables: transactions.length > 0 ? [{
      title: "So'nggi tranzaksiyalar",
      table: {
        headers: ["Sana", "Turi", "Kategoriya", "Tavsif", "Summa"],
        rows: transactions.slice(0, 50).map(t => [
          t.transaction_date,
          t.transaction_type === "income" ? "Daromad" : "Xarajat",
          categories.find(c => c.value === t.category)?.label || t.category,
          t.description || "-",
          `${Number(t.amount).toLocaleString()} so'm`
        ])
      }
    }] : undefined,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Moliyaviy hisobotlar</h2>
        <div className="flex gap-2">
          <HMSDownloadMenu data={reportData} />
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi tranzaksiya</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: TrendingUp, label: "Daromad", value: totalIncome, color: "text-green-600" },
          { icon: TrendingDown, label: "Xarajat", value: totalExpense, color: "text-red-600" },
          { icon: DollarSign, label: "Balans", value: balance, color: balance >= 0 ? "text-green-600" : "text-red-600" },
          { icon: DollarSign, label: "Tranzaksiyalar", value: transactions.length, color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{typeof s.value === "number" && s.label !== "Tranzaksiyalar" ? `${s.value.toLocaleString()} so'm` : s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Oylik daromad/xarajat</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} /><Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Kategoriya bo'yicha</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[{ id: "all", label: "Barchasi" }, { id: "income", label: "Daromad" }, { id: "expense", label: "Xarajat" }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Yangi tranzaksiya</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })}>
              <option value="income">Daromad</option>
              <option value="expense">Xarajat</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <Input type="number" placeholder="Summa *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <Input placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option value="cash">Naqd</option>
              <option value="card">Karta</option>
              <option value="transfer">O'tkazma</option>
              <option value="online">Onlayn</option>
            </select>
            <Input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleCreate}>Qo'shish</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(t => (
          <div key={t.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.transaction_type === "income" ? "bg-green-100" : "bg-red-100")}>
                {t.transaction_type === "income" ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.description || t.category}</p>
                <p className="text-xs text-muted-foreground">{t.transaction_date} • {t.payment_method} • {t.category}</p>
              </div>
            </div>
            <p className={cn("font-bold text-sm", t.transaction_type === "income" ? "text-green-600" : "text-red-600")}>
              {t.transaction_type === "income" ? "+" : "-"}{Number(t.amount).toLocaleString()} so'm
            </p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Tranzaksiyalar yo'q</p>}
      </div>
    </div>
  );
};

export default HMSFinance;
