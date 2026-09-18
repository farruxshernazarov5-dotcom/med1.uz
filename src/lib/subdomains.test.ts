import { describe, expect, it } from "vitest";
import {
  currentSubdomain,
  isActiveSubdomainHost,
  isProductionHost,
  isSharedPath,
  ownerOf,
  urlForPath,
} from "@/lib/subdomains";

describe("subdomain routing", () => {
  it("treats www as the canonical main host", () => {
    expect(currentSubdomain("www.med1.uz").host).toBe("www.med1.uz");
    expect(ownerOf("/pricing").host).toBe("www.med1.uz");
    expect(urlForPath("/pricing", "www.med1.uz")).toBeNull();
  });

  it("routes section paths to their own subdomain", () => {
    expect(ownerOf("/clinics").host).toBe("clinic.med1.uz");
    expect(ownerOf("/doctors/123").host).toBe("doctors.med1.uz");
    expect(ownerOf("/ai-diabetes").host).toBe("ai.med1.uz");
    expect(ownerOf("/admin/med-coin").host).toBe("admin.med1.uz");
    expect(urlForPath("/clinics", "www.med1.uz")).toBe("https://clinic.med1.uz/clinics");
    expect(urlForPath("/ai-services", "ai.med1.uz")).toBeNull();
  });

  it("keeps shared pages on the current host", () => {
    expect(isSharedPath("/auth")).toBe(true);
    expect(isSharedPath("/dashboard/patient")).toBe(true);
    expect(urlForPath("/auth", "ai.med1.uz")).toBeNull();
  });

  it("only enables routing on known production hosts", () => {
    expect(isProductionHost("www.med1.uz")).toBe(true);
    expect(isProductionHost("clinic.med1.uz")).toBe(true);
    expect(isProductionHost("evil.med1.uz")).toBe(false);
    expect(isProductionHost("localhost")).toBe(false);
    expect(isActiveSubdomainHost("clinic.med1.uz")).toBe(true);
  });
});
