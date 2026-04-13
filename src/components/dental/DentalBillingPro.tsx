import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { downloadHMSReceipt } from "@/utils/downloadHMSReceipt";
import { DollarSign, CreditCard, AlertTriangle, TrendingUp, Search, Download, Plus, X, Banknote, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalBillingProProps {
  clinicId: string;
  patients: any[];
  services: any[];
}

const paymentMethodLabel: Record<string, string> = { cash: "💵 Naqd", card: "💳 Karta", insurance: "🏥 Sug'urta", click: "📱 Click", payme: "📱 Payme" };
const statusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: "To'langan", color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  partial: { label: "Qisman", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  unpaid: { label: "To'lanmagan", color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
};

const DentalBillingPro = ({ clinicId, patients, services }: DentalBillingProProps) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [mainTab, setMainTab] = useState("dashboard");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: "", payment_method: "cash", notes: "",
    items: [{ name: "", price: "" }] as { name: string; price: string }[],
  });
  const [expenseForm, setExpenseForm] = useState({ category: "Material", description: "", amount: "" });

  const fetchData = async () => {
    const [t, e] = await Promise.all([
      supabase.from("dental_transactions").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("dental_expenses").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
    ]);
    setTransactions(t.data || []);
    setExpenses(e.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const getPatientName = (pid: string | null) => patients.find(p => p.id === pid)?.full_name || "Noma'lum";

  const totalRevenue = transactions.reduce((a, i) => a + Number(i.paid_amount || 0), 0);
  const totalDebt = transactions.reduce((a, i) => a + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);
  const totalExpenses_ = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses_;

  const handleCreateInvoice = async () => {
    if (!invoiceForm.patient_id) { toast({ title: "Bemorni tanlang", variant: "destructive" }); return; }
    const items = invoiceForm.items.filter(i => i.name && i.price);
    if (items.length === 0) { toast({ title: "Kamida 1 xizmat kiriting", variant: "destructive" }); return; }
    const totalAmount = items.reduce((a, i) => a + Number(i.price), 0);
    setSaving(true);
    const { error } = await supabase.from("dental_transactions").insert({
      clinic_id: clinicId,
      patient_id: invoiceForm.patient_id,
      items: items.map(i => ({ name: i.name, price: Number(i.price) })),
      total_amount: totalAmount,
      paid_amount: 0,
      payment_method: invoiceForm.payment_method,
      status: "unpaid",
      notes: invoiceForm.notes || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); }
    else {
      await writeAuditLog({ action: "create", entity_type: "dental_transaction", module: "dental", details: { total: totalAmount } });
      toast({ title: "Invoice yaratildi ✅" });
      setInvoiceForm({ patient_id: "", payment_method: "cash", notes: "", items: [{ name: "", price: "" }] });
      setShowNewInvoice(false);
      fetchData();
    }
    setSaving(false);
  };

  const handlePayment = async (id: string, amount: number, method?: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const newPaid = Number(tx.paid_amount || 0) + amount;
    const newStatus = newPaid >= Number(tx.total_amount) ? "paid" : "partial";
    const payMethod = method || tx.payment_method || "cash";

    // Update dental transaction
    await supabase.from("dental_transactions").update({ paid_amount: newPaid, status: newStatus } as any).eq("id", id);

    // Create split payment record
    await supabase.from("dental_split_payments").insert({
      clinic_id: clinicId,
      transaction_id: id,
      patient_id: tx.patient_id,
      amount,
      payment_method: payMethod,
    } as any);

    // Cross-post to HMS Finance for unified reporting
    await supabase.from("hms_finance").insert({
      clinic_id: clinicId,
      transaction_type: "income",
      category: "dental",
      amount,
      description: `Dental to'lov: ${getPatientName(tx.patient_id)} (${payMethod})`,
      reference_id: id,
      payment_method: payMethod,
      transaction_date: new Date().toISOString().split("T")[0],
    } as any);

    await writeAuditLog({ action: "update", entity_type: "dental_transaction", module: "dental", entity_id: id, details: { paid: amount, status: newStatus } });
    toast({ title: `To'lov qabul qilindi: ${amount.toLocaleString()} so'm` });
    fetchData();
    if (selectedInvoice?.id === id) setSelectedInvoice({ ...selectedInvoice, paid_amount: newPaid, status: newStatus });
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) { toast({ title: "Ma'lumotlarni to'ldiring", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("dental_expenses").insert({
      clinic_id: clinicId,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: Number(expenseForm.amount),
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Chiqim qo'shildi ✅" });
      setExpenseForm({ category: "Material", description: "", amount: "" });
      setShowNewExpense(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDownloadReceipt = (inv: any) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    downloadHMSReceipt({
      clinicName: "Dental Klinika",
      patientName: getPatientName(inv.patient_id),
      invoiceNumber: inv.invoice_number || inv.id?.slice(0, 8),
      date: inv.created_at?.split("T")[0] || "",
      items: items.map((i: any) => ({ name: i.name, qty: 1, price: Number(i.price) })),
      paymentMethod: inv.payment_method,
    });
  };

  const addItem = () => setInvoiceForm(p => ({ ...p, items: [...p.items, { name: "", price: "" }] }));
  const updateItem = (idx: number, field: string, val: string) => {
    const items = [...invoiceForm.items];
    (items[idx] as any)[field] = val;
    setInvoiceForm(p => ({ ...p, items }));
  };
  const removeItem = (idx: number) => setInvoiceForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const filtered = transactions.filter(i => {
    const matchSearch = getPatientName(i.patient_id).toLowerCase().includes(search.toLowerCase()) || (i.invoice_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (selectedInvoice) {
    const items = Array.isArray(selectedInvoice.items) ? selectedInvoice.items : [];
    const debt = Number(selectedInvoice.total_amount) - Number(selectedInvoice.paid_amount);
    const cfg = statusConfig[selectedInvoice.status] || statusConfig.unpaid;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}><X className="w-4 h-4 mr-1" /> Orqaga</Button>
          <h2 className="font-heading text-xl font-bold text-foreground">🧾 {selectedInvoice.invoice_number}</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-border">
            <div>
              <p className="text-lg font-bold text-foreground">{getPatientName(selectedInvoice.patient_id)}</p>
              <p className="text-sm text-muted-foreground">📅 {selectedInvoice.created_at?.split("T")[0]}</p>
              <p className="text-sm text-muted-foreground">{paymentMethodLabel[selectedInvoice.payment_method] || selectedInvoice.payment_method}</p>
            </div>
            <Badge className={cfg.color}>{cfg.label}</Badge>
          </div>
          <table className="w-full text-sm mb-6">
            <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground">#</th><th className="text-left py-2 text-muted-foreground">Xizmat</th><th className="text-right py-2 text-muted-foreground">Narx</th></tr></thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-border"><td className="py-3 text-muted-foreground">{i + 1}</td><td className="py-3 text-foreground">{item.name}</td><td className="py-3 text-right font-medium text-foreground">{Number(item.price).toLocaleString()} so'm</td></tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between font-bold text-foreground text-lg"><span>Jami:</span><span>{Number(selectedInvoice.total_amount).toLocaleString()} so'm</span></div>
            <div className="flex justify-between text-sm text-green-600"><span>To'langan:</span><span>{Number(selectedInvoice.paid_amount).toLocaleString()} so'm</span></div>
            {debt > 0 && <div className="flex justify-between text-sm text-red-600 font-medium"><span>Qarz:</span><span>{debt.toLocaleString()} so'm</span></div>}
          </div>
          <div className="flex gap-2 mt-6 flex-wrap">
            <Button onClick={() => handleDownloadReceipt(selectedInvoice)}><Download className="w-4 h-4 mr-1" /> PDF yuklash</Button>
            {debt > 0 && <Button variant="outline" className="text-green-600" onClick={() => handlePayment(selectedInvoice.id, debt)}>💰 To'liq to'lash</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">💰 Moliya va to'lovlar</h2>
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoicelar</TabsTrigger>
          <TabsTrigger value="expenses">Chiqimlar</TabsTrigger>
          <TabsTrigger value="reports">Hisobot</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Jami daromad", value: `${(totalRevenue / 1000000).toFixed(1)}M`, icon: TrendingUp, color: "text-green-600" },
                { label: "Qarzdorlik", value: `${(totalDebt / 1000000).toFixed(1)}M`, icon: AlertTriangle, color: "text-red-600" },
                { label: "Chiqimlar", value: `${(totalExpenses_ / 1000000).toFixed(1)}M`, icon: Banknote, color: "text-orange-600" },
                { label: "Sof foyda", value: `${(netProfit / 1000000).toFixed(1)}M`, icon: PieChart, color: "text-purple-600" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
                  <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground mb-3">Oxirgi operatsiyalar</h3>
              {transactions.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 rounded px-2" onClick={() => { setSelectedInvoice(inv); setMainTab("invoices"); }}>
                  <div><p className="text-sm font-medium text-foreground">{getPatientName(inv.patient_id)}</p><p className="text-xs text-muted-foreground">{inv.created_at?.split("T")[0]} • {inv.invoice_number}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-foreground">{Number(inv.total_amount).toLocaleString()}</p><Badge variant="outline" className={cn("text-xs", (statusConfig[inv.status] || statusConfig.unpaid).color)}>{(statusConfig[inv.status] || statusConfig.unpaid).label}</Badge></div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center py-4 text-sm text-muted-foreground">Tranzaksiyalar yo'q</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} /></div>
              {["all", "paid", "partial", "unpaid"].map(f => (
                <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} onClick={() => setStatusFilter(f)}>
                  {f === "all" ? "Barchasi" : (statusConfig[f]?.label || f)}
                </Button>
              ))}
              <Button size="sm" onClick={() => setShowNewInvoice(!showNewInvoice)}><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
            </div>

            {showNewInvoice && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <h3 className="font-bold text-foreground">Yangi invoice</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select value={invoiceForm.patient_id} onValueChange={v => setInvoiceForm(p => ({ ...p, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="👤 Bemor tanlang" /></SelectTrigger>
                    <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={invoiceForm.payment_method} onValueChange={v => setInvoiceForm(p => ({ ...p, payment_method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(paymentMethodLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Xizmatlar:</p>
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input placeholder="Xizmat nomi" value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} className="flex-1" />
                      <Input placeholder="Narx" type="number" value={item.price} onChange={e => updateItem(idx, "price", e.target.value)} className="w-32" />
                      {invoiceForm.items.length > 1 && <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}><X className="w-4 h-4" /></Button>}
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Xizmat qo'shish</Button>
                </div>
                <Input placeholder="Izoh" value={invoiceForm.notes} onChange={e => setInvoiceForm(p => ({ ...p, notes: e.target.value }))} />
                <div className="flex justify-between items-center">
                  <p className="font-bold text-foreground">Jami: {invoiceForm.items.reduce((a, i) => a + Number(i.price || 0), 0).toLocaleString()} so'm</p>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateInvoice} disabled={saving}>{saving ? "Saqlanmoqda..." : "Yaratish"}</Button>
                    <Button variant="outline" onClick={() => setShowNewInvoice(false)}>Bekor</Button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Invoicelar topilmadi</p>
            ) : filtered.map(inv => (
              <div key={inv.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedInvoice(inv)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{inv.invoice_number}</p><Badge variant="outline" className={(statusConfig[inv.status] || statusConfig.unpaid).color}>{(statusConfig[inv.status] || statusConfig.unpaid).label}</Badge></div>
                    <p className="text-sm text-muted-foreground">{getPatientName(inv.patient_id)} • {inv.created_at?.split("T")[0]}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{Number(inv.total_amount).toLocaleString()} so'm</p>
                    <p className="text-xs text-muted-foreground">{paymentMethodLabel[inv.payment_method] || inv.payment_method}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-foreground">Chiqimlar</h3>
              <Button size="sm" onClick={() => setShowNewExpense(!showNewExpense)}><Plus className="w-4 h-4 mr-1" /> Yangi chiqim</Button>
            </div>
            {showNewExpense && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select value={expenseForm.category} onValueChange={v => setExpenseForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Material", "Ish haqi", "Jihozlar", "Kommunal", "Ijara", "Boshqa"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Tavsif" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} />
                  <Input placeholder="Summa" type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateExpense} disabled={saving}>{saving ? "..." : "Saqlash"}</Button>
                  <Button variant="outline" onClick={() => setShowNewExpense(false)}>Bekor</Button>
                </div>
              </div>
            )}
            {expenses.map(exp => (
              <div key={exp.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center"><Banknote className="w-5 h-5 text-red-600" /></div>
                  <div><p className="font-medium text-foreground">{exp.description}</p><p className="text-xs text-muted-foreground">{exp.expense_date || exp.created_at?.split("T")[0]} • {exp.category}</p></div>
                </div>
                <p className="font-bold text-red-600">-{Number(exp.amount).toLocaleString()} so'm</p>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-center py-8 text-muted-foreground">Chiqimlar yo'q</p>}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Moliyaviy hisobot</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 p-5 text-center">
                <p className="text-sm text-green-600">Jami daromad</p>
                <p className="text-2xl font-bold text-green-700">{(totalRevenue / 1000000).toFixed(1)}M so'm</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-5 text-center">
                <p className="text-sm text-red-600">Jami chiqim</p>
                <p className="text-2xl font-bold text-red-700">{(totalExpenses_ / 1000000).toFixed(1)}M so'm</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900 p-5 text-center">
                <p className="text-sm text-purple-600">Sof foyda</p>
                <p className="text-2xl font-bold text-purple-700">{(netProfit / 1000000).toFixed(1)}M so'm</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <h4 className="font-bold text-foreground mb-3">To'lov usullari</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(paymentMethodLabel).map(([key, label]) => {
                  const count = transactions.filter(t => t.payment_method === key).length;
                  const amount = transactions.filter(t => t.payment_method === key).reduce((a, t) => a + Number(t.paid_amount || 0), 0);
                  return (
                    <div key={key} className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-lg">{label.split(" ")[0]}</p>
                      <p className="text-sm font-bold text-foreground">{count} ta</p>
                      <p className="text-xs text-muted-foreground">{(amount / 1000000).toFixed(1)}M</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DentalBillingPro;
