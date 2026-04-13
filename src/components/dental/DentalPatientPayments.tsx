import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { generateDentalInvoiceHTML } from "@/utils/downloadDentalInvoice";
import { DollarSign, Plus, CreditCard, Download, Eye, X, Banknote, QrCode, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalPatientPaymentsProps {
  patient: any;
  clinicId: string;
  services: any[];
}

const PAYMENT_METHODS = [
  { value: "cash", label: "💵 Naqd", icon: "💵" },
  { value: "card", label: "💳 Karta", icon: "💳" },
  { value: "click", label: "📱 Click", icon: "📱" },
  { value: "payme", label: "📱 Payme", icon: "📱" },
  { value: "insurance", label: "🏥 Sug'urta", icon: "🏥" },
];

const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
  paid: { label: "To'langan", color: "text-green-600 bg-green-50 dark:bg-green-950/30", emoji: "✅" },
  partial: { label: "Qisman", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30", emoji: "⏳" },
  unpaid: { label: "To'lanmagan", color: "text-red-600 bg-red-50 dark:bg-red-950/30", emoji: "❌" },
};

const DentalPatientPayments = ({ patient, clinicId, services }: DentalPatientPaymentsProps) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [splitPayments, setSplitPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    items: [{ name: "", price: "", qty: "1" }] as { name: string; price: string; qty: string }[],
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const [inv, sp] = await Promise.all([
      supabase.from("dental_transactions").select("*").eq("clinic_id", clinicId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
      supabase.from("dental_split_payments").select("*").eq("clinic_id", clinicId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
    ]);
    setInvoices(inv.data || []);
    setSplitPayments(sp.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [patient.id, clinicId]);

  const totalDebt = invoices.reduce((a, i) => a + Math.max(0, Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);
  const totalPaid = invoices.reduce((a, i) => a + Number(i.paid_amount || 0), 0);
  const totalAmount = invoices.reduce((a, i) => a + Number(i.total_amount || 0), 0);

  const handleCreateInvoice = async () => {
    const items = invoiceForm.items.filter(i => i.name && i.price);
    if (items.length === 0) { toast({ title: "Kamida 1 xizmat kiriting", variant: "destructive" }); return; }
    const totalAmount = items.reduce((a, i) => a + Number(i.price) * Number(i.qty || 1), 0);
    setSaving(true);
    const { data, error } = await supabase.from("dental_transactions").insert({
      clinic_id: clinicId,
      patient_id: patient.id,
      items: items.map(i => ({ name: i.name, price: Number(i.price), qty: Number(i.qty || 1) })),
      total_amount: totalAmount,
      paid_amount: 0,
      payment_method: "multi",
      status: "unpaid",
      notes: invoiceForm.notes || null,
    } as any).select().single();
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); }
    else {
      await writeAuditLog({ action: "create", entity_type: "dental_transaction", module: "dental", details: { patient: patient.full_name, total: totalAmount } });
      toast({ title: "Invoice yaratildi ✅", description: `${data?.invoice_number || ""} — ${totalAmount.toLocaleString()} so'm` });
      setInvoiceForm({ items: [{ name: "", price: "", qty: "1" }], notes: "" });
      setShowNewInvoice(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleAddPayment = async (transactionId: string) => {
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) { toast({ title: "Summani kiriting", variant: "destructive" }); return; }
    const inv = invoices.find(i => i.id === transactionId);
    if (!inv) return;
    const debt = Number(inv.total_amount) - Number(inv.paid_amount);
    if (amount > debt) { toast({ title: `Qarz faqat ${debt.toLocaleString()} so'm`, variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("dental_split_payments").insert({
      clinic_id: clinicId,
      transaction_id: transactionId,
      patient_id: patient.id,
      amount,
      payment_method: paymentForm.payment_method,
      notes: paymentForm.notes || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); }
    else {
      await writeAuditLog({ action: "create", entity_type: "dental_split_payment", module: "dental", details: { patient: patient.full_name, amount, method: paymentForm.payment_method } });
      toast({ title: `To'lov qabul qilindi: ${amount.toLocaleString()} so'm ✅` });
      setPaymentForm({ amount: "", payment_method: "cash", notes: "" });
      setShowPaymentForm(null);
      fetchData();
    }
    setSaving(false);
  };

  const handleDownloadInvoice = (inv: any) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    const payments = splitPayments.filter(sp => sp.transaction_id === inv.id);
    const html = generateDentalInvoiceHTML({
      clinicName: "Dental Klinika",
      invoiceNumber: inv.invoice_number || inv.id?.slice(0, 8),
      patientName: patient.full_name,
      patientPhone: patient.phone || "",
      date: inv.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      items: items.map((i: any) => ({ name: i.name, qty: Number(i.qty || 1), price: Number(i.price) })),
      payments: payments.map((p: any) => ({
        method: p.payment_method,
        amount: Number(p.amount),
        date: p.created_at?.split("T")[0] || "",
      })),
      totalAmount: Number(inv.total_amount),
      paidAmount: Number(inv.paid_amount),
      status: inv.status,
      verificationCode: inv.id,
    });
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  // Invoice detail view
  if (selectedInvoice) {
    const items = Array.isArray(selectedInvoice.items) ? selectedInvoice.items : [];
    const debt = Math.max(0, Number(selectedInvoice.total_amount) - Number(selectedInvoice.paid_amount));
    const cfg = statusConfig[selectedInvoice.status] || statusConfig.unpaid;
    const invPayments = splitPayments.filter(sp => sp.transaction_id === selectedInvoice.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}><X className="w-4 h-4 mr-1" /> Orqaga</Button>
          <h3 className="font-heading font-bold text-foreground text-lg">🧾 {selectedInvoice.invoice_number}</h3>
          <Badge className={cfg.color}>{cfg.emoji} {cfg.label}</Badge>
        </div>

        {/* Invoice summary card */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-bold text-foreground">{patient.full_name}</p>
              <p className="text-sm text-muted-foreground">📅 {selectedInvoice.created_at?.split("T")[0]} • 📞 {patient.phone}</p>
            </div>
            <Button size="sm" onClick={() => handleDownloadInvoice(selectedInvoice)}>
              <Download className="w-4 h-4 mr-1" /> PDF / Chop etish
            </Button>
          </div>

          {/* Items table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Xizmat</th>
                  <th className="text-center p-3 text-muted-foreground font-medium">Soni</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Narx</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Jami</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 text-foreground font-medium">{item.name}</td>
                    <td className="p-3 text-center text-foreground">{item.qty || 1}</td>
                    <td className="p-3 text-right text-foreground">{Number(item.price).toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-foreground">{(Number(item.price) * Number(item.qty || 1)).toLocaleString()} so'm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-foreground"><span>Jami summa:</span><span className="font-bold text-lg">{Number(selectedInvoice.total_amount).toLocaleString()} so'm</span></div>
            <div className="flex justify-between text-green-600"><span>To'langan:</span><span className="font-bold">{Number(selectedInvoice.paid_amount).toLocaleString()} so'm</span></div>
            {debt > 0 && <div className="flex justify-between text-red-600"><span>Qarz:</span><span className="font-bold">{debt.toLocaleString()} so'm</span></div>}
          </div>
        </div>

        {/* Split payments history */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-heading font-bold text-foreground">💳 To'lovlar tarixi</h4>
            {debt > 0 && (
              <Button size="sm" onClick={() => setShowPaymentForm(selectedInvoice.id)}>
                <Plus className="w-4 h-4 mr-1" /> To'lov qo'shish
              </Button>
            )}
          </div>

          {showPaymentForm === selectedInvoice.id && (
            <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
              <p className="text-sm font-medium text-foreground">Yangi to'lov — Qarz: <span className="text-red-600">{debt.toLocaleString()} so'm</span></p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input type="number" placeholder="Summa *" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
                <Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm(p => ({ ...p, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Izoh" value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAddPayment(selectedInvoice.id)} disabled={saving}>
                  {saving ? "Saqlanmoqda..." : "💰 To'lovni tasdiqlash"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowPaymentForm(null); setPaymentForm({ amount: "", payment_method: "cash", notes: "" }); }}>Bekor</Button>
                {debt > 0 && (
                  <Button size="sm" variant="ghost" className="text-green-600" onClick={() => setPaymentForm(p => ({ ...p, amount: String(debt) }))}>
                    To'liq summa
                  </Button>
                )}
              </div>
            </div>
          )}

          {invPayments.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Hali to'lov qilinmagan</p>
          ) : (
            <div className="space-y-2">
              {invPayments.map(p => {
                const method = PAYMENT_METHODS.find(m => m.value === p.payment_method);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{method?.icon || "💰"}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{method?.label || p.payment_method}</p>
                        <p className="text-xs text-muted-foreground">{p.created_at?.split("T")[0]} {p.notes && `• ${p.notes}`}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">+{Number(p.amount).toLocaleString()} so'm</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-bold text-foreground">💳 To'lovlar va invoicelar</h3>
        <Button size="sm" onClick={() => setShowNewInvoice(true)}>
          <Plus className="w-4 h-4 mr-1" /> Yangi invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-primary">{totalAmount.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Jami (so'm)</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900 p-4 text-center">
          <Banknote className="w-5 h-5 mx-auto mb-1 text-green-600" />
          <p className="text-lg font-bold text-green-700">{totalPaid.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">To'langan</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center", totalDebt > 0 ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" : "bg-card border-border")}>
          <AlertTriangle className={cn("w-5 h-5 mx-auto mb-1", totalDebt > 0 ? "text-red-600" : "text-muted-foreground")} />
          <p className={cn("text-lg font-bold", totalDebt > 0 ? "text-red-700" : "text-muted-foreground")}>{totalDebt.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Qarz</p>
        </div>
      </div>

      {/* New invoice form */}
      {showNewInvoice && (
        <div className="bg-card rounded-2xl border-2 border-primary/20 p-5 space-y-4">
          <h4 className="font-heading font-bold text-foreground">📋 Yangi invoice — {patient.full_name}</h4>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Xizmatlar:</p>
            {invoiceForm.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input placeholder="Xizmat nomi *" className="flex-1" value={item.name} onChange={e => {
                  const items = [...invoiceForm.items]; items[idx].name = e.target.value; setInvoiceForm(p => ({ ...p, items }));
                }} />
                <Input placeholder="Soni" className="w-16" type="number" value={item.qty} onChange={e => {
                  const items = [...invoiceForm.items]; items[idx].qty = e.target.value; setInvoiceForm(p => ({ ...p, items }));
                }} />
                <Input placeholder="Narx *" className="w-32" type="number" value={item.price} onChange={e => {
                  const items = [...invoiceForm.items]; items[idx].price = e.target.value; setInvoiceForm(p => ({ ...p, items }));
                }} />
                {invoiceForm.items.length > 1 && (
                  <Button size="icon" variant="ghost" className="shrink-0" onClick={() => setInvoiceForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setInvoiceForm(p => ({ ...p, items: [...p.items, { name: "", price: "", qty: "1" }] }))}>
              <Plus className="w-3 h-3 mr-1" /> Xizmat qo'shish
            </Button>
          </div>

          {/* Quick service select */}
          {services.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Tezkor tanlov:</p>
              <div className="flex gap-2 flex-wrap">
                {services.filter((s: any) => s.is_active !== false).slice(0, 8).map((s: any) => (
                  <Button key={s.id} size="sm" variant="outline" className="text-xs" onClick={() => {
                    setInvoiceForm(p => ({ ...p, items: [...p.items.filter(i => i.name || i.price), { name: s.name, price: String(s.price || 0), qty: "1" }] }));
                  }}>
                    {s.name} ({Number(s.price).toLocaleString()})
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Input placeholder="Izoh" value={invoiceForm.notes} onChange={e => setInvoiceForm(p => ({ ...p, notes: e.target.value }))} />

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Jami:</p>
              <p className="text-xl font-bold text-primary">
                {invoiceForm.items.reduce((a, i) => a + Number(i.price || 0) * Number(i.qty || 1), 0).toLocaleString()} so'm
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateInvoice} disabled={saving}>{saving ? "Saqlanmoqda..." : "✅ Invoice yaratish"}</Button>
              <Button variant="outline" onClick={() => { setShowNewInvoice(false); setInvoiceForm({ items: [{ name: "", price: "", qty: "1" }], notes: "" }); }}>Bekor</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices list */}
      {loading ? (
        <div className="text-center py-8"><div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Invoicelar topilmadi</p>
          <p className="text-xs mt-1">"Yangi invoice" tugmasini bosing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const cfg = statusConfig[inv.status] || statusConfig.unpaid;
            const debt = Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount));
            const invSplits = splitPayments.filter(sp => sp.transaction_id === inv.id);
            return (
              <div key={inv.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.emoji}</span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{inv.invoice_number || inv.id?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{inv.created_at?.split("T")[0]}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-foreground font-medium">{Number(inv.total_amount).toLocaleString()} so'm</span>
                    {debt > 0 && <span className="text-red-600 text-xs">Qarz: {debt.toLocaleString()}</span>}
                    {invSplits.length > 0 && <span className="text-muted-foreground text-xs">{invSplits.length} ta to'lov</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedInvoice(inv); }}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDownloadInvoice(inv)}><Download className="w-3.5 h-3.5" /></Button>
                    {debt > 0 && (
                      <Button size="sm" variant="ghost" className="text-green-600" onClick={() => { setSelectedInvoice(inv); setShowPaymentForm(inv.id); }}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DentalPatientPayments;
