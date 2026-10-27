export type ClickConversion = {
  id: string; created_at: string; conversion_type: string; module: string | null;
  amount: number; currency: string; status: string; source_slug: string;
};

export function clickPartnerStats(rows: ClickConversion[]) {
  const scoped = rows.filter(row => row.source_slug === "click");
  const confirmed = scoped.filter(row => row.status === "confirmed");
  return {
    signups: scoped.filter(row => row.conversion_type === "signup").length,
    subscriptions: confirmed.filter(row => row.conversion_type.includes("subscription")).length,
    revenue: confirmed.filter(row => row.currency === "UZS" && row.conversion_type !== "signup")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0),
    rows: scoped,
  };
}