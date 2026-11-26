import { nasiyaThreeMonthQuote } from "@/lib/nasiyaPricing";
export default function NasiyaSummary({ amount }: { amount: number }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  const q = nasiyaThreeMonthQuote(amount);
  const money = (n: number) => `${n.toLocaleString("uz-UZ")} so‘m`;
  return <div className="space-y-2 border-y border-border py-3 text-sm">
    <p className="font-semibold">Uzum Nasiya · 3 oy</p>
    <div className="flex justify-between gap-3 font-semibold"><span>Nasiya jami</span><span className="text-primary">{money(q.total)}</span></div>
    {q.installments.map((n,i) => <div key={i} className="flex justify-between gap-3 text-muted-foreground"><span>{i+1}-oy</span><span>{money(n)}</span></div>)}
  </div>;
}