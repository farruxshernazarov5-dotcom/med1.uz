import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ClickPayButtonProps {
  amount: number;
  purpose: string;
  referenceId?: string;
  returnUrl?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
  disabled?: boolean;
}

/**
 * Click.uz orqali to'lov tugmasi.
 * Foydalanuvchini Click checkout sahifasiga yo'naltiradi.
 */
const ClickPayButton = ({
  amount,
  purpose,
  referenceId,
  returnUrl,
  label = "Click orqali to'lash",
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
}: ClickPayButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!amount || amount <= 0) {
      toast({ title: "Xatolik", description: "Noto'g'ri summa", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("click-create-invoice", {
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
        description: err?.message || "Click bilan bog'lanib bo'lmadi",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={`gap-2 bg-[#00B4E5] hover:bg-[#0098C2] text-white ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      {label}
      {amount > 0 && (
        <span className="ml-1 font-bold">{amount.toLocaleString("uz-UZ")} so'm</span>
      )}
    </Button>
  );
};

export default ClickPayButton;
