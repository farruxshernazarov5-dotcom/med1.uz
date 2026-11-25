import { describe, expect, it, vi } from "vitest";
vi.mock("./pdf", () => ({ pdfToImageBase64Pages: vi.fn() }));
import { pdfToImageBase64Pages } from "./pdf";
import { prepareRadiologyImages, radiologyImagePayload, validateRadiologyFile } from "./radiologyImages";

describe("multiple radiology projections", () => {
  it("sends every selected projection rather than only the first", () => {
    const payload = radiologyImagePayload(["data:image/jpeg;base64,AXIAL", "data:image/jpeg;base64,SAGITTAL", "data:image/jpeg;base64,CORONAL"]);
    expect(payload.pdfPageImages).toEqual(["AXIAL", "SAGITTAL", "CORONAL"]);
    expect(payload.imageMimeType).toBe("image/jpeg");
  });
  it("rejects unsupported formats", () => {
    expect(validateRadiologyFile({ type: "application/dicom", size: 100 })).not.toBeNull();
    expect(validateRadiologyFile({ type: "image/png", size: 100 })).toBeNull();
  });
  it("enforces the existing per-file 10 MB boundary", () => {
    expect(validateRadiologyFile({ type: "image/jpeg", size: 10 * 1024 * 1024 })).toBeNull();
    expect(validateRadiologyFile({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("rejects excess projections without silently discarding them", async () => {
    vi.mocked(pdfToImageBase64Pages).mockResolvedValue(Array(13).fill("PAGE"));
    await expect(prepareRadiologyImages([new File(["pdf"], "scan.pdf", { type: "application/pdf" })])).rejects.toThrow("12");
  });
  it("combines pages across several PDFs in order", async () => {
    vi.mocked(pdfToImageBase64Pages).mockResolvedValueOnce(["A", "B"]).mockResolvedValueOnce(["C"]);
    const images = await prepareRadiologyImages([new File(["1"], "axial.pdf", { type: "application/pdf" }), new File(["2"], "coronal.pdf", { type: "application/pdf" })]);
    expect(radiologyImagePayload(images).pdfPageImages).toEqual(["A", "B", "C"]);
  });
});