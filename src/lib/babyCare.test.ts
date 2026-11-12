import { describe, expect, it } from "vitest";
import { babyAge, childQuestions, childUrgency } from "./babyCare";
describe("child age and safety", () => {
  it("does not advance age before monthly birthday", () => {
    expect(babyAge("2026-10-20", new Date(2026, 10, 12))?.months).toBe(0);
    expect(babyAge("2026-10-12", new Date(2026, 10, 12))?.months).toBe(1);
    expect(babyAge("2027-01-01", new Date(2026, 10, 12))).toBeNull();
  });
  it("prioritizes danger and young infant fever", () => {
    expect(childUrgency(20, "37", true)).toBe("emergency");
    expect(childUrgency(89, "38", false)).toBe("urgent");
    expect(childUrgency(90, "38", false)).toBe("doctor");
    expect(childUrgency(10, "", false)).toBe("none");
  });
  it("offers different tasks across age groups", () => {
    expect(childQuestions(2)).not.toEqual(childQuestions(8));
    expect(childQuestions(8)).not.toEqual(childQuestions(18));
  });
});