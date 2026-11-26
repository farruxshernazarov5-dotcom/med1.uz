import { describe, expect, it, vi } from "vitest";
vi.mock("./nativeApp", () => ({ isNativeApp: () => false }));
import { appointmentCalendarEvent, reminderCalendarEvent, openCalendarEvent } from "./calendarEvent";
import { CapacitorCalendarWeb } from "@ebarooni/capacitor-calendar/dist/esm/web";
describe("phone calendar events", () => {
  it("exports the booked Uzbekistan time and doctor, not the device timezone", () => {
    const event = appointmentCalendarEvent({ id: "a", source: "doctor", date: "2026-11-26", time: "09:30", title: "Shifokor Ali", subtitle: "Konsultatsiya", address: "Samarqand", duration: 45 });
    expect(new Date(event.startDate ?? 0).toISOString()).toBe("2026-11-26T04:30:00.000Z");
    expect(event.endDate).toBe((event.startDate ?? 0) + 45 * 60_000);
    expect(event).toMatchObject({ title: "Med ALL · Shifokor Ali", description: "Konsultatsiya", location: "Samarqand", alerts: [-1440, -60] });
  });
  it("retains daily medication recurrence and picks the next occurrence", () => {
    const now = new Date(2026, 10, 26, 10, 0);
    const event = reminderCalendarEvent({ id: 1, title: "Dori", body: "1 tabletka", time: "08:00" }, now);
    expect(new Date(event.startDate ?? 0).getDate()).toBe(27);
    expect(new Date(event.startDate ?? 0).getHours()).toBe(8);
    expect(event.recurrence).toEqual({ frequency: "daily" });
  });
  it("keeps a one-off reminder's actual timestamp", () => {
    expect(reminderCalendarEvent({ id: 2, title: "Qabul", body: "", at: "2026-11-26T05:00:00Z" }).startDate).toBe(Date.parse("2026-11-26T05:00:00Z"));
    expect(() => reminderCalendarEvent({ id: 2, title: "", body: "" })).toThrow();
  });
  it("generates an importable ICS with time and alarms using the calendar library", async () => {
    const event = appointmentCalendarEvent({ id: "a", source: "doctor", date: "2026-11-26", time: "09:30", title: "Ali" });
    const result = await new CapacitorCalendarWeb().createEventWithPrompt({ ...event, autoDownloadIcsFile: false });
    expect(result.ics).toBeInstanceOf(File);
    const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; if (result.ics) reader.readAsText(result.ics); else reject(new Error("No ICS")); });
    expect(content).toContain("DTSTART:20261126T043000Z");
    expect(content).toContain("BEGIN:VALARM");
  });
});