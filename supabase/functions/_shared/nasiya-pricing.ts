export function nasiyaThreeMonthQuote(baseAmount: number) {
  if (!Number.isSafeInteger(baseAmount) || baseAmount <= 0 || baseAmount > 100_000_000) throw new Error("Noto‘g‘ri xizmat narxi");
  const total = Math.round(baseAmount * 113 / 100);
  const monthly = Math.floor(total / 3);
  return { months: 3 as const, markupPercent: 13, baseAmount, total, markup: total - baseAmount,
    installments: [monthly, monthly, total - monthly * 2] };
}
export function selectNasiyaTariff(tariffs: { period_months: number; is_available: boolean; tariff: string; total: number; origin: number }[], baseAmount: number) {
  const quote = nasiyaThreeMonthQuote(baseAmount);
  return tariffs.find(t => t.period_months === 3 && t.is_available && Number(t.total) === quote.total && Number(t.origin) === baseAmount) ?? null;
}