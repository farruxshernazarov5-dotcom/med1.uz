import { useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseCardFromQr } from "@/lib/cardQr";
import type { Html5Qrcode } from "html5-qrcode";

interface CardQrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (card: string) => void;
}

export function CardQrScannerDialog({ open, onOpenChange, onScanned }: CardQrScannerDialogProps) {
  const [error, setError] = useState("");
  const id = `card-qr-scan-${useId().replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      setError("");
      return;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      void import("html5-qrcode")
        .then(async ({ Html5Qrcode }) => {
          if (!alive) return;
          const instance = new Html5Qrcode(id);
          scannerRef.current = instance;
          await instance.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (value) => {
              const card = parseCardFromQr(value);
              if (!card) {
                setError("Bu Med ALL avans karta QR kodi emas.");
                return;
              }
              if (!alive) return;
              alive = false;
              onOpenChange(false);
              onScanned(card);
            },
            () => {},
          );
          if (!alive) await instance.stop().catch(() => {});
        })
        .catch(() => {
          if (alive) setError("Kamera ochilmadi. Kamera ruxsatini tekshiring.");
        });
    }, 180);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      const current = scannerRef.current;
      scannerRef.current = null;
      if (current?.isScanning) void current.stop().catch(() => {});
    };
  }, [open, id, onOpenChange, onScanned]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Karta QR kodini skanerlash</DialogTitle>
        </DialogHeader>
        <div id={id} className="min-h-64 overflow-hidden rounded-lg bg-muted" />
        <p className="text-xs text-muted-foreground">
          Qabul qiluvchining Med ALL avans karta QR kodini kameraga tuting.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}