import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/nativeApp", () => ({ isNativeApp: () => false }));
vi.mock("@/lib/telegramBotLink", () => ({ sendPdfToTelegram: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { classifyMetricStatus } from "./report";

const metric = (label: string, value: string) => ({ label, value, norm: "", ok: null });

describe("classifyMetricStatus", () => {
  it("flags pulse 120 for attention", () => {
    expect(classifyMetricStatus(metric("Puls", "120 bpm"))).toBe("attention");
  });
  it("flags SpO2 90 as urgent", () => {
    expect(classifyMetricStatus(metric("SpO2 (taxminiy)", "90%"))).toBe("urgent");
  });
  it("accepts SpO2 97 as normal", () => {
    expect(classifyMetricStatus(metric("SpO2", "97%"))).toBe("normal");
  });
  it.each([["92%", "attention"], ["94%", "attention"], ["95%", "normal"]])("classifies SpO2 boundary %s", (value, expected) => {
    expect(classifyMetricStatus(metric("SpO2", value))).toBe(expected);
  });
  it("does not treat source metadata as a health indicator", () => {
    expect(classifyMetricStatus(metric("Manba / ishonch", "finger / 90%"))).toBe("unknown");
  });
});
