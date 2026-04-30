import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dashboard yuqorisida ko'rinadigan banner — Click/Payme to'lovi yakunlanganda
 * URL: /dashboard/...?paid=1&pid=<payment_id>
 */
const PaymentSuccessBanner = () => {
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState<{ amount?: number; purpose?: string } | null>(null);

  const paid = params.get("paid") === "1";
  const pid = params.get("pid");

  useEffect(() => {
    if (!paid) return;
    setVisible(true);

    if (pid) {
      supabase
        .from("platform_payments")
        .select("amount, purpose")
        .eq("id", pid)
        .maybeSingle()
        .then(({ data }) => data && setInfo(data));
    }

    // 12 soniyadan keyin avtomatik yopiladi va URL tozalanadi
    const t = setTimeout(() => handleClose(), 12000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid, pid]);

  const handleClose = () => {
    setVisible(false);
    const next = new URLSearchParams(params);
    next.delete("paid");
    next.delete("pid");
    setParams(next, { replace: true });
  };

  if (!visible || !paid) return null;

  return (
    <div className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 backdrop-blur-sm shadow-lg">
          <div className="flex items-start gap-3 p-4 sm:p-5">
            <div className="shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-foreground text-base sm:text-lg">
                  To'lov muvaffaqiyatli qabul qilindi 🎉
                </h3>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                {info?.amount ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {Number(info.amount).toLocaleString("uz-UZ")} so'm
                    </span>{" "}
                    summasidagi to'lov tasdiqlandi. Xizmat darhol faollashtirildi va keyingi qadamlarni quyidan davom ettirishingiz mumkin.
                  </>
                ) : (
                  <>To'lov tasdiqlandi va xizmat faollashtirildi. Quyidagi bo'limlardan davom eting.</>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="shrink-0 h-8 w-8"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 animate-[shrink_12s_linear_forwards]" style={{ transformOrigin: "left" }} />
        </div>
      </div>
      <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  );
};

export default PaymentSuccessBanner;
