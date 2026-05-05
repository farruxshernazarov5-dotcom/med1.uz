import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { esc } from "@/lib/htmlEscape";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, Receipt, Search,
  CreditCard, Banknote, Loader2, FileDown, CheckCircle2, Clock, XCircle, BarChart3, Calendar, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_TYPES = [
  { value: "consultation", label: "Konsultatsiya", icon: "🩺" },
  { value: "procedure", label: "Muolaja", icon: "💉" },
  { value: "lab", label: "Laboratoriya", icon: "🧪" },
  { value: "imaging", label: "Diagnostika", icon: "📷" },
  { value: "surgery", label: "Operatsiya", icon: "🏥" },
  { value: "other", label: "Boshqa", icon: "📋" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Naqd", icon: Banknote },
  { value: "card", label: "Karta", icon: CreditCard },
  { value: "click", label: "Click", icon: CreditCard },
  { value: "payme", label: "Payme", icon: CreditCard },
  { value: "transfer", label: "O'tkazma", icon: CreditCard },
];

const EXPENSE_CATEGORIES = [
  "Ijara", "Maosh", "Tibbiy jihozlar", "Dorilar", "Kommunal", "Reklama", "Soliq", "Boshqa"
];

const STATUS_INFO: Record<string, { label: string; icon: any; color: string }> = {
  paid: { label: "To'langan", icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  partial: { label: "Qisman", icon: Clock, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  unpaid: { label: "To'lanmagan", icon: Clock, color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  cancelled: { label: "Bekor", icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/30" },
};

interface Props { doctorId: string }

const DocBilling = ({ doctorId }: Props) => {
  const [tab, setTab] = useState<"overview" | "invoices" | "expenses">("overview");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "all">("month");

  // Invoice dialog
  const [invDialog, setInvDialog] = useState(false);
  const [savingInv, setSavingInv] = useState(false);
  const [invForm, setInvForm] = useState({
    patient_name: "", patient_phone: "", service_type: "consultation",
    description: "", amount: "", discount: "", tax: "",
    payment_method: "cash", status: "unpaid", due_date: "", notes: "",
  });

  // Expense dialog
  const [expDialog, setExpDialog] = useState(false);
  const [savingExp, setSavingExp] = useState(false);
  const [expForm, setExpForm] = useState({
    category: "Ijara", amount: "", description: "", expense_date: new Date().toISOString().slice(0, 10), payment_method: "cash"
  });

  const load = async () => {
    setLoading(true);
    const [inv, exp] = await Promise.all([
      supabase.from("doctor_invoices" as any).select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false }),
      supabase.from("doctor_expenses" as any).select("*").eq("doctor_id", doctorId).order("expense_date", { ascending: false }),
    ]);
    setInvoices((inv.data as any[]) || []);
    setExpenses((exp.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [doctorId]);

  const periodFilter = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    if (period === "today") return d.toDateString() === now.toDateString();
    if (period === "week") { const w = new Date(); w.setDate(w.getDate() - 7); return d >= w; }
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  };

  const filteredInv = invoices.filter(i => periodFilter(i.created_at));
  const filteredExp = expenses.filter(e => periodFilter(e.expense_date));

  const totalRevenue = filteredInv.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const totalUnpaid = filteredInv.filter(i => i.status === "unpaid" || i.status === "partial")
    .reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);
  const totalExpense = filteredExp.reduce((s, e) => s + Number(e.amount || 0), 0);
  const profit = totalRevenue - totalExpense;
  const invCount = filteredInv.length;
  const paidCount = filteredInv.filter(i => i.status === "paid").length;

  const visibleInvoices = invoices.filter(i => {
    if (filter !== "all" && i.status !== filter) return false;
    if (search && !i.patient_name?.toLowerCase().includes(search.toLowerCase()) && !i.invoice_number?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const saveInvoice = async () => {
    if (!invForm.patient_name.trim() || !invForm.amount) {
      toast({ title: "Bemor ismi va summa majburiy", variant: "destructive" }); return;
    }
    setSavingInv(true);
    const subtotal = Number(invForm.amount);
    const discount = Number(invForm.discount) || 0;
    const tax = Number(invForm.tax) || 0;
    const total = subtotal - discount + tax;
    const paid = invForm.status === "paid" ? total : 0;

    const { error } = await supabase.from("doctor_invoices" as any).insert({
      doctor_id: doctorId,
      patient_name: invForm.patient_name.trim(),
      patient_phone: invForm.patient_phone || null,
      service_type: invForm.service_type,
      description: invForm.description || null,
      subtotal, discount, tax, total_amount: total, paid_amount: paid,
      payment_method: invForm.payment_method,
      status: invForm.status,
      due_date: invForm.due_date || null,
      paid_at: invForm.status === "paid" ? new Date().toISOString() : null,
      notes: invForm.notes || null,
    } as any);
    setSavingInv(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Hisob-faktura saqlandi" });
    setInvDialog(false);
    setInvForm({ patient_name: "", patient_phone: "", service_type: "consultation", description: "", amount: "", discount: "", tax: "", payment_method: "cash", status: "unpaid", due_date: "", notes: "" });
    load();
  };

  const markPaid = async (id: string, total: number) => {
    const { error } = await supabase.from("doctor_invoices" as any).update({
      status: "paid", paid_amount: total, paid_at: new Date().toISOString()
    } as any).eq("id", id);
    if (error) { toast({ title: "Xatolik", variant: "destructive" }); return; }
    toast({ title: "✅ To'langan deb belgilandi" });
    load();
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("doctor_invoices" as any).delete().eq("id", id);
    toast({ title: "🗑 O'chirildi" });
    load();
  };

  const saveExpense = async () => {
    if (!expForm.amount) { toast({ title: "Summa majburiy", variant: "destructive" }); return; }
    setSavingExp(true);
    const { error } = await supabase.from("doctor_expenses" as any).insert({
      doctor_id: doctorId,
      category: expForm.category,
      amount: Number(expForm.amount),
      description: expForm.description || null,
      expense_date: expForm.expense_date,
      payment_method: expForm.payment_method,
    } as any);
    setSavingExp(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Xarajat saqlandi" });
    setExpDialog(false);
    setExpForm({ category: "Ijara", amount: "", description: "", expense_date: new Date().toISOString().slice(0, 10), payment_method: "cash" });
    load();
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("doctor_expenses" as any).delete().eq("id", id);
    toast({ title: "🗑 O'chirildi" });
    load();
  };

  // Service breakdown
  const serviceBreakdown = SERVICE_TYPES.map(s => {
    const items = filteredInv.filter(i => i.service_type === s.value);
    return { ...s, count: items.length, total: items.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) };
  }).filter(s => s.count > 0);

  // Expense breakdown
  const expenseBreakdown = EXPENSE_CATEGORIES.map(c => {
    const items = filteredExp.filter(e => e.category === c);
    return { category: c, count: items.length, total: items.reduce((sum, e) => sum + Number(e.amount || 0), 0) };
  }).filter(c => c.count > 0);

  const printInvoice = (inv: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>${inv.invoice_number}</title>
      <style>
        body{font-family:Arial;padding:40px;max-width:700px;margin:auto;color:#1a1a1a}
        .header{border-bottom:3px solid #0EA5E9;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between}
        h1{color:#0EA5E9;margin:0;font-size:28px}
        .invoice-no{background:#0EA5E9;color:white;padding:8px 16px;border-radius:8px;display:inline-block;margin-top:10px}
        .row{display:flex;justify-content:space-between;margin:8px 0;padding:6px 0;border-bottom:1px dashed #e5e7eb}
        .total{background:#f0f9ff;padding:20px;border-radius:12px;margin-top:20px;text-align:right;font-size:20px;font-weight:bold;color:#0369a1}
        .meta{color:#6b7280;font-size:13px}
        .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
        .paid{background:#d1fae5;color:#065f46}
        .unpaid{background:#fed7aa;color:#9a3412}
      </style></head><body>
      <div class="header">
        <div>
          <h1>🩺 Med1.uz</h1>
          <p class="meta">Tibbiy hisob-faktura</p>
          <div class="invoice-no">${inv.invoice_number}</div>
        </div>
        <div style="text-align:right">
          <p class="meta">Sana: ${new Date(inv.created_at).toLocaleDateString("uz-UZ")}</p>
          <span class="badge ${inv.status === 'paid' ? 'paid' : 'unpaid'}">${STATUS_INFO[inv.status]?.label}</span>
        </div>
      </div>
      <h3>Bemor</h3>
      <div class="row"><span>Ism:</span><strong>${inv.patient_name}</strong></div>
      ${inv.patient_phone ? `<div class="row"><span>Tel:</span><strong>${inv.patient_phone}</strong></div>` : ''}
      <h3 style="margin-top:30px">Xizmat</h3>
      <div class="row"><span>Turi:</span><strong>${SERVICE_TYPES.find(s => s.value === inv.service_type)?.label}</strong></div>
      ${inv.description ? `<div class="row"><span>Tavsif:</span><strong>${inv.description}</strong></div>` : ''}
      <div class="row"><span>Asosiy summa:</span><strong>${Number(inv.subtotal).toLocaleString()} so'm</strong></div>
      ${Number(inv.discount) > 0 ? `<div class="row"><span>Chegirma:</span><strong>-${Number(inv.discount).toLocaleString()} so'm</strong></div>` : ''}
      ${Number(inv.tax) > 0 ? `<div class="row"><span>Soliq:</span><strong>+${Number(inv.tax).toLocaleString()} so'm</strong></div>` : ''}
      <div class="total">JAMI: ${Number(inv.total_amount).toLocaleString()} so'm</div>
      ${inv.notes ? `<p class="meta" style="margin-top:30px"><strong>Izoh:</strong> ${inv.notes}</p>` : ''}
      <div style="margin-top:60px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center" class="meta">
        Med1.uz — Tibbiyot platformasi · med1.uz
      </div>
      <script>window.print()</script>
      </body></html>
    `);
    w.document.close();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-secondary" /> Billing & Moliya
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Hisob-fakturalar, daromad va xarajatlar boshqaruvi</p>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month", "year", "all"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                period === p ? "bg-secondary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
              {p === "today" ? "Bugun" : p === "week" ? "Hafta" : p === "month" ? "Oy" : p === "year" ? "Yil" : "Hammasi"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5">
          <TrendingUp className="w-7 h-7 text-emerald-600 mb-2" />
          <p className="text-[11px] text-muted-foreground">Daromad</p>
          <p className="text-xl font-bold text-foreground mt-1">{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">so'm</p>
        </div>
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-red-500/15 to-red-500/5">
          <TrendingDown className="w-7 h-7 text-red-600 mb-2" />
          <p className="text-[11px] text-muted-foreground">Xarajat</p>
          <p className="text-xl font-bold text-foreground mt-1">{totalExpense.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">so'm</p>
        </div>
        <div className={cn("rounded-2xl border border-border p-4 bg-gradient-to-br",
          profit >= 0 ? "from-secondary/15 to-secondary/5" : "from-red-500/15 to-red-500/5")}>
          <DollarSign className={cn("w-7 h-7 mb-2", profit >= 0 ? "text-secondary" : "text-red-600")} />
          <p className="text-[11px] text-muted-foreground">Sof foyda</p>
          <p className={cn("text-xl font-bold mt-1", profit >= 0 ? "text-foreground" : "text-red-600")}>{profit.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">so'm</p>
        </div>
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-amber-500/15 to-amber-500/5">
          <Clock className="w-7 h-7 text-amber-600 mb-2" />
          <p className="text-[11px] text-muted-foreground">Qarzdorlik</p>
          <p className="text-xl font-bold text-foreground mt-1">{totalUnpaid.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">so'm</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {[
          { id: "overview", label: "Umumiy", icon: BarChart3 },
          { id: "invoices", label: `Hisoblar (${invoices.length})`, icon: Receipt },
          { id: "expenses", label: `Xarajatlar (${expenses.length})`, icon: TrendingDown },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-secondary" /> Xizmatlar bo'yicha
            </h3>
            {serviceBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Ma'lumot yo'q</p>
            ) : (
              <div className="space-y-3">
                {serviceBreakdown.map(s => {
                  const max = Math.max(...serviceBreakdown.map(x => x.total));
                  const pct = (s.total / max) * 100;
                  return (
                    <div key={s.value}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{s.icon} {s.label} ({s.count})</span>
                        <span className="text-muted-foreground">{s.total.toLocaleString()} so'm</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Hisoblar: {invCount} · To'langan: {paidCount}</span>
              <span className="font-bold text-emerald-600">{invCount > 0 ? Math.round((paidCount / invCount) * 100) : 0}% to'langan</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" /> Xarajatlar tahlili
            </h3>
            {expenseBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Xarajatlar yo'q</p>
            ) : (
              <div className="space-y-3">
                {expenseBreakdown.map(e => {
                  const max = Math.max(...expenseBreakdown.map(x => x.total));
                  const pct = (e.total / max) * 100;
                  return (
                    <div key={e.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{e.category} ({e.count})</span>
                        <span className="text-muted-foreground">{e.total.toLocaleString()} so'm</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INVOICES TAB */}
      {tab === "invoices" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Bemor yoki raqam bo'yicha..." className="pl-9 h-9" />
            </div>
            <div className="flex gap-1">
              {(["all", "paid", "partial", "unpaid"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-medium",
                    filter === f ? "bg-secondary text-white" : "bg-muted text-muted-foreground")}>
                  {f === "all" ? "Hammasi" : STATUS_INFO[f]?.label}
                </button>
              ))}
            </div>
            <Dialog open={invDialog} onOpenChange={setInvDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-secondary to-accent text-white border-0">
                  <Plus className="w-4 h-4 mr-1" /> Yangi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Yangi hisob-faktura</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Bemor ismi *</Label><Input value={invForm.patient_name} onChange={e => setInvForm({ ...invForm, patient_name: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Telefon</Label><Input value={invForm.patient_phone} onChange={e => setInvForm({ ...invForm, patient_phone: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div>
                    <Label className="text-xs">Xizmat turi</Label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {SERVICE_TYPES.map(s => (
                        <button key={s.value} onClick={() => setInvForm({ ...invForm, service_type: s.value })}
                          className={cn("p-2 rounded-lg border text-[11px] font-medium transition-all",
                            invForm.service_type === s.value ? "bg-secondary text-white border-secondary" : "bg-card text-muted-foreground border-border hover:border-secondary/30")}>
                          <div className="text-base">{s.icon}</div>{s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><Label className="text-xs">Tavsif</Label><Textarea value={invForm.description} onChange={e => setInvForm({ ...invForm, description: e.target.value })} rows={2} className="mt-1" placeholder="Xizmat batafsil..." /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Summa *</Label><Input type="number" value={invForm.amount} onChange={e => setInvForm({ ...invForm, amount: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Chegirma</Label><Input type="number" value={invForm.discount} onChange={e => setInvForm({ ...invForm, discount: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Soliq</Label><Input type="number" value={invForm.tax} onChange={e => setInvForm({ ...invForm, tax: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between items-center">
                    <span className="text-muted-foreground">Jami:</span>
                    <span className="font-bold text-base text-secondary">
                      {((Number(invForm.amount) || 0) - (Number(invForm.discount) || 0) + (Number(invForm.tax) || 0)).toLocaleString()} so'm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">To'lov usuli</Label>
                      <select value={invForm.payment_method} onChange={e => setInvForm({ ...invForm, payment_method: e.target.value })}
                        className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Holat</Label>
                      <select value={invForm.status} onChange={e => setInvForm({ ...invForm, status: e.target.value })}
                        className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="unpaid">To'lanmagan</option>
                        <option value="paid">To'langan</option>
                        <option value="partial">Qisman</option>
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">To'lov muddati</Label><Input type="date" value={invForm.due_date} onChange={e => setInvForm({ ...invForm, due_date: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Izoh</Label><Textarea value={invForm.notes} onChange={e => setInvForm({ ...invForm, notes: e.target.value })} rows={2} className="mt-1" /></div>
                  <Button onClick={saveInvoice} disabled={savingInv} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
                    {savingInv ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Receipt className="w-4 h-4 mr-2" /> Saqlash</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {visibleInvoices.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed">
              <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Hisob-fakturalar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleInvoices.map(inv => {
                const s = STATUS_INFO[inv.status] || STATUS_INFO.unpaid;
                const svc = SERVICE_TYPES.find(x => x.value === inv.service_type);
                return (
                  <div key={inv.id} className="bg-card rounded-xl border border-border p-3 hover:border-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base">{svc?.icon}</span>
                          <p className="text-sm font-bold text-foreground truncate">{inv.patient_name}</p>
                          <Badge variant="outline" className={cn("text-[10px] border", s.color)}>
                            <s.icon className="w-3 h-3 mr-1" />{s.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{inv.invoice_number}</span>
                          <span>· {svc?.label}</span>
                          <span>· {new Date(inv.created_at).toLocaleDateString("uz-UZ")}</span>
                          {inv.patient_phone && <span>· 📞 {inv.patient_phone}</span>}
                        </div>
                        {inv.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{inv.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-base text-foreground">{Number(inv.total_amount).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">so'm</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-border">
                      {inv.status !== "paid" && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => markPaid(inv.id, Number(inv.total_amount))}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> To'landi
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => printInvoice(inv)}>
                        <FileDown className="w-3 h-3 mr-1" /> PDF
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-600 hover:bg-red-500/10"
                        onClick={() => deleteInvoice(inv.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EXPENSES TAB */}
      {tab === "expenses" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={expDialog} onOpenChange={setExpDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                  <Plus className="w-4 h-4 mr-1" /> Yangi xarajat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Yangi xarajat</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Kategoriya</Label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {EXPENSE_CATEGORIES.map(c => (
                        <button key={c} onClick={() => setExpForm({ ...expForm, category: c })}
                          className={cn("p-2 rounded-lg border text-xs font-medium",
                            expForm.category === c ? "bg-red-500 text-white border-red-500" : "bg-card text-muted-foreground border-border")}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Summa *</Label><Input type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Sana</Label><Input type="date" value={expForm.expense_date} onChange={e => setExpForm({ ...expForm, expense_date: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div>
                    <Label className="text-xs">To'lov usuli</Label>
                    <select value={expForm.payment_method} onChange={e => setExpForm({ ...expForm, payment_method: e.target.value })}
                      className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div><Label className="text-xs">Tavsif</Label><Textarea value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} rows={2} className="mt-1" /></div>
                  <Button onClick={saveExpense} disabled={savingExp} className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                    {savingExp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed">
              <TrendingDown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Xarajatlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{e.description || e.category}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">{e.category}</Badge>
                        <span><Calendar className="w-2.5 h-2.5 inline mr-0.5" />{new Date(e.expense_date).toLocaleDateString("uz-UZ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-bold text-sm text-red-600">-{Number(e.amount).toLocaleString()}</p>
                    <button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocBilling;
