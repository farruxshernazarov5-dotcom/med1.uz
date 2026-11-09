import { describe, it, expect } from "vitest";
import { weightGainRange, contractionStats } from "./pregnancyTools";
describe("pregnancy tools", () => {
  it("normal BMI gain is 11.5–16 kg", () => expect(weightGainRange(22)).toEqual([11.5, 16]));
  it("5-1-1 rule triggers for 1h of 70s contractions every 4 min", () => {
    const l = Array.from({ length: 16 }, (_, i) => ({ start: i * 240000, end: i * 240000 + 70000 }));
    expect(contractionStats(l).rule511).toBe(true);
  });
  it("sparse contractions do not trigger", () => {
    const l = Array.from({ length: 4 }, (_, i) => ({ start: i * 900000, end: i * 900000 + 30000 }));
    expect(contractionStats(l).rule511).toBe(false);
  });
});
