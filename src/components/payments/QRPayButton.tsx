import { useState } from "react";
import { QrCode, X, Smartphone, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QRPayButtonProps {
  amount?: number;
  label?: string;
  description?: string;
  /** Tashqi QR rasm URL (Click/Payme/Uzum dan generatsiya qilingan) */
  qrImageUrl?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * QR-kod orqali to'lov tugmasi.
 * UI placeholder — kelgusida Click/Payme/Uzum bilan integratsiya qilinadi.
 */
const QRPayButton = ({
  amount,
  label = "QR orqali to'lash",
  description = "Telefoningiz bilan QR-kodni skanerlang",
  qrImageUrl,
  variant = "default",
  size = "default",
  className = "",
}: QRPayButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`gap-2 ${className}`}>
          <QrCode className="w-4 h-4" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <QrCode className="w-5 h-5 text-primary" />
            QR-kod to'lovi
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {/* QR placeholder */}
          <div className="relative w-56 h-56 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-4 flex items-center justify-center">
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="To'lov QR-kodi"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <QrCode className="w-32 h-32 text-primary/40 mx-auto" strokeWidth={1} />
                <p className="text-[10px] text-muted-foreground mt-2">
                  QR generatsiya tayyorlanmoqda
                </p>
              </div>
            )}
            {/* Corner brackets */}
            <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
          </div>

          {amount !== undefined && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">To'lov summasi</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {amount.toLocaleString("uz-UZ")} so'm
              </p>
            </div>
          )}

          <div className="mt-4 w-full space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              <span>Click / Payme / Uzum ilovasini oching</span>
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
