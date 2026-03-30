import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, Receipt, CreditCard, Shield, Building, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props { clinicId: string; }

const HMSInsurance = ({ clinicId }: Props) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<"invoices" | "companies" | "claims">("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
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

  const searchFiltered = invoices.filter(i => {
    const matchSearch = !search || getPatientName(i.patient_id).toLowerCase().includes(search.toLowerCase()) || i.invoice_number?.toLowerCase().includes(search.toLowerCase()) || i.insurance_company?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === "all" || i.status === filter;
    return matchSearch && matchStatus;
  });

  const insuredInvoices = invoices.filter(i => i.insurance_company);
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const totalDebt = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);
  const insuranceCoverage = insuredInvoices.reduce((s, i) => s + Number(i.total_amount || 0) * (Number(i.insurance_coverage || 0) / 100), 0);

  const companies = Array.from(new Set(insuredInvoices.map(i => i.insurance_company).filter(Boolean)));
  const companyStats = companies.map(c => ({
    name: c,
    count: insuredInvoices.filter(i => i.insurance_company === c).length,
    total: insuredInvoices.filter(i => i.insurance_company === c).reduce((s, i) => s + Number(i.total_amount || 0), 0)
  }));

  const statusPie = [
    { name: "To'langan", value: invoices.filter(i => i.status === "paid").length },
    { name: "Kutilmoqda", value: invoices.filter(i => i.status === "pending").length },
    { name: "Qisman", value: invoices.filter(i => i.status === "partial").length },
    { name: "Muddati o'tgan", value: invoices.filter(i => i.status === "overdue").length },
  ].filter(d => d.value > 0);
  const PIE_COLORS = ["hsl(var(--primary))", "#eab308", "#3b82f6", "hsl(var(--destructive))"];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800",
    partial: "bg-blue-100 text-blue-800", overdue: "bg-red-100 text-red-800", cancelled: "bg-muted text-muted-foreground"
  };
  const statusLabels: Record<string, string> = { pending: "Kutilmoqda", paid: "To'langan", partial: "Qisman", overdue: "Muddati o'tgan", cancelled: "Bekor" };

  if (selectedInvoice) {
    const inv = selectedInvoice;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)} className="mb-4">← Orqaga</Button>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Receipt className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">{inv.invoice_number}</h2>
              <p className="text-sm text-muted-foreground">{getPatientName(inv.patient_id)} • {inv.invoice_date}</p>
            </div>
            <Badge className={cn("ml-auto", statusColors[inv.status])}>{statusLabels[inv.status] || inv.status}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Jami summa</p>
              <p className="text-xl font-bold text-foreground">{Number(inv.total_amount).toLocaleString()} so'm</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">To'langan</p>
              <p className="text-xl font-bold text-green-600">{Number(inv.paid_amount).toLocaleString()} so'm</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Qoldiq</p>
              <p className="text-xl font-bold text-destructive">{(Number(inv.total_amount) - Number(inv.paid_amount)).toLocaleString()} so'm</p>
            </div>
          </div>

          {inv.insurance_company && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2"><Shield className="w-4 h-4" /> Sug'urta ma'lumotlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <p><span className="text-muted-foreground">Kompaniya:</span> <span className="font-medium">{inv.insurance_company}</span></p>
                <p><span className="text-muted-foreground">Polis:</span> <span className="font-medium">{inv.insurance_policy || "—"}</span></p>
                <p><span className="text-muted-foreground">Qoplama:</span> <span className="font-medium">{inv.insurance_coverage}%</span></p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {inv.status === "pending" && <Button size="sm" onClick={() => { updateStatus(inv.id, "paid"); setSelectedInvoice({ ...inv, status: "paid" }); }}><CreditCard className="w-4 h-4 mr-1" /> To'lash</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Moliya & Sug'urta</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi faktura</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Jami fakturalar</p>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Tushumlar</p>
          <p className="text-lg font-bold text-green-600">{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Qarzdorlik</p>
          <p className="text-lg font-bold text-destructive">{totalDebt.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Sug'urta qoplama</p>
          <p className="text-lg font-bold text-primary">{insuranceCoverage.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Sug'urtalangan</p>
          <p className="text-2xl font-bold text-foreground">{insuredInvoices.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([["invoices", "📄 Fakturalar"], ["companies", "🏢 Kompaniyalar"], ["claims", "📋 Claimlar"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveView(id)} className={cn("px-4 py-2 text-xs rounded-full", activeView === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{label}</button>
        ))}
      </div>

      {/* Companies view */}
      {activeView === "companies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {statusPie.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground text-sm mb-3">To'lov statuslari</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value as number}`}>
                    {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Sug'urta kompaniyalari</h3>
            <div className="space-y-3">
              {companyStats.map(c => (
                <div key={c.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.count} ta faktura</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary text-sm">{c.total.toLocaleString()}</p>
                </div>
              ))}
              {companyStats.length === 0 && <p className="text-sm text-muted-foreground">Sug'urta kompaniyalari yo'q</p>}
            </div>
          </div>
        </div>
      )}

      {/* Claims view */}
      {activeView === "claims" && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Sug'urta talablari (Claims)</h3>
          <div className="space-y-2">
            {insuredInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted" onClick={() => setSelectedInvoice(inv)}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{inv.invoice_number} • {getPatientName(inv.patient_id)}</p>
                    <p className="text-xs text-muted-foreground">{inv.insurance_company} — Polis: {inv.insurance_policy || "—"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground text-sm">{Number(inv.total_amount).toLocaleString()} so'm</p>
                  <p className="text-xs text-primary">Qoplama: {inv.insurance_coverage}%</p>
                </div>
              </div>
            ))}
            {insuredInvoices.length === 0 && <p className="text-sm text-muted-foreground">Sug'urta claimlari yo'q</p>}
          </div>
        </div>
      )}

      {/* Invoices view */}
      {activeView === "invoices" && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {[{ id: "all", label: "Barchasi" }, { id: "pending", label: "Kutilmoqda" }, { id: "paid", label: "To'langan" }, { id: "partial", label: "Qisman" }, { id: "overdue", label: "Muddati o'tgan" }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
            ))}
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
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
            {searchFiltered.map(inv => (
              <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedInvoice(inv)}>
                <div className="flex items-center gap-3 flex-1">
                  <Receipt className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{inv.invoice_number || "—"} • {getPatientName(inv.patient_id)}</p>
                    <p className="text-xs text-muted-foreground">{inv.invoice_date} {inv.insurance_company && `• 🛡 ${inv.insurance_company}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  <span className="text-sm font-bold text-foreground">{Number(inv.total_amount).toLocaleString()} so'm</span>
                  {inv.paid_amount > 0 && inv.paid_amount < inv.total_amount && <span className="text-xs text-green-600">({Number(inv.paid_amount).toLocaleString()} to'langan)</span>}
                  <Badge className={cn("text-[10px]", statusColors[inv.status] || "bg-muted text-muted-foreground")}>{statusLabels[inv.status] || inv.status}</Badge>
                  {inv.status === "pending" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(inv.id, "paid")}><CreditCard className="w-3 h-3 mr-1" /> To'lash</Button>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(inv); setForm({ patient_id: inv.patient_id, invoice_number: inv.invoice_number, invoice_date: inv.invoice_date, due_date: inv.due_date || "", subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, total_amount: inv.total_amount, paid_amount: inv.paid_amount, payment_method: inv.payment_method, insurance_company: inv.insurance_company, insurance_policy: inv.insurance_policy, insurance_coverage: inv.insurance_coverage, notes: inv.notes }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(inv.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
          {searchFiltered.length === 0 && <p className="text-center py-8 text-muted-foreground">Fakturalar yo'q</p>}
        </>
      )}
    </div>
  );
};

export default HMSInsurance;