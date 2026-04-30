import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle2, Clock, XCircle, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";

const PatientPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [clinic, dental] = await Promise.all([
        supabase.from("clinic_payments").select("*, registered_clinics(name)").eq("patient_id", user.id).order("created_at", { ascending: false }),
        supabase.from("dental_transactions").select("*, registered_dental_clinics(name)").eq("patient_id", user.id).order("created_at", { ascending: false }),
      ]);
      const combined = [
        ...(clinic.data || []).map(p => ({ ...p, _src: "Klinika", _name: (p as any).registered_clinics?.name, _amount: p.amount, _status: p.status, _date: p.created_at, _invoice: p.invoice_number })),
        ...(dental.data || []).map(p => ({ ...p, _src: "Stomatologiya", _name: (p as any).registered_dental_clinics?.name, _amount: p.total_amount, _status: p.status, _date: p.created_at, _invoice: p.invoice_number })),
      ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
      setPayments(combined);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const filtered = payments.filter(p => {
    if (filter === "paid") return p._status === "paid" || p._status === "completed";
    if (filter === "pending") return p._status === "pending" || p._status === "unpaid" || p._status === "partial";
    return true;
  });

  const totalPaid = payments.filter(p => p._status === "paid" || p._status === "completed").reduce((s, p) => s + Number(p._amount || 0), 0);
  const totalDebt = payments.filter(p => p._status === "unpaid" || p._status === "pending" || p._status === "partial").reduce((s, p) => s + Number(p._amount || 0), 0);

  const statusInfo = (s: string) => {
    if (s === "paid" || s === "completed") return { icon: CheckCircle2, color: "text-green-600 bg-green-500/10", label: "To'langan" };
    if (s === "partial") return { icon: Clock, color: "text-amber-600 bg-amber-500/10", label: "Qisman" };
    if (s === "pending" || s === "unpaid") return { icon: Clock, color: "text-orange-600 bg-orange-500/10", label: "Kutilmoqda" };
    return { icon: XCircle, color: "text-red-600 bg-red-500/10", label: "Bekor qilingan" };
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">💰 To'lovlar</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-xs text-muted-foreground">To'langan</span></div>
          <p className="text-xl font-bold text-foreground">{totalPaid.toLocaleString("uz-UZ")} so'm</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs text-muted-foreground">Qarzdorlik</span></div>
          <p className="text-xl font-bold text-foreground">{totalDebt.toLocaleString("uz-UZ")} so'm</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "paid", "pending"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f === "all" ? "Barchasi" : f === "paid" ? "To'langan" : "Qarz"}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> :
        filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">To'lovlar tarixi bo'sh</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => {
              const s = statusInfo(p._status);
              return (
                <div key={`${p._src}-${p.id}`} className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p._name || "—"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{p._src}</span>
                          {p._invoice && <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5"><Receipt className="w-2.5 h-2.5" /> {p._invoice}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(p._date).toLocaleDateString("uz-UZ")} • {s.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">{Number(p._amount).toLocaleString("uz-UZ")}</p>
                      <p className="text-[10px] text-muted-foreground">so'm</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
};

export default PatientPayments;
