import { useEffect, useState, type ReactNode } from "react";
import { Fingerprint, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isBiometricLockEnabled, isUnlocked, openAppSettings, verifyBiometric } from "@/lib/nativeHealth";

/** Hides medical-card content behind Face ID / fingerprint in the native app when enabled. */
export const BiometricGate = ({ children }: { children: ReactNode }) => {
  const [ok, setOk] = useState(() => !isBiometricLockEnabled() || isUnlocked());
  const [failed, setFailed] = useState(false);

  const unlock = async () => {
    setFailed(false);
    const r = await verifyBiometric();
    setOk(r);
    setFailed(!r);
  };

  useEffect(() => { if (!ok) void unlock(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (ok) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><Lock className="h-8 w-8" /></span>
      <div>
        <h3 className="font-semibold">Tibbiy karta himoyalangan</h3>
        <p className="text-sm text-muted-foreground">Ochish uchun Face ID yoki barmoq izidan foydalaning.</p>
        {failed && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            Tasdiqlanmadi. Qayta urinib ko‘ring yoki telefon sozlamalarida Face ID / barmoq izi yoqilganini tekshiring.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={unlock} className="gap-2"><Fingerprint className="h-4 w-4" /> Qayta urinish</Button>
        {failed && (
          <Button variant="outline" className="gap-2" onClick={() => void openAppSettings()}>
            <Settings className="h-4 w-4" /> Sozlamalarni ochish
          </Button>
        )}
      </div>
    </div>
  );
};
