import { describe, it, expect } from "vitest";
import { maintenanceApplies, parsePlatformStatus, shouldShowRelease } from "./platformStatus";
describe("platform notice rules", () => {
  it("never announces maintenance when disabled", () => {
    const status = parsePlatformStatus({ maintenance: { active: false } });
    expect(status && maintenanceApplies(status, "/click")).toBe(false);
  });
  it("applies declared maintenance to website and Click without blocking admin recovery", () => {
    const status = parsePlatformStatus({ maintenance: { active: true } });
    expect(status && maintenanceApplies(status, "/click")).toBe(true);
    expect(status && maintenanceApplies(status, "/ai-fitness")).toBe(true);
    expect(status && maintenanceApplies(status, "/admin")).toBe(false);
  });
  it("limits scoped maintenance to selected service", () => {
    const status = parsePlatformStatus({ maintenance: { active: true, paths: ["/ai-radiology"] } });
    expect(status && maintenanceApplies(status, "/ai-radiology/brain")).toBe(true);
    expect(status && maintenanceApplies(status, "/ai-fitness")).toBe(false);
  });
  it("shows each announced update once and no fabricated update", () => {
    expect(shouldShowRelease("2", "1")).toBe(true);
    expect(shouldShowRelease("2", "2")).toBe(false);
    expect(shouldShowRelease(undefined, "1")).toBe(false);
  });
});