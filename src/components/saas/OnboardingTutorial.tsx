import { useState, useEffect } from "react";
import { BookOpen, X, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Step {
  title: string;
  description: string;
  image?: string;
  tip?: string;
}

interface OnboardingTutorialProps {
  moduleId: string;          // 'diagnostics','clinic','dental'...
  moduleName: string;        // "Diagnostika"
  steps: Step[];
  /** Auto-open on first visit (stored in localStorage) */
  autoOpen?: boolean;
}

export const OnboardingTutorial = ({ moduleId, moduleName, steps, autoOpen = true }: OnboardingTutorialProps) => {
  const storageKey = `onboarding_seen_${moduleId}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (autoOpen && !localStorage.getItem(storageKey)) {
      setOpen(true);
    }
  }, [autoOpen, storageKey]);

  const finish = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
    setStep(0);
  };

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <>
      {/* Trigger button (always available in dashboard header) */}
      <button
        onClick={() => { setStep(0); setOpen(true); }}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 hover:text-primary transition"
      >
        <BookOpen className="w-3.5 h-3.5" /> Qanday ishlaydi?
      </button>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-muted-foreground">{moduleName} • {step + 1}/{steps.length}</p>
              <h3 className="font-heading font-bold text-lg text-foreground">{current?.title}</h3>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mb-3">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {current?.image && (
            <div className="rounded-xl overflow-hidden border border-border mb-3 aspect-video bg-muted/30 flex items-center justify-center">
              <img src={current.image} alt={current.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{current?.description}</p>

          {current?.tip && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3 text-xs text-foreground">
              💡 <strong>Maslahat:</strong> {current.tip}
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
            </Button>
            {!isLast ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Keyingi <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish} className="bg-gradient-to-r from-primary to-primary/80">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Tugatish
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OnboardingTutorial;
