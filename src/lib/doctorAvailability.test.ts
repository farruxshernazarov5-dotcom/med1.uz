import { describe, expect, it } from "vitest";
import { buildSlots, dateKey } from "./doctorAvailability";

describe("doctor calendar consistency", () => {
  it("uses the selected local date without shifting to the preceding UTC day", () => {
    expect(dateKey(new Date(2026, 10, 25, 0, 1))).toBe("2026-11-25");
  });
  it("generates slots only within the doctor's configured working hours", () => {
    expect(buildSlots({ start_time: "12:00", end_time: "13:00", slot_minutes: 30 })).toEqual(["12:00", "12:30"]);
  });
});