import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Banknote, Building2, Copy, CheckCircle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type PaymentMethod = "click" | "payme" | "cash" | "bank";

interface PaymentMethodPickerProps {
  amount: number;
  purpose: string;
  referenceId?: string;
  returnUrl?: string;
  onCashSelected?: () => void;
  onBankSelected?: () => void;
  /** Bank rekvizitlari (klinika sozlamalaridan kelishi mumkin) */
  bankDetails?: {
    bank_name?: string;
    account_number?: string;
    mfo?: string;
    inn?: string;
    recipient?: string;
  };
  /** Faqat ko'rsatilishi kerak bo'lgan usullar */
  allowed?: PaymentMethod[];
  onBeforeConfirm?: (continuePayment: () => void) => void;
  className?: string;
}

const DEFAULT_BANK = {
  bank_name: "Klinika rekvizitlari",
  account_number: "—",
  mfo: "—",
  inn: "—",
  recipient: "—",
};

const PaymentMethodPicker = ({
  amount,
  purpose,
  referenceId,
  returnUrl,
  onCashSelected,
  onBankSelected,
  bankDetails,
  allowed = ["click", "payme", "cash", "bank"],
  onBeforeConfirm,
  className = "",
}: PaymentMethodPickerProps) => {
  const [method, setMethod] = useState<PaymentMethod>(allowed[0]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bank = { ...DEFAULT_BANK, ...(bankDetails || {}) };

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "✅ Nusxalandi", description: text });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOnlinePay = async (provider: "click" | "payme") => {
    if (!amount || amount <= 0) {
      toast({ title: "Xatolik", description: "Noto'g'ri summa", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const fnName = provider === "payme" ? "payme-create-invoice" : "click-create-invoice";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          amount,
          purpose,
          reference_id: referenceId,
          return_url: returnUrl || `${window.location.origin}/payment/success`,
        },
      });
      if (error) {
        const context = "context" in error ? error.context as Response | undefined : undefined;
        const payload = context ? await context.clone().json().catch(() => null) as { error?: string } | null : null;
        throw new Error(payload?.error || (context?.status === 401 ? "To'lov uchun tizimga qayta kiring" : error.message));
      }
      if (!data?.checkout_url) throw new Error("Checkout URL olinmadi");
      window.location.href = data.checkout_url;
    } catch (err: any) {
      toast({
        title: "To'lov xatoligi",
        description: err?.message || `${provider === "payme" ? "Payme" : "Click"} bilan bog'lanib bo'lmadi`,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const runConfirm = () => {
    if (method === "click" || method === "payme") return handleOnlinePay(method);
    if (method === "cash") {
      onCashSelected?.();
      toast({
        title: "💵 Naqd to'lov tanlandi",
        description: "Administrator yoki kassada to'lovni amalga oshiring",
      });
    }
    if (method === "bank") {
      onBankSelected?.();
      toast({
        title: "🏦 Bank o'tkazma tanlandi",
        description: "Rekvizitlar bo'yicha to'lov amalga oshiring",
      });
    }
  };

  const handleConfirm = () => {
    if (onBeforeConfirm) {
      onBeforeConfirm(runConfirm);
      return;
    }
    runConfirm();
  };

  const allMethods: { id: PaymentMethod; label: string; desc: string; icon: any; color: string }[] = [
    { id: "click", label: "Click", desc: "Online to'lov • bir necha soniyada", icon: CreditCard, color: "text-[#00B4E5]" },
    { id: "payme", label: "Payme", desc: "Payme orqali xavfsiz online to'lov", icon: Wallet, color: "text-[#33CCCC]" },
    { id: "cash", label: "Naqd", desc: "Kassa yoki administrator orqali", icon: Banknote, color: "text-green-600" },
    { id: "bank", label: "Bank o'tkazma", desc: "Yuridik shaxslar uchun", icon: Building2, color: "text-blue-600" },
  ];
  const methods = allMethods.filter(m => allowed.includes(m.id));

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h4 className="font-semibold text-foreground mb-3">To'lov usulini tanlang</h4>
        <div className="grid gap-2">
          {methods.map(m => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg bg-muted flex items-center justify-center", m.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.desc}</p>
                </div>
                {active && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {method === "bank" && (
        <div className="bg-muted/50 rounded-xl border border-border p-4 space-y-2 text-sm">
          <p className="font-semibold text-foreground mb-2">🏦 Bank rekvizitlari</p>
          {[
            { label: "Bank", val: bank.bank_name, key: "bank" },
            { label: "Hisob raqam", val: bank.account_number, key: "acc" },
            { label: "MFO", val: bank.mfo, key: "mfo" },
            { label: "INN", val: bank.inn, key: "inn" },
            { label: "Qabul qiluvchi", val: bank.recipient, key: "rec" },
          ].map(r => (
            <div key={r.key} className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0">
              <span className="text-muted-foreground text-xs">{r.label}:</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-foreground text-xs truncate">{r.val}</span>
                {r.val && r.val !== "—" && (
                  <button onClick={() => copy(r.val!, r.key)} className="text-primary hover:opacity-70">
                    {copiedField === r.key ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            💡 To'lov maqsadiga: <span className="font-mono font-semibold">{purpose}{referenceId ? ` #${referenceId}` : ""}</span>
          </p>
        </div>
      )}

      {method === "cash" && (
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-900 p-4 text-sm">
          <p className="font-semibold text-green-800 dark:text-green-300 mb-1">💵 Naqd to'lov tartibi</p>
          <p className="text-green-700 dark:text-green-400 text-xs">
            1. Klinika kassasiga yoki administratorga murojaat qiling<br/>
            2. To'lov ID: <span className="font-mono font-bold">{referenceId || purpose}</span><br/>
            3. Summa: <span className="font-bold">{amount.toLocaleString("uz-UZ")} so'm</span><br/>
            4. Chek olishni unutmang
          </p>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={loading}
        size="lg"
        className={cn(
          "w-full gap-2",
          method === "click" && "bg-[#00B4E5] hover:bg-[#0098C2] text-white",
          method === "payme" && "bg-[#33CCCC] hover:bg-[#2BB3B3] text-white"
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : method === "click" ? (
          <CreditCard className="w-5 h-5" />
        ) : method === "payme" ? (
          <Wallet className="w-5 h-5" />
        ) : method === "cash" ? (
          <Banknote className="w-5 h-5" />
        ) : (
          <Building2 className="w-5 h-5" />
        )}
        {method === "click" && "Click orqali to'lash"}
        {method === "payme" && "Payme orqali to'lash"}
        {method === "cash" && "Naqd to'lovni tasdiqlash"}
        {method === "bank" && "Bank o'tkazmani tasdiqlash"}
        {amount > 0 && (
          <span className="ml-auto font-bold">{amount.toLocaleString("uz-UZ")} so'm</span>
        )}
      </Button>
    </div>
  );
};

export default PaymentMethodPicker;
