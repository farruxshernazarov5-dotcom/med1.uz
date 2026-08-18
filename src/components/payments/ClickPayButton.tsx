import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ClickPayButtonProps {
  /** payment_packages.code — summa serverda shu paketdan olinadi */
  packageCode: string;
  amount?: number;
  returnUrl?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
  disabled?: boolean;
}

/**
 * Click.uz orqali to'lov tugmasi.
 * Frontend summa yubormaydi — faqat package_code; narx server tomonda aniqlanadi.
 */
const ClickPayButton = ({
  packageCode,
  amount,
  returnUrl,
  label,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
}: ClickPayButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: t("payments.authRequiredTitle", "Tizimga kiring"),
          description: t("payments.authRequired", "To'lov qilish uchun avval tizimga kiring."),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("click-create-invoice", {
        body: {
          package_code: packageCode,
          return_url: returnUrl || `${window.location.origin}/payment/success`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.checkout_url) throw new Error("Checkout URL olinmadi");
      window.location.href = data.checkout_url;
    } catch (err: any) {
      toast({
        title: t("payments.errorTitle", "To'lov xatoligi"),
        description: err?.message || t("payments.errorDesc", "Click bilan bog'lanib bo'lmadi"),
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
      className={`gap-2 bg-[#00B4E5] hover:bg-[#0098C2] text-primary-foreground ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      {label || t("payments.payWithClick", "Click orqali to'lash")}
      {!!amount && amount > 0 && (
        <span className="ml-1 font-bold">{amount.toLocaleString("uz-UZ")} so'm</span>
      )}
    </Button>
  );
};

export default ClickPayButton;
