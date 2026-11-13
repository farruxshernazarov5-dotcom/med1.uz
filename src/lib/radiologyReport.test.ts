import { describe, expect, it } from "vitest";
import { radiologyReportMarkdown, radiologyClinicalContext } from "./radiologyReport";

describe("radiology reports", () => {
  it("converts saved JSON to clinical values instead of raw keys", () => {
    const result = radiologyReportMarkdown(JSON.stringify({ imageType: "Ko'krak", findings: [{ location: "Chap o'pka", description: "Xira soha", severity: "moderate" }], overallAssessment: { summary: "Radiolog ko'rigi kerak" } }));
    expect(result).toContain("| Chap o'pka | Xira soha | O'rtacha |");
    expect(result).toContain("Radiolog ko'rigi kerak");
    expect(result).not.toContain('"findings"');
  });
  it("preserves ordinary narrative", () => { expect(radiologyReportMarkdown("Oddiy tibbiy maslahat")).toBeNull(); });
  it("sets modality-specific uncertainty for CT and MRI", () => {
    expect(radiologyClinicalContext("Og'riq", "ct")).toContain("bitta kesimdan");
    expect(radiologyClinicalContext("Og'riq", "mri")).toContain("T1/T2/FLAIR/DWI");
  });
});