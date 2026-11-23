import { expect, it } from "vitest";
import { nasiyaThreeMonthQuote, selectNasiyaTariff } from "./nasiyaPricing";
it("adds exactly 13% for the three-month plan", () => {
  expect(nasiyaThreeMonthQuote(1_000_000)).toEqual({ months: 3, markupPercent: 13, baseAmount: 1_000_000,
    total: 1_130_000, markup: 130_000, installments: [376666, 376666, 376668] });
});
it("preserves the total across all three rounded payments", () => {
  const q = nasiyaThreeMonthQuote(15001);
  expect(q.installments.reduce((a,b) => a+b,0)).toBe(16951);
});
it("never substitutes a different term or extra provider markup", () => {
  expect(selectNasiyaTariff([
    { period_months: 6, is_available: true, tariff: "six", origin: 1000000, total: 1130000 },
    { period_months: 3, is_available: true, tariff: "extra", origin: 1000000, total: 1260000 },
  ], 1000000)).toBeNull();
});
it("accepts only the provider's available matching three-month tariff", () => {
  expect(selectNasiyaTariff([{ period_months: 3, is_available: true, tariff: "contract-three", origin: 1000000, total: 1130000 }], 1000000)?.tariff).toBe("contract-three");
});