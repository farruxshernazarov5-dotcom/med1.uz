import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Shield, Plus, FileText, CheckCircle2, XCircle, Clock, DollarSign,
  TrendingUp, Building2, Search, Filter, Edit, Trash2, FileCheck
} from "lucide-react";
import ICDSearch from "./ICDSearch";

interface Props {
  ownerId: string;
  module: "clinic" | "dental" | "diagnostics" | "maternity" | "cosmetology" | "doctor";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  partial: "bg-purple-100 text-purple-700 border-purple-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  expired: "bg-gray-100 text-gray-700 border-gray-200",
  suspended: "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda", approved: "Tasdiqlandi", rejected: "Rad etildi",
  paid: "To'landi", partial: "Qisman", active: "Faol", expired: "Tugagan", suspended: "To'xtatilgan",
};

type Tab = "dashboard" | "claims" | "policies" | "companies" | "analytics";

const InsuranceModule = ({ ownerId, module }: Props) => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [companies, setCompanies] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, pending: 0, approved: 0, rejected: 0, paid: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Dialogs
  const [policyOpen, setPolicyOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState<any>(null);

  const [policyForm, setPolicyForm] = useState<any>({
    company_id: "", patient_name: "", patient_phone: "", policy_number: "",
    policy_type: "voluntary", coverage_pct: 70, max_amount: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
    status: "active", notes: "",
  });
  const [claimForm, setClaimForm] = useState<any>({
    policy_id: "", patient_name: "", service_name: "", service_date: new Date().toISOString().split("T")[0],
    diagnosis_text: "", icd_code: "", total_amount: "", coverage_pct: 70, notes: "",
  });
  const [companyForm, setCompanyForm] = useState<any>({
    name: "", legal_name: "", inn: "", license_number: "", contact_phone: "",
    contact_email: "", contact_person: "", address: "", default_coverage_pct: 70, is_active: true,
  });
  const [splitForm, setSplitForm] = useState<any>({ payer_type: "insurance", amount: "", payment_method: "bank", reference_number: "" });

  const load = async () => {
    setLoading(true);
    const [c, p, cl] = await Promise.all([
      supabase.from("insurance_companies").select("*").order("name"),
      supabase.from("insurance_policies").select("*, insurance_companies(name)").eq("owner_id", ownerId).order("created_at", { ascending: false }),
      supabase.from("insurance_claims").select("*, insurance_companies(name), insurance_policies(policy_number)").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(200),
    ]);
    const cls = cl.data || [];
    setCompanies(c.data || []);
    setPolicies(p.data || []);
    setClaims(cls);
    setStats({
      total: cls.length,
      active: (p.data || []).filter((x) => x.status === "active").length,
      pending: cls.filter((x: any) => x.status === "pending").length,
      approved: cls.filter((x: any) => x.status === "approved").length,
      rejected: cls.filter((x: any) => x.status === "rejected").length,
      paid: cls.filter((x: any) => x.status === "paid").length,
      revenue: cls.filter((x: any) => x.status === "paid").reduce((s: number, x: any) => s + Number(x.paid_amount || 0), 0),
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [ownerId]);

  // ----- Save handlers -----
  const savePolicy = async () => {
    if (!policyForm.patient_name || !policyForm.policy_number) {
      toast({ title: "Bemor va polis raqami majburiy", variant: "destructive" }); return;
    }
    const payload = { ...policyForm, owner_id: ownerId, module, max_amount: policyForm.max_amount ? Number(policyForm.max_amount) : null, coverage_pct: Number(policyForm.coverage_pct) };
    const { error } = await supabase.from("insurance_policies").insert(payload);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Polis qo'shildi" }); setPolicyOpen(false); load(); }
  };

  const saveClaim = async () => {
    if (!claimForm.patient_name || !claimForm.total_amount) {
      toast({ title: "Bemor va summa majburiy", variant: "destructive" }); return;
    }
    const total = Number(claimForm.total_amount);
    const cov = Number(claimForm.coverage_pct);
    const insurance_amount = (total * cov) / 100;
    const patient_amount = total - insurance_amount;
    const policy = policies.find((p) => p.id === claimForm.policy_id);
    const { error } = await supabase.from("insurance_claims").insert({
      ...claimForm,
      owner_id: ownerId,
      module,
      company_id: policy?.company_id || null,
      total_amount: total,
      insurance_amount,
      patient_amount,
      created_by: ownerId,
    });
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Claim yaratildi" }); setClaimOpen(false); load(); }
  };

  const saveCompany = async () => {
    if (!companyForm.name) { toast({ title: "Nom majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("insurance_companies").insert({ ...companyForm, created_by: ownerId });
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Kompaniya qo'shildi" }); setCompanyOpen(false); load(); }
  };

  const updateClaimStatus = async (id: string, status: string, reason?: string) => {
    const upd: any = { status, reviewed_at: new Date().toISOString() };
    if (status === "rejected" && reason) upd.rejection_reason = reason;
    if (status === "approved") upd.approved_amount = claims.find(c => c.id === id)?.insurance_amount;
    const { error } = await supabase.from("insurance_claims").update(upd).eq("id", id);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: `✅ ${STATUS_LABEL[status]}` }); load(); }
  };

  const addSplit = async () => {
    if (!splitOpen || !splitForm.amount) return;
    const { error } = await supabase.from("insurance_payment_splits").insert({
      claim_id: splitOpen.id, owner_id: ownerId,
      payer_type: splitForm.payer_type, amount: Number(splitForm.amount),
      payment_method: splitForm.payment_method, reference_number: splitForm.reference_number,
    });
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ To'lov qo'shildi" }); setSplitOpen(null); setSplitForm({ payer_type: "insurance", amount: "", payment_method: "bank", reference_number: "" }); load(); }
  };

  const deleteClaim = async (id: string) => {
    if (!confirm("Claim o'chirilsinmi?")) return;
    const { error } = await supabase.from("insurance_claims").delete().eq("id", id);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "🗑️ O'chirildi" }); load(); }
  };

  const filteredClaims = claims.filter((c) => {
    const matchQ = !filter || (c.patient_name?.toLowerCase().includes(filter.toLowerCase()) || c.claim_number?.toLowerCase().includes(filter.toLowerCase()) || c.icd_code?.toLowerCase().includes(filter.toLowerCase()));
    const matchS = !statusFilter || c.status === statusFilter;
    return matchQ && matchS;
  });

  const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(n) + " so'm";

  // -------- RENDER --------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Sug'urta tizimi</h2>
              <p className="text-sm text-white/80">Polislar, claimlar, ICD kodlar va to'lovlar</p>
            </div>
          </div>
          <Button onClick={() => setClaimOpen(true)} className="bg-white text-blue-700 hover:bg-white/90">
            <Plus className="w-4 h-4 mr-1" /> Yangi claim
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["dashboard", "Dashboard", TrendingUp],
          ["claims", "Claimlar", FileText],
          ["policies", "Polislar", Shield],
          ["companies", "Kompaniyalar", Building2],
          ["analytics", "Tahlil", DollarSign],
        ] as [Tab, string, any][]).map(([k, l, I]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === k ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            <I className="w-4 h-4" /> {l}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Faol polislar", value: stats.active, icon: Shield, color: "from-emerald-500 to-teal-500" },
            { label: "Kutilmoqda", value: stats.pending, icon: Clock, color: "from-amber-500 to-orange-500" },
            { label: "Tasdiqlangan", value: stats.approved, icon: CheckCircle2, color: "from-blue-500 to-indigo-500" },
            { label: "To'langan", value: stats.paid, icon: DollarSign, color: "from-purple-500 to-pink-500" },
            { label: "Rad etilgan", value: stats.rejected, icon: XCircle, color: "from-red-500 to-rose-500" },
            { label: "Jami claim", value: stats.total, icon: FileText, color: "from-slate-500 to-gray-600" },
            { label: "Daromad", value: fmt(stats.revenue), icon: TrendingUp, color: "from-green-500 to-emerald-600", wide: true },
          ].map((s, i) => (
            <div key={i} className={`bg-card rounded-2xl border border-border p-4 ${s.wide ? "col-span-2" : ""}`}>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* CLAIMS */}
      {tab === "claims" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Bemor / claim # / ICD..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Barcha statuslar</option>
              {Object.entries(STATUS_LABEL).filter(([k]) => ["pending","approved","rejected","paid","partial"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {loading ? <p className="text-center py-8 text-muted-foreground">Yuklanmoqda...</p> : filteredClaims.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /> Claimlar topilmadi
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClaims.map((c) => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">{c.claim_number}</span>
                        <Badge className={STATUS_COLORS[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                        {c.icd_code && <Badge variant="outline" className="font-mono text-xs">{c.icd_code}</Badge>}
                      </div>
                      <p className="font-semibold text-foreground mt-1">{c.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{c.service_name || "—"} • {c.diagnosis_text || "—"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.insurance_companies?.name || "Kompaniya yo'q"} • {new Date(c.service_date).toLocaleDateString("uz-UZ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{fmt(Number(c.total_amount))}</p>
                      <p className="text-xs text-blue-600">Sug'urta: {fmt(Number(c.insurance_amount))}</p>
                      <p className="text-xs text-amber-600">Bemor: {fmt(Number(c.patient_amount))}</p>
                      {Number(c.paid_amount) > 0 && <p className="text-xs text-emerald-600">To'langan: {fmt(Number(c.paid_amount))}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                    {c.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => updateClaimStatus(c.id, "approved")}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Tasdiqlash
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => {
                          const r = prompt("Rad etish sababi:"); if (r) updateClaimStatus(c.id, "rejected", r);
                        }}>
                          <XCircle className="w-3 h-3 mr-1" /> Rad etish
                        </Button>
                      </>
                    )}
                    {(c.status === "approved" || c.status === "partial") && (
                      <Button size="sm" variant="outline" onClick={() => setSplitOpen(c)}>
                        <DollarSign className="w-3 h-3 mr-1" /> To'lov qo'shish
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteClaim(c.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POLICIES */}
      {tab === "policies" && (
        <div className="space-y-3">
          <Button onClick={() => setPolicyOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <Plus className="w-4 h-4 mr-1" /> Yangi polis
          </Button>
          {policies.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" /> Polislar yo'q
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {policies.map((p) => (
                <div key={p.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <Badge className={STATUS_COLORS[p.status]}>{STATUS_LABEL[p.status] || p.status}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{p.policy_number}</span>
                  </div>
                  <p className="font-semibold mt-2">{p.patient_name}</p>
                  <p className="text-sm text-muted-foreground">{p.insurance_companies?.name || "—"}</p>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-muted-foreground">Qamrov: <strong className="text-foreground">{p.coverage_pct}%</strong></span>
                    <span className="text-muted-foreground">{new Date(p.start_date).toLocaleDateString("uz-UZ")} → {new Date(p.end_date).toLocaleDateString("uz-UZ")}</span>
                  </div>
                  {p.max_amount && <p className="text-xs text-muted-foreground mt-1">Max: {fmt(Number(p.max_amount))}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPANIES */}
      {tab === "companies" && (
        <div className="space-y-3">
          <Button onClick={() => setCompanyOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <Plus className="w-4 h-4 mr-1" /> Yangi kompaniya
          </Button>
          {companies.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" /> Kompaniyalar yo'q
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {companies.map((c) => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    {c.is_active ? <Badge className={STATUS_COLORS.active}>Faol</Badge> : <Badge variant="outline">Nofaol</Badge>}
                  </div>
                  <p className="font-semibold mt-2">{c.name}</p>
                  {c.contact_phone && <p className="text-sm text-muted-foreground">{c.contact_phone}</p>}
                  {c.contact_email && <p className="text-sm text-muted-foreground">{c.contact_email}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Standart qamrov: <strong className="text-foreground">{c.default_coverage_pct}%</strong></p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "analytics" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Kompaniyalar bo'yicha statistika</h3>
            {companies.length === 0 ? <p className="text-muted-foreground">Ma'lumot yo'q</p> : (
              <div className="space-y-2">
                {companies.map((co) => {
                  const cClaims = claims.filter((cl) => cl.company_id === co.id);
                  const cRev = cClaims.filter((cl) => cl.status === "paid").reduce((s, cl) => s + Number(cl.paid_amount || 0), 0);
                  const cRej = cClaims.filter((cl) => cl.status === "rejected").length;
                  return (
                    <div key={co.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{co.name}</p>
                        <p className="text-xs text-muted-foreground">{cClaims.length} claim • {cRej} rad etilgan</p>
                      </div>
                      <p className="font-bold text-emerald-600">{fmt(cRev)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Dialogs ===== */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Yangi sug'urta polisi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sug'urta kompaniyasi</Label>
              <select value={policyForm.company_id} onChange={(e) => setPolicyForm({ ...policyForm, company_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Tanlang...</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Bemor F.I.Sh *</Label><Input value={policyForm.patient_name} onChange={(e) => setPolicyForm({ ...policyForm, patient_name: e.target.value })} /></div>
              <div><Label>Telefon</Label><Input value={policyForm.patient_phone} onChange={(e) => setPolicyForm({ ...policyForm, patient_phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Polis raqami *</Label><Input value={policyForm.policy_number} onChange={(e) => setPolicyForm({ ...policyForm, policy_number: e.target.value })} /></div>
              <div>
                <Label>Polis turi</Label>
                <select value={policyForm.policy_type} onChange={(e) => setPolicyForm({ ...policyForm, policy_type: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="voluntary">Ixtiyoriy</option>
                  <option value="mandatory">Majburiy</option>
                  <option value="corporate">Korporativ</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Qamrov %</Label><Input type="number" min="0" max="100" value={policyForm.coverage_pct} onChange={(e) => setPolicyForm({ ...policyForm, coverage_pct: e.target.value })} /></div>
              <div><Label>Max summa (so'm)</Label><Input type="number" value={policyForm.max_amount} onChange={(e) => setPolicyForm({ ...policyForm, max_amount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Boshlanish</Label><Input type="date" value={policyForm.start_date} onChange={(e) => setPolicyForm({ ...policyForm, start_date: e.target.value })} /></div>
              <div><Label>Tugash</Label><Input type="date" value={policyForm.end_date} onChange={(e) => setPolicyForm({ ...policyForm, end_date: e.target.value })} /></div>
            </div>
            <Button onClick={savePolicy} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Yangi claim yaratish</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sug'urta polisi</Label>
              <select value={claimForm.policy_id} onChange={(e) => {
                const pol = policies.find((p) => p.id === e.target.value);
                setClaimForm({ ...claimForm, policy_id: e.target.value, patient_name: pol?.patient_name || claimForm.patient_name, coverage_pct: pol?.coverage_pct || 70 });
              }} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Polis bo'lmasdan...</option>
                {policies.filter(p => p.status === "active").map((p) => <option key={p.id} value={p.id}>{p.policy_number} — {p.patient_name}</option>)}
              </select>
            </div>
            <div><Label>Bemor F.I.Sh *</Label><Input value={claimForm.patient_name} onChange={(e) => setClaimForm({ ...claimForm, patient_name: e.target.value })} /></div>
            <div><Label>Xizmat nomi</Label><Input value={claimForm.service_name} onChange={(e) => setClaimForm({ ...claimForm, service_name: e.target.value })} /></div>
            <div>
              <Label>Tashxis (ICD-10)</Label>
              <ICDSearch
                value={claimForm.icd_code ? { code: claimForm.icd_code, name: claimForm.diagnosis_text } : null}
                onChange={(v) => setClaimForm({ ...claimForm, icd_code: v?.code || "", diagnosis_text: v?.name || claimForm.diagnosis_text })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Sana</Label><Input type="date" value={claimForm.service_date} onChange={(e) => setClaimForm({ ...claimForm, service_date: e.target.value })} /></div>
              <div><Label>Summa (so'm) *</Label><Input type="number" value={claimForm.total_amount} onChange={(e) => setClaimForm({ ...claimForm, total_amount: e.target.value })} /></div>
            </div>
            <div>
              <Label>Sug'urta qamrovi: {claimForm.coverage_pct}%</Label>
              <input type="range" min="0" max="100" value={claimForm.coverage_pct} onChange={(e) => setClaimForm({ ...claimForm, coverage_pct: e.target.value })} className="w-full mt-2" />
              {claimForm.total_amount && (
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-blue-600">Sug'urta: {fmt(Number(claimForm.total_amount) * Number(claimForm.coverage_pct) / 100)}</span>
                  <span className="text-amber-600">Bemor: {fmt(Number(claimForm.total_amount) * (100 - Number(claimForm.coverage_pct)) / 100)}</span>
                </div>
              )}
            </div>
            <div><Label>Izoh</Label><Textarea rows={2} value={claimForm.notes} onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })} /></div>
            <Button onClick={saveClaim} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">Claim yaratish</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={companyOpen} onOpenChange={setCompanyOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Yangi sug'urta kompaniyasi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Kompaniya nomi *</Label><Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>INN</Label><Input value={companyForm.inn} onChange={(e) => setCompanyForm({ ...companyForm, inn: e.target.value })} /></div>
              <div><Label>Litsenziya</Label><Input value={companyForm.license_number} onChange={(e) => setCompanyForm({ ...companyForm, license_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Telefon</Label><Input value={companyForm.contact_phone} onChange={(e) => setCompanyForm({ ...companyForm, contact_phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={companyForm.contact_email} onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })} /></div>
            </div>
            <div><Label>Aloqa shaxsi</Label><Input value={companyForm.contact_person} onChange={(e) => setCompanyForm({ ...companyForm, contact_person: e.target.value })} /></div>
            <div><Label>Standart qamrov %</Label><Input type="number" min="0" max="100" value={companyForm.default_coverage_pct} onChange={(e) => setCompanyForm({ ...companyForm, default_coverage_pct: e.target.value })} /></div>
            <Button onClick={saveCompany} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!splitOpen} onOpenChange={() => setSplitOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>To'lov qo'shish — {splitOpen?.claim_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>To'lovchi</Label>
              <select value={splitForm.payer_type} onChange={(e) => setSplitForm({ ...splitForm, payer_type: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="insurance">Sug'urta kompaniyasi</option>
                <option value="patient">Bemor</option>
              </select>
            </div>
            <div><Label>Summa</Label><Input type="number" value={splitForm.amount} onChange={(e) => setSplitForm({ ...splitForm, amount: e.target.value })} /></div>
            <div>
              <Label>To'lov usuli</Label>
              <select value={splitForm.payment_method} onChange={(e) => setSplitForm({ ...splitForm, payment_method: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="bank">Bank o'tkazma</option>
                <option value="cash">Naqd</option>
                <option value="card">Karta</option>
                <option value="click">Click</option>
                <option value="payme">Payme</option>
              </select>
            </div>
            <div><Label>Hujjat raqami</Label><Input value={splitForm.reference_number} onChange={(e) => setSplitForm({ ...splitForm, reference_number: e.target.value })} /></div>
            <Button onClick={addSplit} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">Qo'shish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InsuranceModule;
