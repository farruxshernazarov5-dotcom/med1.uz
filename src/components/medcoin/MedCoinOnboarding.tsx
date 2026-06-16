import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Package, CreditCard, Rocket, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { mc } from "@/lib/medCoinI18n";

const DEFAULT_KEY = "medcoin-onboarding-seen-v1";

const ICONS = [Sparkles, Coins, Package, CreditCard, Rocket];

interface Props {
  open?: boolean;
  onClose?: () => void;
  /** If true, will auto-open on first mount unless previously dismissed. */
  autoOpen?: boolean;
  /** "local" = shown once forever (default); "session" = shown once per browser session (each new visit). */
  storage?: "local" | "session";
  /** Override the dedup key (e.g. per surface). */
  storageKey?: string;
}

const MedCoinOnboarding = ({ open: controlled, onClose, autoOpen = true, storage = "local", storageKey }: Props) => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const key = storageKey || (storage === "session" ? "medcoin-onboarding-seen-session" : DEFAULT_KEY);
  const store = () => (storage === "session" ? window.sessionStorage : window.localStorage);

  useEffect(() => {
    if (controlled !== undefined) {
      setOpen(controlled);
      return;
    }
    if (autoOpen && typeof window !== "undefined") {
      try {
        if (!store().getItem(key)) setOpen(true);
      } catch {}
    }
  }, [controlled, autoOpen, key, storage]);

  const steps = [1, 2, 3, 4, 5].map((n) => ({
    title: mc(lang, `step${n}Title`),
    body: mc(lang, `step${n}Body`),
    Icon: ICONS[n - 1],
  }));

  const close = () => {
    try { store().setItem(key, "1"); } catch {}
    setOpen(false);
    onClose?.();
  };

  const cur = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = cur.Icon;
  const pct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl">
        <div className="relative">
          <button onClick={close} className="absolute right-3 top-3 z-10 p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground" aria-label="close">
            <X className="w-4 h-4" />
          </button>

          <div className="h-1 bg-muted">
            <div className="h-full bg-gradient-to-r from-amber-400 via-primary to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="p-6 pt-8 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-400/20 via-primary/10 to-fuchsia-500/20 border border-primary/20 flex items-center justify-center shadow-inner">
              <div className="absolute" />
              <Icon className="w-10 h-10 text-primary" />
            </div>

            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
              {step + 1} / {steps.length}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">{cur.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed min-h-[72px]">{cur.body}</p>

            <div className="flex items-center justify-center gap-1.5 my-5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={close} className="text-muted-foreground">
                {mc(lang, "skip")}
              </Button>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                    {mc(lang, "back")}
                  </Button>
                )}
                <Button size="sm" onClick={() => (isLast ? close() : setStep((s) => s + 1))}>
                  {isLast ? mc(lang, "finish") : mc(lang, "next")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedCoinOnboarding;
