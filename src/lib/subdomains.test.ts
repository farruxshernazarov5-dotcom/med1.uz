import { describe, expect, it } from "vitest";
import {
  currentSubdomain,
  isActiveSubdomainHost,
  isProductionHost,
  isSharedPath,
  ownerOf,
  redirectTargetForLocation,
  urlForPath,
} from "@/lib/subdomains";

describe("subdomain routing", () => {
  it("treats www as the canonical main host", () => {
    expect(currentSubdomain("www.med1.uz").host).toBe("www.med1.uz");
    expect(ownerOf("/pricing").host).toBe("www.med1.uz");
    expect(urlForPath("/pricing", "www.med1.uz")).toBeNull();
  });

  it("routes active section paths to their own subdomain", () => {
    expect(ownerOf("/clinics").host).toBe("clinic.med1.uz");
    expect(ownerOf("/doctors/123").host).toBe("doctors.med1.uz");
    expect(ownerOf("/ai-diabetes").host).toBe("www.med1.uz");
    expect(ownerOf("/ai-subscription").host).toBe("www.med1.uz");
    expect(ownerOf("/ai-payment").host).toBe("www.med1.uz");
    expect(ownerOf("/admin/med-coin").host).toBe("admin.med1.uz");
    expect(urlForPath("/clinics", "www.med1.uz")).toBe("https://clinic.med1.uz/clinics");
    expect(urlForPath("/ai-services", "clinic.med1.uz")).toBe("https://www.med1.uz/ai-services");
  });

  it("keeps shared pages on the current host", () => {
    expect(isSharedPath("/auth")).toBe(true);
    expect(isSharedPath("/dashboard/patient")).toBe(true);
    expect(urlForPath("/auth", "ai.med1.uz")).toBeNull();
    expect(isSharedPath("/ai-subscription")).toBe(false);
  });

  it("only enables routing on known production hosts", () => {
    expect(isProductionHost("www.med1.uz")).toBe(true);
    expect(isProductionHost("clinic.med1.uz")).toBe(true);
    expect(isProductionHost("evil.med1.uz")).toBe(false);
    expect(isProductionHost("localhost")).toBe(false);
    expect(isActiveSubdomainHost("clinic.med1.uz")).toBe(true);
  });

  it("never creates a primary-domain redirect loop", () => {
    expect(redirectTargetForLocation("/clinics", "www.med1.uz")).toBeNull();
    expect(redirectTargetForLocation("/ai-services", "www.med1.uz")).toBeNull();
    expect(redirectTargetForLocation("/doctors", "www.med1.uz")).toBeNull();
    expect(redirectTargetForLocation("/admin", "www.med1.uz")).toBeNull();
  });

  it("temporarily moves every AI request to the main domain", () => {
    expect(redirectTargetForLocation("/", "ai.med1.uz"))
      .toBe("https://www.med1.uz/ai-services");
    expect(redirectTargetForLocation("/ai-services", "clinic.med1.uz", "?lang=uz"))
      .toBe("https://www.med1.uz/ai-services?lang=uz");
    expect(redirectTargetForLocation("/ai-doctor-chat", "ai.med1.uz", "?lang=uz"))
      .toBe("https://www.med1.uz/ai-doctor-chat?lang=uz");
  });
});
