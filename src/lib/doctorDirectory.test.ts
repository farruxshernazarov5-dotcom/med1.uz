import { describe, it, expect } from "vitest";
import { collectPages, distanceKm, sortByPatientDistance } from "./doctorDirectory";

describe("nationwide doctor distance", () => {
  it("sorts all 4800 doctors before pagination, not just the first 24", async () => {
    const all = Array.from({ length: 4800 }, (_, i) => ({ id: String(i), slug: String(i), name: String(i), latitude: 41, longitude: 69 }));
    all[4799] = { ...all[4799], latitude: 39.65, longitude: 66.96 };
    const loaded = await collectPages(async (offset, size) => all.slice(offset, offset + size));
    expect(loaded).toHaveLength(4800);
    expect(sortByPatientDistance(loaded, { latitude: 39.65, longitude: 66.96 })[0].id).toBe("4799");
  });
  it("does not treat a missing coordinate as zero distance", () => {
    const sorted = sortByPatientDistance([
      { id: "missing", name: "Missing", slug: "missing", latitude: null, longitude: null },
      { id: "near", name: "Near", slug: "near", latitude: 39.65, longitude: 66.96 },
    ], { latitude: 39.65, longitude: 66.96 });
    expect(sorted[0].id).toBe("near"); expect(sorted[1].distance_km).toBeNull();
  });
  it("computes kilometres from the patient, not Tashkent", () => {
    expect(distanceKm({ latitude: 39.65, longitude: 66.96 }, { latitude: 39.65, longitude: 66.96 })).toBe(0);
    expect(distanceKm({ latitude: 39.65, longitude: 66.96 }, { latitude: 41.31, longitude: 69.28 })).toBeGreaterThan(250);
  });
});