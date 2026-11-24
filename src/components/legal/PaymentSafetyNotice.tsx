import { Link } from "react-router-dom";
import { ShieldAlert, ArrowUpRight } from "lucide-react";

export default function PaymentSafetyNotice() {
  return <aside aria-label="To‘lov xavfsizligi" className="flex items-start gap-3 border-y border-border bg-muted/40 px-4 py-3 text-foreground">
    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
    <div className="min-w-0 flex-1 text-sm"><strong>Ogoh bo‘ling.</strong> SMS kod, PIN va CVV’ni hech kimga bermang. To‘lovdan oldin summa va oluvchini tekshiring.
      <Link to="/payment-safety" className="ml-2 inline-flex items-center gap-1 font-medium text-secondary underline underline-offset-4">Xavfsiz to‘lov<ArrowUpRight className="h-3.5 w-3.5" /></Link>
    </div>
  </aside>;
}