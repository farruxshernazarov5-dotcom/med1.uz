import { describe, it, expect } from "vitest";
import { languageInstruction } from "../../supabase/functions/_shared/lang";
describe("clinical answer detail", () => {
  it("does not force cosmetology and health analyses into 150–280 tokens", () => {
    const rule = languageInstruction("uz", "clinical");
    expect(rule).not.toContain("~150–280 tokens");
    expect(rule).toContain("COMPLETE CLINICAL ANALYSIS");
  });
  it("preserves concise behavior for other services", () => {
    expect(languageInstruction("uz")).toContain("~150–280 tokens");
  });
});