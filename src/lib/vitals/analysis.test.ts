import { describe, expect, it } from "vitest";
import { classifyRhythm } from "./rhythm";
import { emotionScores, summarizeExpressions } from "./faceMesh";

describe("classifyRhythm", () => {
  const steady = (ms: number) => Array.from({ length: 12 }, () => ms);
  it("steady 75 bpm is normal sinus", () => expect(classifyRhythm(steady(800), 75).key).toBe("normal"));
  it("steady 110 bpm is tachycardia", () => expect(classifyRhythm(steady(545), 110).key).toBe("tachy"));
  it("steady 50 bpm is bradycardia", () => expect(classifyRhythm(steady(1200), 50).key).toBe("brady"));
  it("alternating long/short beats is irregular", () =>
    expect(classifyRhythm([600, 1000, 620, 980, 640, 1010, 600, 990], 75).key).toBe("irregular"));
  it("too few beats is unknown", () => expect(classifyRhythm([800, 800], 75).key).toBe("unknown"));
});

describe("facial expression", () => {
  it("a smile scores happy above other emotions", () => {
    const s = emotionScores({ mouthSmileLeft: 0.8, mouthSmileRight: 0.8 });
    expect(s.xursand).toBeGreaterThan(s.gamgin);
    expect(s.xursand).toBeGreaterThan(s.neytral);
  });
  it("relaxed face is neutral", () => {
    const sum = summarizeExpressions(Array.from({ length: 30 }, () => ({})), 10)!;
    expect(sum.dominant).toBe("neytral");
  });
  it("counts blinks per minute", () => {
    const frames = Array.from({ length: 60 }, (_, i) => (i % 10 === 0 ? { eyeBlinkLeft: 0.9, eyeBlinkRight: 0.9 } : {}));
    expect(summarizeExpressions(frames, 10)!.blinkRate).toBe(36);
  });
});
