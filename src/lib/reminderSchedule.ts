export function normalizeReminderTimes(times: string[]) {
  if (!times.length || times.some(t => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t))) {
    throw new Error("Eslatma vaqtini to‘g‘ri kiriting");
  }
  return [...new Set(times)].sort();
}
export function snoozeTime(minutes: number, now = Date.now()) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new Error("Noto‘g‘ri muddat");
  return new Date(now + minutes * 60000);
}