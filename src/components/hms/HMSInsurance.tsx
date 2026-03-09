import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, Receipt, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSInsurance = ({ clinicId }: Props) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    patient_id: "", invoice_number: "", invoice_date: new Date().toISOString().split("T")[0],
    due_date: "", subtotal: 0, discount: 0, tax: 0, total_amount: 0, paid_amount: 0,
    payment_method: "", insurance_company: "", insurance_policy: "", insurance_coverage: 0, notes: ""
  });

  const fetchData = async () => {
    const [invRes, patRes] = await Promise.all([
      supabase.from("hms_invoices").select("*").eq("clinic_id", clinicId).order("invoice_date", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setInvoices(invRes.data || []);
    setPatients(patRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ patient_id: "", invoice_number: "", invoice_date: new Date().toISOString().split("T")[0], due_date: "", subtotal: 0, discount: 0, tax: 0, total_amount: 0, paid_amount: 0, payment_method: "", insurance_company: "", insurance_policy: "", insurance_coverage: 0, notes: "" });
    setEditing(null); setShowForm(false);
  };

  const calcTotal = (sub: number, disc: number, tx: number) => sub - disc + tx;

  const handleSave = async () => {
    if (!form.patient_id) { toast({ title: "Bemor majburiy!", variant: "destructive" }); return; }
    const total = calcTotal(Number(form.subtotal), Number(form.discount), Number(form.tax));
    const payload = {
      ...form, subtotal: Number(form.subtotal), discount: Number(form.discount), tax: Number(form.tax),
      total_amount: total, paid_amount: Number(form.paid_amount), insurance_coverage: Number(form.insurance_coverage),
      due_date: form.due_date || null, clinic_id: clinicId,
      invoice_number: form.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`
    };
    if (editing) {
      await supabase.from("hms_invoices").update(payload).eq("id", editing.id);
      toast({ title: "✅ Hisob-faktura yangilandi" });
    } else {
      await supabase.from("hms_invoices").insert(payload);
      toast({ title: "✅ Hisob-faktura yaratildi" });
    }
    resetForm(); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "paid") {
      const inv = invoices.find(i => i.id === id);
      updates.paid_amount = inv?.total_amount || 0;
    }
    await supabase.from("hms_invoices").update(updates).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_invoices").delete().eq("id", id);
    toast({ title: "Hisob-faktura o'chirildi" }); fetchData();
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.full_name || "—";
  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const totalDebt = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800",
    partial: "bg-blue-100 text-blue-800", overdue: "bg-red-100 text-red-800", cancelled: "bg-muted text-muted-foreground"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Moliya & Sug'urta</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi faktura</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami fakturalar</p>
          <p className="text-lg font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Tushumlar</p>
          <p className="text-lg font-bold text-green-600">{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Qarzdorlik</p>
          <p className="text-lg font-bold text-red-600">{totalDebt.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Sug'urta orqali</p>
          <p className="text-lg font-bold text-primary">{invoices.filter(i => i.insurance_company).length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[{ id: "all", label: "Barchasi" }, { id: "pending", label: "Kutilmoqda" }, { id: "paid", label: "To'langan" }, { id: "partial", label: "Qisman" }, { id: "overdue", label: "Muddati o'tgan" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi faktura"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Bemor tanlang *</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <Input placeholder="Faktura raqami" value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
            <Input type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} />
            <Input type="date" placeholder="Muddat" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            <Input type="number" placeholder="Jami summa" value={form.subtotal || ""} onChange={e => setForm({ ...form, subtotal: Number(e.target.value) })} />
            <Input type="number" placeholder="Chegirma" value={form.discount || ""} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} />
            <Input type="number" placeholder="Soliq" value={form.tax || ""} onChange={e => setForm({ ...form, tax: Number(e.target.value) })} />
            <Input type="number" placeholder="To'langan summa" value={form.paid_amount || ""} onChange={e => setForm({ ...form, paid_amount: Number(e.target.value) })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option value="">To'lov usuli</option>
              <option value="cash">Naqd</option>
              <option value="card">Karta</option>
              <option value="transfer">O'tkazma</option>
              <option value="insurance">Sug'urta</option>
            </select>
            <Input placeholder="Sug'urta kompaniyasi" value={form.insurance_company} onChange={e => setForm({ ...form, insurance_company: e.target.value })} />
            <Input placeholder="Polis raqami" value={form.insurance_policy} onChange={e => setForm({ ...form, insurance_policy: e.target.value })} />
            <Input type="number" placeholder="Sug'urta qoplamasi %" value={form.insurance_coverage || ""} onChange={e => setForm({ ...form, insurance_coverage: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(inv => (
          <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Receipt className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">{inv.invoice_number || "—"} • {getPatientName(inv.patient_id)}</p>
                <p className="text-xs text-muted-foreground">{inv.invoice_date} {inv.insurance_company && `• ${inv.insurance_company}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">{Number(inv.total_amount).toLocaleString()} so'm</span>
              {inv.paid_amount > 0 && inv.paid_amount < inv.total_amount && <span className="text-xs text-green-600">({Number(inv.paid_amount).toLocaleString()} to'langan)</span>}
              <Badge className={cn("text-[10px]", statusColors[inv.status] || "bg-muted text-muted-foreground")}>{inv.status}</Badge>
              {inv.status === "pending" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(inv.id, "paid")}><CreditCard className="w-3 h-3 mr-1" /> To'lash</Button>}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(inv); setForm({ patient_id: inv.patient_id, invoice_number: inv.invoice_number, invoice_date: inv.invoice_date, due_date: inv.due_date || "", subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, total_amount: inv.total_amount, paid_amount: inv.paid_amount, payment_method: inv.payment_method, insurance_company: inv.insurance_company, insurance_policy: inv.insurance_policy, insurance_coverage: inv.insurance_coverage, notes: inv.notes }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(inv.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Fakturalar yo'q</p>}
    </div>
  );
};

export default HMSInsurance;
