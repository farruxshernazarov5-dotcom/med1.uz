import { describe, expect, it } from "vitest";
import { normalizeReminderTimes, snoozeTime } from "./reminderSchedule";
describe("reminder schedules", () => {
  it("rejects invalid times and removes duplicate daily alarms", () => {
    expect(normalizeReminderTimes(["20:00", "08:00", "08:00"])).toEqual(["08:00", "20:00"]);
    expect(() => normalizeReminderTimes(["24:00"])).toThrow();
    expect(() => normalizeReminderTimes([""])).toThrow();
  });
  it("snoozes exactly ten minutes", () => {
    expect(snoozeTime(10, 1000).getTime()).toBe(601000);
    expect(() => snoozeTime(0)).toThrow();
  });
});