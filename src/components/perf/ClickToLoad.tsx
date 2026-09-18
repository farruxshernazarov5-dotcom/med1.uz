import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Tugma matni */
  label: string;
  /** Qisqacha izoh */
  hint?: string;
  minHeight?: number;
}

/**
 * Og'ir blokni (xarita, video, tashqi widget) faqat foydalanuvchi bosgandan keyin yuklaydi.
 * Bosh sahifa birinchi yuklanishini sezilarli tezlashtiradi.
 */
const ClickToLoad = ({ children, label, hint, minHeight = 260 }: Props) => {
  const [loaded, setLoaded] = useState(false);

  if (loaded) return <>{children}</>;

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 text-center"
      style={{ minHeight }}
    >
      <p className="text-sm text-muted-foreground max-w-md">{hint ?? label}</p>
      <Button type="button" onClick={() => setLoaded(true)}>
        {label}
      </Button>
    </div>
  );
};

export default ClickToLoad;
