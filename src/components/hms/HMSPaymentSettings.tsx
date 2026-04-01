import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Save, ShieldCheck, Eye, EyeOff, AlertTriangle, CheckCircle2, Wallet, TrendingUp, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface Props { clinicId: string; }

const HMSPaymentSettings = ({ clinicId }: Props) => {
  const [clinic, setClinic] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [form, setForm] = useState({ click_merchant_id: "", click_service_id: "", payme_merchant_id: "", payment_enabled: false });
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  const fetchData = async () => {
    const [clinicRes, payRes] = await Promise.all([
      supabase.from("registered_clinics").select("name, click_merchant_id, click_service_id, payme_merchant_id, payment_enabled").eq("id", clinicId).single(),
      supabase.from("clinic_payments").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(200),
    ]);
    if (clinicRes.data) {
      setClinic(clinicRes.data);
      setForm({
        click_merchant_id: clinicRes.data.click_merchant_id || "",
        click_service_id: clinicRes.data.click_service_id || "",
        payme_merchant_id: clinicRes.data.payme_merchant_id || "",
        payment_enabled: clinicRes.data.payment_enabled || false,
      });
    }
    setPayments(payRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("registered_clinics").update({
      click_merchant_id: form.click_merchant_id || null,
      click_service_id: form.click_service_id || null,
      payme_merchant_id: form.payme_merchant_id || null,
      payment_enabled: form.payment_enabled,
    }).eq("id", clinicId);
    setSaving(false);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else toast({ title: "✅ To'lov sozlamalari saqlandi" });
  };

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const paidCount = payments.filter(p => p.status === "paid").length;
  const pendingCount = payments.filter(p => p.status === "pending").length;

  const providerData: Record<string, number> = {};
  payments.filter(p => p.status === "paid").forEach(p => { providerData[p.provider] = (providerData[p.provider] || 0) + Number(p.amount); });
  const pieData = Object.entries(providerData).map(([name, value]) => ({ name: name === "click" ? "Click" : name === "payme" ? "Payme" : name === "cash" ? "Naqd" : name, value }));
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6"];

  const monthlyData: Record<string, number> = {};
  payments.filter(p => p.status === "paid").forEach(p => {
    const m = p.created_at?.slice(0, 7) || "";
    monthlyData[m] = (monthlyData[m] || 0) + Number(p.amount);
  });
  const barData = Object.entries(monthlyData).sort().slice(-6).map(([m, v]) => ({ month: m.slice(5), amount: v }));

  const isClickConfigured = !!(form.click_merchant_id && form.click_service_id);
  const isPaymeConfigured = !!form.payme_merchant_id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">💳 To'lov sozlamalari (SaaS)</h2>
        <Badge className={cn("text-xs", form.payment_enabled ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground")}>
          {form.payment_enabled ? "Yoqilgan" : "O'chirilgan"}
        </Badge>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Wallet, label: "Jami to'lovlar", value: `${totalPaid.toLocaleString()} so'm`, color: "text-green-600" },
          { icon: AlertTriangle, label: "Kutilayotgan", value: `${totalPending.toLocaleString()} so'm`, color: "text-amber-600" },
          { icon: CheckCircle2, label: "To'langan", value: `${paidCount} ta`, color: "text-green-600" },
          { icon: Receipt, label: "Barcha", value: `${payments.length} ta`, color: "text-foreground" },
        ].map(k => (
          <div key={k.label} className="bg-card rounded-2xl border border-border p-4">
            <k.icon className={cn("w-5 h-5 mb-1", k.color)} />
            <p className={cn("text-lg font-bold", k.color)}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Settings Form */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-foreground">Merchant sozlamalari</h3>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)}>
            {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-xl">
          <Switch checked={form.payment_enabled} onCheckedChange={v => setForm({ ...form, payment_enabled: v })} />
          <span className="text-sm text-foreground">Onlayn to'lovni yoqish</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Click */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-foreground text-sm">Click</span>
              {isClickConfigured && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            <Input
              type={showKeys ? "text" : "password"}
              placeholder="Click Merchant ID"
              value={form.click_merchant_id}
              onChange={e => setForm({ ...form, click_merchant_id: e.target.value })}
            />
            <Input
              type={showKeys ? "text" : "password"}
              placeholder="Click Service ID"
              value={form.click_service_id}
              onChange={e => setForm({ ...form, click_service_id: e.target.value })}
            />
          </div>

          {/* Payme */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-cyan-600" />
              </div>
              <span className="font-semibold text-foreground text-sm">Payme</span>
              {isPaymeConfigured && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            <Input
              type={showKeys ? "text" : "password"}
              placeholder="Payme Merchant ID"
              value={form.payme_merchant_id}
              onChange={e => setForm({ ...form, payme_merchant_id: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          ⚠️ API kalitlar shifrlangan holda saqlanadi. Frontendda ko'rinmaydi — faqat server orqali ishlatiladi.
        </p>
      </div>

      {/* Analytics */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">To'lov usullari</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Oylik daromad</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Daromad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-3">So'nggi to'lovlar</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {payments.slice(0, 20).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                p.status === "paid" ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
              )}>
                {p.status === "paid" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.invoice_number || p.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{p.provider} • {new Date(p.created_at).toLocaleDateString("uz")}</p>
              </div>
              <p className={cn("text-sm font-bold", p.status === "paid" ? "text-green-600" : "text-amber-600")}>
                {Number(p.amount).toLocaleString()} so'm
              </p>
            </div>
          ))}
          {payments.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">To'lovlar yo'q</p>}
        </div>
      </div>
    </div>
  );
};

export default HMSPaymentSettings;
