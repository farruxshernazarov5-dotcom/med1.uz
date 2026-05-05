import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, TrendingUp, Users, Calendar, Download, DollarSign, Stethoscope, AlertTriangle, CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { downloadHMSReceipt } from "@/utils/downloadHMSReceipt";

interface DentalReportsProps {
  patients: any[];
  appointments: any[];
  treatments: any[];
  services: any[];
  clinicId?: string;
  clinicName?: string;
}

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const PAY_COLORS: Record<string, string> = { cash: "#10b981", card: "#3b82f6", click: "#8b5cf6", payme: "#06b6d4", insurance: "#f59e0b" };
const PAY_LABELS: Record<string, string> = { cash: "Naqd", card: "Karta", click: "Click", payme: "Payme", insurance: "Sug'urta" };

type ReportTab = "financial" | "payments" | "debts" | "services" | "patients";

const DentalReports = ({ patients, appointments, treatments, services, clinicId, clinicName }: DentalReportsProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<ReportTab>("financial");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [planPayments, setPlanPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) { setLoading(false); return; }
    const fetch = async () => {
      const [t, e, pp] = await Promise.all([
        supabase.from("dental_transactions").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
        supabase.from("dental_expenses").select("*").eq("clinic_id", clinicId).order("expense_date", { ascending: false }),
        supabase.from("dental_plan_payments").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      ]);
      setTransactions(t.data || []);
      setExpenses(e.data || []);
      setPlanPayments(pp.data || []);
      setLoading(false);
    };
    fetch();

    // realtime subscription
    if (!user) return;
    const channel = supabase.channel(`user:${user.id}:dental-reports:${clinicId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "dental_transactions", filter: `clinic_id=eq.${clinicId}` }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "dental_expenses", filter: `clinic_id=eq.${clinicId}` }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "dental_plan_payments", filter: `clinic_id=eq.${clinicId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  const inRange = (d: string | null) => {
    if (!d) return true;
    const ds = d.slice(0, 10);
    if (dateFrom && ds < dateFrom) return false;
    if (dateTo && ds > dateTo) return false;
    return true;
  };

  const filteredTx = useMemo(() => transactions.filter(t => inRange(t.created_at)), [transactions, dateFrom, dateTo]);
  const filteredExp = useMemo(() => expenses.filter(e => inRange(e.expense_date || e.created_at)), [expenses, dateFrom, dateTo]);

  const totalRevenue = filteredTx.reduce((a, t) => a + Number(t.paid_amount || 0), 0);
  const totalBilled = filteredTx.reduce((a, t) => a + Number(t.total_amount || 0), 0);
  const totalDebt = totalBilled - totalRevenue;
  const totalExpense = filteredExp.reduce((a, e) => a + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpense;

  // monthly revenue/expense
  const monthlyData = useMemo(() => {
    const map: Record<string, { revenue: number; expense: number }> = {};
    filteredTx.forEach(t => { const m = (t.created_at || "").slice(0, 7); if (m) { if (!map[m]) map[m] = { revenue: 0, expense: 0 }; map[m].revenue += Number(t.paid_amount || 0); } });
    filteredExp.forEach(e => { const m = (e.expense_date || e.created_at || "").slice(0, 7); if (m) { if (!map[m]) map[m] = { revenue: 0, expense: 0 }; map[m].expense += Number(e.amount || 0); } });
    return Object.entries(map).sort().slice(-12).map(([m, v]) => ({ month: m.slice(5), ...v, profit: v.revenue - v.expense }));
  }, [filteredTx, filteredExp]);

  // payment method breakdown
  const payMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx.forEach(t => { const m = t.payment_method || "cash"; map[m] = (map[m] || 0) + Number(t.paid_amount || 0); });
    return Object.entries(map).map(([name, value]) => ({ name: PAY_LABELS[name] || name, value, key: name }));
  }, [filteredTx]);

  // debtors
  const debtors = useMemo(() => {
    return filteredTx.filter(t => Number(t.total_amount || 0) > Number(t.paid_amount || 0)).map(t => ({
      ...t,
      patientName: patients.find(p => p.id === t.patient_id)?.full_name || "Noma'lum",
      debt: Number(t.total_amount || 0) - Number(t.paid_amount || 0),
    })).sort((a, b) => b.debt - a.debt);
  }, [filteredTx, patients]);

  // service distribution
  const serviceData = useMemo(() => {
    const map: Record<string, number> = {};
    treatments.filter(t => inRange(t.created_at)).forEach(t => { map[t.treatment_type] = (map[t.treatment_type] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [treatments, dateFrom, dateTo]);

  // patient growth
  const patientData = useMemo(() => {
    const map: Record<string, number> = {};
    patients.filter(p => inRange(p.created_at)).forEach(p => { const m = (p.created_at || "").slice(0, 7); if (m) map[m] = (map[m] || 0) + 1; });
    return Object.entries(map).sort().slice(-12).map(([month, count]) => ({ month: month.slice(5), count }));
  }, [patients, dateFrom, dateTo]);

  // expense categories
  const expCatData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExp.forEach(e => { map[e.category || "Boshqa"] = (map[e.category || "Boshqa"] || 0) + Number(e.amount || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filteredExp]);

  const handleExportCSV = () => {
    let csv = "";
    if (tab === "financial") {
      csv = "Oy,Daromad,Xarajat,Foyda\n" + monthlyData.map(d => `${d.month},${d.revenue},${d.expense},${d.profit}`).join("\n");
    } else if (tab === "payments") {
      csv = "To'lov usuli,Summa\n" + payMethodData.map(d => `${d.name},${d.value}`).join("\n");
    } else if (tab === "debts") {
      csv = "Bemor,Invoice,Jami,To'langan,Qarz\n" + debtors.map(d => `${d.patientName},${d.invoice_number || ""},${d.total_amount},${d.paid_amount},${d.debt}`).join("\n");
    } else if (tab === "services") {
      csv = "Xizmat,Soni\n" + serviceData.map(d => `${d.name},${d.value}`).join("\n");
    } else {
      csv = "Oy,Yangi bemorlar\n" + patientData.map(d => `${d.month},${d.count}`).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `dental-report-${tab}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const items = tab === "financial"
      ? monthlyData.map(d => ({ name: `${d.month}`, qty: 1, price: d.revenue }))
      : tab === "debts"
        ? debtors.slice(0, 20).map(d => ({ name: d.patientName, qty: 1, price: d.debt }))
        : payMethodData.map(d => ({ name: d.name, qty: 1, price: d.value }));
    downloadHMSReceipt({
      clinicName: clinicName || "Stomatologiya",
      patientName: "Hisobot",
      invoiceNumber: `REP-${new Date().toISOString().slice(0, 10)}`,
      date: new Date().toLocaleDateString("uz-UZ"),
      items,
      notes: `Hisobot turi: ${tab}. ${dateFrom ? `Dan: ${dateFrom}` : ""} ${dateTo ? `Gacha: ${dateTo}` : ""}`,
    });
  };

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: "financial", label: "Moliyaviy", icon: DollarSign },
    { id: "payments", label: "To'lovlar", icon: CreditCard },
    { id: "debts", label: "Qarzdorlar", icon: AlertTriangle },
    { id: "services", label: "Xizmatlar", icon: Stethoscope },
    { id: "patients", label: "Bemorlar", icon: Users },
  ];

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Hisobotlar
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="w-4 h-4 mr-1" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="w-4 h-4 mr-1" /> PDF</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Daromad", value: `${totalRevenue.toLocaleString()} so'm`, icon: TrendingUp, color: "text-primary" },
          { label: "Xarajat", value: `${totalExpense.toLocaleString()} so'm`, icon: Banknote, color: "text-orange-600" },
          { label: "Sof foyda", value: `${netProfit.toLocaleString()} so'm`, icon: DollarSign, color: netProfit >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Qarzdorlik", value: `${totalDebt.toLocaleString()} so'm`, icon: AlertTriangle, color: "text-red-600" },
          { label: "Bemorlar", value: patients.length, icon: Users, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Date filter + tabs */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <Input type="date" className="w-[140px]" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-muted-foreground">—</span>
          <Input type="date" className="w-[140px]" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Tozalash</Button>}
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 ml-auto flex-wrap">
          {tabs.map(t => (
            <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} onClick={() => setTab(t.id)} className="text-xs">
              <t.icon className="w-3 h-3 mr-1" /> {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Financial */}
      {tab === "financial" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Oylik daromad vs xarajat</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v: number) => `${v.toLocaleString()} so'm`} />
                  <Bar dataKey="revenue" name="Daromad" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Xarajat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Sof foyda trendi</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v: number) => `${v.toLocaleString()} so'm`} />
                  <Area type="monotone" dataKey="profit" name="Foyda" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
          </div>
          {expCatData.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-heading font-bold text-foreground mb-4">Xarajat kategoriyalari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={expCatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {expCatData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v: number) => `${v.toLocaleString()} so'm`} /></PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {expCatData.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-foreground">{c.name}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{c.value.toLocaleString()} so'm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payments */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">To'lov usullari</h3>
            {payMethodData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={payMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {payMethodData.map((d) => <Cell key={d.key} fill={PAY_COLORS[d.key] || "#94a3b8"} />)}
                  </Pie><Tooltip formatter={(v: number) => `${v.toLocaleString()} so'm`} /></PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {payMethodData.map(d => (
                    <div key={d.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PAY_COLORS[d.key] || "#94a3b8" }} />
                        <span className="text-sm font-medium text-foreground">{d.name}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{d.value.toLocaleString()} so'm</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                    <span className="text-sm font-bold text-primary">Jami</span>
                    <span className="text-sm font-bold text-primary">{totalRevenue.toLocaleString()} so'm</span>
                  </div>
                </div>
              </div>
            ) : <p className="text-muted-foreground text-center py-8">To'lovlar yo'q</p>}
          </div>
          {/* recent transactions */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">So'nggi tranzaksiyalar</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredTx.slice(0, 20).map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{patients.find(p => p.id === t.patient_id)?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{t.invoice_number} • {new Date(t.created_at).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{Number(t.paid_amount || 0).toLocaleString()} so'm</p>
                    <Badge variant="outline" className="text-[10px]">{PAY_LABELS[t.payment_method] || t.payment_method}</Badge>
                  </div>
                </div>
              ))}
              {filteredTx.length === 0 && <p className="text-muted-foreground text-center py-4">Tranzaksiyalar yo'q</p>}
            </div>
          </div>
        </div>
      )}

      {/* Debts */}
      {tab === "debts" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Qarzdorlar ro'yxati
            <Badge variant="destructive" className="ml-auto">{debtors.length} ta</Badge>
          </h3>
          {debtors.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {debtors.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.patientName}</p>
                    <p className="text-xs text-muted-foreground">{d.invoice_number} • {new Date(d.created_at).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{d.debt.toLocaleString()} so'm qarz</p>
                    <p className="text-xs text-muted-foreground">{Number(d.paid_amount || 0).toLocaleString()} / {Number(d.total_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-green-600 text-center py-8 font-medium">✅ Qarzdorlar yo'q</p>}
        </div>
      )}

      {/* Services */}
      {tab === "services" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">Xizmatlar taqsimoti</h3>
          {serviceData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {serviceData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-foreground">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{s.value} ta</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
        </div>
      )}

      {/* Patients */}
      {tab === "patients" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Bemorlar o'sishi</h3>
            {patientData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={patientData}><XAxis dataKey="month" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Jinsi bo'yicha</h3>
            <div className="flex gap-6 justify-center">
              {["male", "female"].map(g => (
                <div key={g} className="text-center">
                  <p className="text-3xl font-bold text-foreground">{patients.filter(p => p.gender === g).length}</p>
                  <p className="text-sm text-muted-foreground">{g === "male" ? "Erkak" : "Ayol"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalReports;
