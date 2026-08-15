/**
 * MED1.UZ — Klinika Business Intelligence yordamchi funksiyalari.
 * Faqat sof hisob-kitob (pure) funksiyalari — real ma'lumot ustida ishlaydi.
 */

export type PeriodKey = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom";

export interface BIRange {
  from: Date;
  to: Date;
  key: PeriodKey;
  label: string;
}

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Bugun",
  yesterday: "Kecha",
  week: "Hafta",
  month: "Oy",
  quarter: "Chorak",
  year: "Yil",
  custom: "Tanlangan davr",
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export function getRange(key: PeriodKey, custom?: { from?: string; to?: string }): BIRange {
  const now = new Date();
  let from = startOfDay(now);
  let to = endOfDay(now);

  switch (key) {
    case "today":
      break;
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = startOfDay(y);
      to = endOfDay(y);
      break;
    }
    case "week":
      from = startOfDay(new Date(now.getTime() - 6 * 864e5));
      break;
    case "month":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case "quarter":
      from = startOfDay(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1));
      break;
    case "year":
      from = startOfDay(new Date(now.getFullYear(), 0, 1));
      break;
    case "custom":
      from = custom?.from ? startOfDay(new Date(custom.from)) : startOfDay(new Date(now.getTime() - 29 * 864e5));
      to = custom?.to ? endOfDay(new Date(custom.to)) : endOfDay(now);
      break;
  }
  return { from, to, key, label: PERIOD_LABELS[key] };
}

/** Oldingi teng uzunlikdagi davr (taqqoslash uchun). */
export function prevRange(r: BIRange): BIRange {
  const span = r.to.getTime() - r.from.getTime();
  return {
    from: new Date(r.from.getTime() - span - 1),
    to: new Date(r.from.getTime() - 1),
    key: r.key,
    label: `Oldingi ${r.label.toLowerCase()}`,
  };
}

export const toDate = (v: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export function inRange(v: any, r: BIRange): boolean {
  const d = toDate(v);
  if (!d) return false;
  return d >= r.from && d <= r.to;
}

/** Foizli o'zgarish; oldingi davr 0 bo'lsa null (taqqoslab bo'lmaydi). */
export function delta(cur: number, prev: number): number | null {
  if (!prev) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
}

export const num = (v: any) => Number(v || 0);
export const sum = <T,>(arr: T[], fn: (x: T) => number) => arr.reduce((s, x) => s + (fn(x) || 0), 0);

export function fmtMoney(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)} mlrd`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)} mln`;
  if (Math.abs(v) >= 1e3) return `${Math.round(v / 1e3)} ming`;
  return String(Math.round(v));
}

export const fmtFull = (v: number) => `${Math.round(v).toLocaleString("uz-UZ")} so'm`;

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Vaqt qatorini davr uzunligiga qarab kun yoki oy kesimida quradi. */
export function buildSeries(r: BIRange, rows: { date: any; value: number; count?: number }[]) {
  const spanDays = Math.max(1, Math.round((r.to.getTime() - r.from.getTime()) / 864e5));
  const byMonth = spanDays > 92;
  const map = new Map<string, { name: string; daromad: number; qabullar: number }>();

  const cursor = new Date(r.from);
  while (cursor <= r.to) {
    const k = byMonth ? monthKey(cursor) : dayKey(cursor);
    if (!map.has(k)) map.set(k, { name: byMonth ? k : k.slice(5), daromad: 0, qabullar: 0 });
    if (byMonth) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }

  rows.forEach((row) => {
    const d = toDate(row.date);
    if (!d || d < r.from || d > r.to) return;
    const k = byMonth ? monthKey(d) : dayKey(d);
    const e = map.get(k);
    if (!e) return;
    e.daromad += row.value || 0;
    e.qabullar += row.count ?? 1;
  });

  return Array.from(map.values());
}

export type Health = "good" | "warn" | "bad";

/** KPI holati: yaxshi / e'tibor / kritik (accessibility uchun matn bilan birga ishlatiladi). */
export function healthFromDelta(d: number | null, inverse = false): Health {
  if (d === null) return "good";
  const v = inverse ? -d : d;
  if (v >= 0) return "good";
  if (v >= -10) return "warn";
  return "bad";
}

export const HEALTH_TEXT: Record<Health, string> = {
  good: "Normal",
  warn: "E'tibor kerak",
  bad: "Kritik",
};

/** Oddiy chiziqli regressiya asosidagi prognoz (forecast). */
export function forecastNext(values: number[]): { next: number; trend: number } {
  const n = values.length;
  if (n < 2) return { next: values[0] || 0, trend: 0 };
  const xs = values.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let numr = 0;
  let den = 0;
  xs.forEach((x, i) => {
    numr += (x - mx) * (values[i] - my);
    den += (x - mx) ** 2;
  });
  const slope = den ? numr / den : 0;
  const intercept = my - slope * mx;
  return { next: Math.max(0, slope * n + intercept), trend: slope };
}
