import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Smartphone, CheckCircle2, Loader2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface QRPayButtonProps {
  amount?: number;
  purpose?: string;
  referenceId?: string;
  returnUrl?: string;
  label?: string;
  description?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const PRESETS = [10000, 25000, 50000, 100000];

/**
 * Tezkor QR to'lov — Payme GET usuli bo'yicha checkout link
 * (https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get).
 * Link serverda (payme-create-invoice) yasaladi — merchant ID va kalitlar mijozga chiqmaydi.
 */
const QRPayButton = ({
  amount,
  purpose = "quick_payment",
  referenceId,
  returnUrl,
  label = "QR orqali to'lash",
  description = "Telefoningiz bilan QR-kodni skanerlang",
  variant = "default",
  size = "default",
  className = "",
}: QRPayButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(amount ?? null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const reset = useCallback(() => {
    setQrDataUrl(null);
    setCheckoutUrl(null);
    if (amount === undefined) setSelected(null);
  }, [amount]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const finalAmount = selected ?? (custom ? Number(custom) : 0);

  const generate = async () => {
    if (!finalAmount || finalAmount < 1000) {
      toast({ title: "Summani tanlang", description: "Eng kam summa 1 000 so'm", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("payme-create-invoice", {
        body: {
          amount: finalAmount,
          purpose,
          reference_id: referenceId,
          lang: "uz",
          return_url: returnUrl || `${window.location.origin}/payment/success`,
        },
      });
      if (error) {
        const context = "context" in error ? (error.context as Response | undefined) : undefined;
        const payload = context ? ((await context.clone().json().catch(() => null)) as { error?: string } | null) : null;
        throw new Error(payload?.error || (context?.status === 401 ? "To'lov uchun tizimga kiring" : error.message));
      }
      if (!data?.checkout_url) throw new Error("Checkout link olinmadi");

      const png = await QRCode.toDataURL(data.checkout_url, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#0A2540", light: "#FFFFFF" },
      });
      setCheckoutUrl(data.checkout_url);
      setQrDataUrl(png);
    } catch (err: any) {
      toast({
        title: "QR yaratilmadi",
        description: err?.message || "Payme bilan bog'lanib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`gap-2 ${className}`}>
          <QrCode className="w-4 h-4" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <QrCode className="w-5 h-5 text-primary" />
            QR-kod to'lovi
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-2">
          {/* Summa tanlash */}
          {amount === undefined && !qrDataUrl && (
            <div className="w-full space-y-3 mb-4">
              <p className="text-xs text-muted-foreground">To'lov summasini tanlang</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={selected === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelected(p);
                      setCustom("");
                    }}
                  >
                    {p.toLocaleString("uz-UZ")} so'm
                  </Button>
                ))}
              </div>
              <Input
                inputMode="numeric"
                placeholder="Boshqa summa (so'm)"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value.replace(/\D/g, ""));
                  setSelected(null);
                }}
              />
            </div>
          )}

          {/* QR maydoni */}
          <div className="relative w-56 h-56 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-4 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Payme to'lov QR-kodi" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <div className="text-center">
                {loading ? (
                  <Loader2 className="w-16 h-16 text-primary/60 mx-auto animate-spin" strokeWidth={1.5} />
                ) : (
                  <QrCode className="w-32 h-32 text-primary/40 mx-auto" strokeWidth={1} />
                )}
                <p className="text-[10px] text-muted-foreground mt-2">
                  {loading ? "QR generatsiya qilinmoqda" : "Summani tanlab QR yarating"}
                </p>
              </div>
            )}
            <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
          </div>

          {finalAmount > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">To'lov summasi</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {finalAmount.toLocaleString("uz-UZ")} so'm
              </p>
            </div>
          )}

          <div className="mt-4 w-full space-y-2">
            {!qrDataUrl ? (
              <Button className="w-full gap-2" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                QR yaratish
              </Button>
            ) : (
              <>
                <Button className="w-full gap-2" onClick={() => checkoutUrl && window.open(checkoutUrl, "_blank")}>
                  <ExternalLink className="w-4 h-4" />
                  Payme'da ochish
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      if (!checkoutUrl) return;
                      await navigator.clipboard.writeText(checkoutUrl);
                      toast({ title: "Nusxalandi", description: "To'lov havolasi nusxalandi" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Havola
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={reset}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Yangi QR
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 w-full space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              <span>Payme / Click / Uzum ilovasini oching</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <QrCode className="w-3.5 h-3.5 text-primary" />
              <span>"To'lash" → "QR skanerlash" tugmasini bosing</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Kodni skanerlab to'lovni tasdiqlang</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRPayButton;
