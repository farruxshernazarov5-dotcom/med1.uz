import { useState } from "react";
import { Unplug, RefreshCw, Phone, WifiOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onContinueOffline: () => void; onBackOnline: () => void }

/** Full-screen Med1 notice shown when the connection drops; user can retry, continue offline or call 103. */
export function OfflineScreen({ onContinueOffline, onBackOnline }: Props) {
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const retry = async () => {
    setChecking(true);
    setFailed(false);
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 5000);
      await fetch(`${window.location.origin}/robots.txt?ping=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
      window.clearTimeout(timer);
      onBackOnline();
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="offline-title"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl px-6 app-safe-top text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
        <div className="relative h-28 w-28 rounded-[2rem] bg-gradient-to-br from-primary/15 to-secondary/15 border border-primary/20 flex items-center justify-center">
          <Unplug className="h-14 w-14 text-primary" strokeWidth={1.5} />
        </div>
        <span className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-medical-orange flex items-center justify-center shadow-lg">
          <WifiOff className="h-5 w-5 text-primary-foreground" />
        </span>
      </div>
      <h2 id="offline-title" className="text-xl font-bold">Internet aloqasi uzildi</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        Wi‑Fi yoki mobil internetni tekshiring. Saqlangan sahifalar va ma’lumotlar oflayn rejimda ko‘rinadi.
      </p>
      {failed && <p className="text-xs text-destructive mt-3" role="status">Hali ham aloqa yo‘q. Birozdan so‘ng qayta urinib ko‘ring.</p>}
      <div className="w-full max-w-xs space-y-2 mt-8">
        <Button onClick={retry} disabled={checking} className="w-full min-h-12 gap-2 text-base">
          {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />} Qayta urinish
        </Button>
        <Button variant="outline" onClick={onContinueOffline} className="w-full min-h-12">Oflayn davom etish</Button>
        <Button asChild variant="ghost" className="w-full min-h-12 gap-2 text-destructive hover:text-destructive">
          <a href="tel:103"><Phone className="h-4 w-4" /> Shoshilinch yordam — 103</a>
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-6">Med ALL • med1.uz</p>
    </div>
  );
}
