import { useEffect, useRef, useState } from "react";
import LegalAcceptanceModal from "@/components/legal/LegalAcceptanceModal";

/** A fresh, cancellable consent request for each payment attempt. */
export function usePaymentLegalGate(context: string) {
  const pending = useRef<((accepted: boolean) => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => () => { pending.current?.(false); pending.current = null; }, []);

  const requestLegal = () => new Promise<boolean>((resolve) => {
    pending.current?.(false);
    pending.current = resolve;
    setAttempt(value => value + 1);
    setOpen(true);
  });
  const finish = (accepted: boolean) => {
    pending.current?.(accepted);
    pending.current = null;
    setOpen(false);
  };

  const legalModal = <LegalAcceptanceModal key={attempt} open={open}
    onOpenChange={value => { if (!value) finish(false); }} variant="saas"
    context={context} onAccepted={() => finish(true)} />;
  return { requestLegal, legalModal };
}