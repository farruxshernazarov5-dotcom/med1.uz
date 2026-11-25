import { afterEach, describe, expect, it, vi } from "vitest";
import { getPatientLocation } from "./patientGeolocation";

afterEach(() => vi.unstubAllGlobals());
describe("patient GPS", () => {
  it("retries timeout without inventing Tashkent coordinates", async () => {
    const getCurrentPosition = vi.fn().mockImplementationOnce((_ok, fail) => fail({ code: 3 }))
      .mockImplementationOnce(ok => ok({ coords: { latitude: 39.6542, longitude: 66.9597 } }));
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    expect(await getPatientLocation()).toEqual({ latitude: 39.6542, longitude: 66.9597 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  });
  it("does not repeat a denied permission request", async () => {
    const getCurrentPosition = vi.fn((_ok, fail) => fail({ code: 1 }));
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    await expect(getPatientLocation()).rejects.toThrow("ruxsat berilmadi");
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});