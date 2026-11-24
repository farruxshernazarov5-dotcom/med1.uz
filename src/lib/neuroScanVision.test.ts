import { describe, it, expect } from "vitest";
import {
  calculateRulerMm,
  computeRadiomicsFromCounts,
  normalizeRiskDistribution,
} from "./neuroScanVision";

describe("neuroScanVision", () => {
  it("calculates millimeter distance on a 220mm FOV scan", () => {
    expect(calculateRulerMm({ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }, 220)).toBe(110);
    expect(calculateRulerMm({ x: 0, y: 0 }, { x: 0.3, y: 0.4 }, 200)).toBe(100);
  });

  it("normalizes risk distribution buckets to sum to 100", () => {
    const d = normalizeRiskDistribution({ highRisk: 96, benignOrLowRisk: 3.2, normal: 0.8 }, "critical");
    expect(d.highRisk).toBe(96);
    expect(d.benignOrLowRisk).toBe(3.2);
    expect(d.normal).toBe(0.8);

    const fallback = normalizeRiskDistribution(undefined, "normal");
    expect(fallback.highRisk + fallback.benignOrLowRisk + fallback.normal).toBe(100);
    expect(fallback.normal).toBeGreaterThan(fallback.highRisk);
  });

  it("computes equivalent diameter and lesion area in cm2 from pixel counts", () => {
    const metrics = computeRadiomicsFromCounts({
      width: 220,
      height: 220,
      brainPixels: 20000,
      lesionPixels: 1000,
      lesionPerimeterPx: 120,
      leftBrainPixels: 10500,
      rightBrainPixels: 9500,
      fovMm: 220,
    });
    // 1 px = 1 mm^2 when width=220 and fov=220
    expect(metrics.lesionAreaCm2).toBe(10);
    expect(metrics.brainAreaCm2).toBe(200);
    expect(metrics.equivalentDiameterMm).toBeCloseTo(35.7, 1);
    expect(metrics.asymmetryIndex).toBe(0.05);
  });
});