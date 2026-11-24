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
    expect(ownerOf("/dental").host).toBe("dental.med1.uz");
    expect(ownerOf("/dental-register").host).toBe("dental.med1.uz");
    expect(ownerOf("/doctors/123").host).toBe("doctors.med1.uz");
    expect(ownerOf("/ai-diabetes").host).toBe("ai.med1.uz");
    expect(ownerOf("/ai-subscription").host).toBe("ai.med1.uz");
    expect(ownerOf("/ai-payment").host).toBe("ai.med1.uz");
    expect(ownerOf("/help").host).toBe("help.med1.uz");
    expect(ownerOf("/payment-safety").host).toBe("help.med1.uz");
    expect(ownerOf("/legal-center").host).toBe("help.med1.uz");
    expect(ownerOf("/verify/123").host).toBe("verify.med1.uz");
    expect(ownerOf("/dashboard/patient").host).toBe("my.med1.uz");
    expect(ownerOf("/mobile-appointments").host).toBe("my.med1.uz");
    expect(ownerOf("/admin/med-coin").host).toBe("admin.med1.uz");
    expect(urlForPath("/clinics", "www.med1.uz")).toBe("https://clinic.med1.uz/clinics");
    expect(urlForPath("/dental", "clinic.med1.uz")).toBe("https://dental.med1.uz/dental");
    expect(urlForPath("/ai-services", "clinic.med1.uz")).toBe("https://ai.med1.uz/ai-services");
    expect(urlForPath("/help", "my.med1.uz")).toBe("https://help.med1.uz/help");
    expect(urlForPath("/verify/abc", "www.med1.uz")).toBe("https://verify.med1.uz/verify/abc");
    expect(urlForPath("/dashboard/patient", "www.med1.uz")).toBe("https://my.med1.uz/dashboard/patient");
  });

  it("keeps shared pages on the current host", () => {
    expect(isSharedPath("/auth")).toBe(true);
    expect(isSharedPath("/dashboard")).toBe(true);
    expect(isSharedPath("/dashboard/doctor")).toBe(true);
    expect(isSharedPath("/dashboard/dental")).toBe(true);
    expect(isSharedPath("/dashboard/patient")).toBe(false);
    expect(urlForPath("/auth", "ai.med1.uz")).toBeNull();
    expect(urlForPath("/dashboard/doctor", "doctors.med1.uz")).toBeNull();
    expect(isSharedPath("/ai-subscription")).toBe(false);
  });

  it("only enables routing on known production hosts", () => {
    expect(isProductionHost("www.med1.uz")).toBe(true);
    expect(isProductionHost("my.med1.uz")).toBe(true);
    expect(isProductionHost("clinic.med1.uz")).toBe(true);
    expect(isProductionHost("dental.med1.uz")).toBe(true);
    expect(isProductionHost("help.med1.uz")).toBe(true);
    expect(isProductionHost("verify.med1.uz")).toBe(true);
    expect(isProductionHost("evil.med1.uz")).toBe(false);
    expect(isProductionHost("localhost")).toBe(false);
    expect(isActiveSubdomainHost("clinic.med1.uz")).toBe(true);
    expect(isActiveSubdomainHost("my.med1.uz")).toBe(true);
  });

  it("never creates a primary-domain redirect loop", () => {
    expect(redirectTargetForLocation("/clinics", "www.med1.uz")).toBeNull();
    expect(redirectTargetForLocation("/ai-services", "www.med1.uz")).toBeNull();
    expect(redirectTargetForLocation("/doctors", "www.med1.uz")).toBeNull();
    expect(redirectTargetForLocation("/admin", "www.med1.uz")).toBeNull();
    expect(redirectTargetForLocation("/dental", "www.med1.uz")).toBeNull();
  });

  it("routes misplaced paths to their owning subdomain", () => {
    expect(redirectTargetForLocation("/ai-services", "clinic.med1.uz", "?lang=uz"))
      .toBe("https://ai.med1.uz/ai-services?lang=uz");
    expect(redirectTargetForLocation("/ai-doctor-chat", "ai.med1.uz", "?lang=uz"))
      .toBeNull();
    expect(redirectTargetForLocation("/dental", "clinic.med1.uz"))
      .toBe("https://dental.med1.uz/dental");
    expect(redirectTargetForLocation("/payment-safety", "my.med1.uz"))
      .toBe("https://help.med1.uz/payment-safety");
    expect(redirectTargetForLocation("/verify/123", "doctors.med1.uz"))
      .toBe("https://verify.med1.uz/verify/123");
  });
});
