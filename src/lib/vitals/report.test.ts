import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("@/lib/nativeApp", () => ({ isNativeApp: () => false }));
vi.mock("@/lib/telegramBotLink", () => ({ sendPdfToTelegram: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: vi.fn().mockRejectedValue(new Error("offline")) } } }));
const { savedPdf } = vi.hoisted(() => ({ savedPdf: vi.fn() }));
vi.mock("jspdf", async importOriginal => {
  const actual = await importOriginal<typeof import("jspdf")>();
  return { ...actual, jsPDF: class extends actual.jsPDF {
    constructor() {
      super({ unit: "mm", format: "a4" });
      Object.defineProperty(this, "save", { value: () => { savedPdf(); return this; } });
    }
  } };
});

import { classifyMetricStatus, downloadAiReport } from "./report";

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

it("downloads a radiology PDF using the bundled Unicode font even when QR registration is offline", async () => {
  const bytes = readFileSync("node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf");
  const fetchMock = vi.fn().mockResolvedValue(new Response(bytes));
  vi.stubGlobal("fetch", fetchMock);
  try {
    await downloadAiReport({ title: "Radiologiya", name: "Sinov", conclusion: JSON.stringify({ overallAssessment: { riskLevel: "attention", summary: "Radiolog tekshiruvi kerak." }, findings: [], recommendations: ["Radiologga murojaat qiling."] }) });
    expect(savedPdf).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain("DejaVuSans.ttf");
  } finally {
    savedPdf.mockClear();
    vi.unstubAllGlobals();
  }
});
