import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, TrendingUp, TrendingDown, DollarSign, Search, Receipt, Wallet, CreditCard, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";

interface Props { clinicId: string; }

const HMSFinance = ({ clinicId }: Props) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clinicName, setClinicName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ transaction_type: "income", category: "service", amount: "", description: "", payment_method: "cash", transaction_date: new Date().toISOString().split("T")[0], notes: "" });
  const [invoiceForm, setInvoiceForm] = useState({ patient_name: "", items: [{ name: "", qty: 1, price: 0 }], payment_method: "cash", discount: 0 });

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

  const handleCreateInvoice = async () => {
    if (!invoiceForm.patient_name) { toast({ title: "Bemor ismi majburiy!", variant: "destructive" }); return; }
    const validItems = invoiceForm.items.filter(it => it.name && it.price > 0);
    const subtotal = validItems.reduce((s, it) => s + it.qty * it.price, 0);
    const total = subtotal - Number(invoiceForm.discount);
    // Save as income transaction
    await supabase.from("hms_finance").insert({
      clinic_id: clinicId, transaction_type: "income", category: "service",
      amount: total, description: `Invoice: ${invoiceForm.patient_name}`,
      payment_method: invoiceForm.payment_method, transaction_date: new Date().toISOString().split("T")[0],
      notes: JSON.stringify({ items: validItems, discount: invoiceForm.discount }),
    });
    toast({ title: "✅ Invoice yaratildi va daromadga qo'shildi" });
    setShowInvoiceForm(false);
    setInvoiceForm({ patient_name: "", items: [{ name: "", qty: 1, price: 0 }], payment_method: "cash", discount: 0 });
    fetchData();
  };

  const printInvoice = (patientName: string, items: any[], discount: number, total: number) => {
    const html = `<html><head><title>Invoice - ${clinicName}</title><style>body{font-family:Arial;padding:40px;max-width:600px;margin:auto}h1{color:#1a5f7a;border-bottom:2px solid #1a5f7a;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f0f8ff}.total{font-size:18px;font-weight:bold;color:#1a5f7a;text-align:right;margin-top:10px}</style></head><body>
    <h1>🏥 ${clinicName} — Chek / Invoice</h1>
    <p><b>Bemor:</b> ${patientName}</p><p><b>Sana:</b> ${new Date().toLocaleDateString("uz")}</p>
    <table><tr><th>Xizmat</th><th>Soni</th><th>Narxi</th><th>Jami</th></tr>
    ${items.map((it: any) => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${Number(it.price).toLocaleString()} so'm</td><td>${(it.qty * it.price).toLocaleString()} so'm</td></tr>`).join("")}
    </table>
    ${discount > 0 ? `<p>Chegirma: -${Number(discount).toLocaleString()} so'm</p>` : ""}
    <p class="total">Jami: ${total.toLocaleString()} so'm</p>
    <p style="margin-top:30px;font-size:12px;color:#666">Med1.uz — Tibbiy platforma</p>
    </body></html>`;
    const w = window.open("", "_blank"); w?.document.write(html); w?.document.close(); w?.print();
  };

  const totalIncome = transactions.filter(t => t.transaction_type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.transaction_type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayIncome = transactions.filter(t => t.transaction_type === "income" && t.transaction_date === todayStr).reduce((s, t) => s + Number(t.amount), 0);

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
  const chartData = Object.entries(monthlyData).sort().slice(-6).map(([month, d]) => ({ month: month.slice(5), ...d, profit: d.income - d.expense }));

  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount); });
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  // Payment method stats
  const paymentMethods: Record<string, number> = {};
  transactions.filter(t => t.transaction_type === "income").forEach(t => { paymentMethods[t.payment_method] = (paymentMethods[t.payment_method] || 0) + Number(t.amount); });
  const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({ name: name === "cash" ? "Naqd" : name === "card" ? "Karta" : name === "transfer" ? "O'tkazma" : "Onlayn", value }));

  const categories = [
    { value: "service", label: "Xizmat" }, { value: "medicine", label: "Dori" }, { value: "salary", label: "Maosh" },
    { value: "rent", label: "Ijara" }, { value: "equipment", label: "Jihozlar" }, { value: "utilities", label: "Kommunal" }, { value: "other", label: "Boshqa" }
  ];

  const reportData: HMSReportData = {
    title: "Moliyaviy hisobot", moduleType: "HMS Moliya", clinicName,
    kpiCards: [
      { label: "Jami daromad", value: `${totalIncome.toLocaleString()} so'm` },
      { label: "Jami xarajat", value: `${totalExpense.toLocaleString()} so'm` },
      { label: "Balans", value: `${balance.toLocaleString()} so'm` },
      { label: "Bugungi daromad", value: `${todayIncome.toLocaleString()} so'm` },
    ],
    sections: [{ heading: "Moliyaviy xulosa", content: `Daromad: ${totalIncome.toLocaleString()} so'm\nXarajat: ${totalExpense.toLocaleString()} so'm\nSof foyda: ${balance.toLocaleString()} so'm` }],
    tables: transactions.length > 0 ? [{
      title: "So'nggi tranzaksiyalar",
      table: {
        headers: ["Sana", "Turi", "Kategoriya", "Tavsif", "Summa"],
        rows: transactions.slice(0, 50).map(t => [t.transaction_date, t.transaction_type === "income" ? "Daromad" : "Xarajat", categories.find(c => c.value === t.category)?.label || t.category, t.description || "-", `${Number(t.amount).toLocaleString()} so'm`])
      }
    }] : undefined,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Moliyaviy hisobotlar</h2>
        <div className="flex gap-2">
          <HMSDownloadMenu data={reportData} />
          <Button size="sm" variant="outline" onClick={() => setShowInvoiceForm(true)}><Receipt className="w-4 h-4 mr-1" /> Invoice</Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Tranzaksiya</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { icon: TrendingUp, label: "Jami daromad", value: totalIncome, color: "text-green-600" },
          { icon: TrendingDown, label: "Jami xarajat", value: totalExpense, color: "text-red-600" },
          { icon: DollarSign, label: "Sof foyda", value: balance, color: balance >= 0 ? "text-green-600" : "text-red-600" },
          { icon: Wallet, label: "Bugungi daromad", value: todayIncome, color: "text-blue-600" },
          { icon: FileText, label: "Tranzaksiyalar", value: transactions.length, color: "text-foreground", raw: true },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.raw ? s.value : `${(s.value as number).toLocaleString()} so'm`}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
          <TabsTrigger value="invoices">Invoicelar</TabsTrigger>
          <TabsTrigger value="analytics">Analitika</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          {/* Filter & Search */}
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

          {/* Transaction Form */}
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

          {/* Transactions List */}
          <div className="space-y-2">
            {filtered.map(t => (
              <div key={t.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.transaction_type === "income" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                    {t.transaction_type === "income" ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.description || t.category}</p>
                    <p className="text-xs text-muted-foreground">{t.transaction_date} • {t.payment_method === "cash" ? "Naqd" : t.payment_method === "card" ? "Karta" : t.payment_method} • {categories.find(c => c.value === t.category)?.label || t.category}</p>
                  </div>
                </div>
                <p className={cn("font-bold text-sm", t.transaction_type === "income" ? "text-green-600" : "text-red-600")}>
                  {t.transaction_type === "income" ? "+" : "-"}{Number(t.amount).toLocaleString()} so'm
                </p>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Tranzaksiyalar yo'q</p>}
          </div>
        </TabsContent>

        {/* Invoice Tab */}
        <TabsContent value="invoices">
          {showInvoiceForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">Yangi Invoice / Chek</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowInvoiceForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <Input placeholder="Bemor ismi *" value={invoiceForm.patient_name} onChange={e => setInvoiceForm({ ...invoiceForm, patient_name: e.target.value })} className="mb-3" />
              <h4 className="text-sm font-semibold text-foreground mb-2">Xizmatlar:</h4>
              {invoiceForm.items.map((it, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                  <Input placeholder="Xizmat nomi" value={it.name} onChange={e => { const items = [...invoiceForm.items]; items[i].name = e.target.value; setInvoiceForm({ ...invoiceForm, items }); }} className="col-span-2" />
                  <Input type="number" placeholder="Soni" value={it.qty || ""} onChange={e => { const items = [...invoiceForm.items]; items[i].qty = Number(e.target.value); setInvoiceForm({ ...invoiceForm, items }); }} />
                  <Input type="number" placeholder="Narxi" value={it.price || ""} onChange={e => { const items = [...invoiceForm.items]; items[i].price = Number(e.target.value); setInvoiceForm({ ...invoiceForm, items }); }} />
                </div>
              ))}
              <Button variant="outline" size="sm" className="mb-3" onClick={() => setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, { name: "", qty: 1, price: 0 }] })}><Plus className="w-3 h-3 mr-1" /> Qo'shish</Button>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={invoiceForm.payment_method} onChange={e => setInvoiceForm({ ...invoiceForm, payment_method: e.target.value })}>
                  <option value="cash">Naqd</option><option value="card">Karta</option><option value="transfer">O'tkazma</option>
                </select>
                <Input type="number" placeholder="Chegirma (so'm)" value={invoiceForm.discount || ""} onChange={e => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })} />
              </div>
              {(() => {
                const validItems = invoiceForm.items.filter(it => it.name && it.price > 0);
                const subtotal = validItems.reduce((s, it) => s + it.qty * it.price, 0);
                const total = subtotal - Number(invoiceForm.discount);
                return (
                  <div className="bg-muted rounded-xl p-3 mb-3">
                    <p className="text-sm text-muted-foreground">Jami: <span className="font-bold text-foreground text-lg">{total.toLocaleString()} so'm</span></p>
                  </div>
                );
              })()}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateInvoice}>Saqlash</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const validItems = invoiceForm.items.filter(it => it.name && it.price > 0);
                  const subtotal = validItems.reduce((s, it) => s + it.qty * it.price, 0);
                  const total = subtotal - Number(invoiceForm.discount);
                  printInvoice(invoiceForm.patient_name, validItems, invoiceForm.discount, total);
                }}><Printer className="w-4 h-4 mr-1" /> Chop etish</Button>
              </div>
            </div>
          )}
          {!showInvoiceForm && (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">Invoice yaratish uchun yuqoridagi "Invoice" tugmasini bosing</p>
              <Button size="sm" onClick={() => setShowInvoiceForm(true)}><Plus className="w-4 h-4 mr-1" /> Yangi Invoice</Button>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Oylik daromad vs xarajat</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                    <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} name="Daromad" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Xarajat" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Sof foyda trendi</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                    <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Foyda" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Kategoriya bo'yicha</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">To'lov usullari</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSFinance;
