/** IOM 2009 recommended total gestational weight gain (kg) by pre-pregnancy BMI. */
export function weightGainRange(bmi: number): [number, number] {
  if (bmi < 18.5) return [12.5, 18];
  if (bmi < 25) return [11.5, 16];
  if (bmi < 30) return [7, 11.5];
  return [5, 9];
}
/** Expected gain so far: ~0.5–2 kg in the 1st trimester, then linear to the total by week 40. */
export function expectedGainByWeek(bmi: number, week: number): [number, number] {
  const [lo, hi] = weightGainRange(bmi);
  if (week <= 13) return [0.5 * week / 13, 2 * week / 13];
  const f = Math.min(1, (week - 13) / 27);
  return [0.5 + (lo - 0.5) * f, 2 + (hi - 2) * f];
}
export type Contraction = { start: number; end: number };
/** 5-1-1 rule: contractions ≤5 min apart, ≥1 min long, for ≥1 hour → go to the maternity ward. */
export function contractionStats(list: Contraction[]) {
  if (!list.length) return { avgDuration: 0, avgInterval: 0, rule511: false };
  const recent = list.slice(-6);
  const avgDuration = recent.reduce((s, c) => s + (c.end - c.start), 0) / recent.length / 1000;
  const gaps = recent.slice(1).map((c, i) => (c.start - recent[i].start) / 1000);
  const avgInterval = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const span = (list[list.length - 1].end - list[0].start) / 60000;
  const rule511 = gaps.length >= 3 && avgInterval <= 300 && avgDuration >= 60 && span >= 60;
  return { avgDuration, avgInterval, rule511 };
}
