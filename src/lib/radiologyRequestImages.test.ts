import { describe, expect, it } from "vitest";
import { radiologyRequestImages } from "../../supabase/functions/_shared/radiology-images";

describe("radiology request series", () => {
  it("does not truncate a 12-projection request at the old three-page cutoff", () => {
    const pdfPageImages = Array.from({ length: 12 }, (_, i) => btoa(`projection${i}`));
    expect(radiologyRequestImages({ imageMimeType: "image/jpeg", pdfPageImages })).toEqual(pdfPageImages);
  });
  it("preserves legacy single-image requests", () => {
    expect(radiologyRequestImages({ imageMimeType: "image/png", imageBase64: "QUJD" })).toEqual(["QUJD"]);
  });
  it("rejects over-limit series rather than analyzing an undisclosed subset", () => {
    expect(() => radiologyRequestImages({ imageMimeType: "image/jpeg", pdfPageImages: Array(13).fill("QUJD") })).toThrow("12");
  });
  it("rejects invalid image data before any paid analysis", () => {
    expect(() => radiologyRequestImages({ imageMimeType: "image/jpeg", imageBase64: "<html>" })).toThrow("buzilgan");
  });
});