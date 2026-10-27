import { describe, expect, it } from "vitest";
import { clickPartnerStats, type ClickConversion } from "./clickPartnerStats";

const row = (changes: Partial<ClickConversion>): ClickConversion => ({ id: "1", created_at: "2026-10-27", conversion_type: "payment", module: null, amount: 1000, currency: "UZS", status: "confirmed", source_slug: "click", ...changes });
describe("separate Click accounting", () => {
  it("never includes HAMBI records", () => {
    const stats = clickPartnerStats([row({}), row({ source_slug: "hambi", amount: 9000 })]);
    expect(stats.revenue).toBe(1000);
    expect(stats.rows).toHaveLength(1);
  });
  it("counts only confirmed UZS revenue", () => {
    expect(clickPartnerStats([row({}), row({ status: "pending" }), row({ currency: "USD" }), row({ conversion_type: "signup" })]).revenue).toBe(1000);
  });
});