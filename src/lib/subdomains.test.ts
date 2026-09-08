import { describe, expect, it } from "vitest";
import {
  currentSubdomain,
  isActiveSubdomainHost,
  isProductionHost,
  ownerOf,
  urlForPath,
} from "@/lib/subdomains";

describe("subdomain routing", () => {
  it("treats www as the canonical main host", () => {
    expect(currentSubdomain("www.med1.uz").host).toBe("www.med1.uz");
    expect(ownerOf("/pricing").host).toBe("www.med1.uz");
    expect(urlForPath("/pricing", "www.med1.uz")).toBeNull();
    expect(urlForPath("/pricing", "med1.uz")).toBe("https://www.med1.uz/pricing");
  });

  it("does not redirect visitors to service hosts before they are active", () => {
    expect(ownerOf("/clinics").host).toBe("clinic.med1.uz");
    expect(isActiveSubdomainHost("clinic.med1.uz")).toBe(false);
    expect(urlForPath("/clinics", "www.med1.uz")).toBeNull();
  });

  it("only enables routing on known production hosts", () => {
    expect(isProductionHost("www.med1.uz")).toBe(true);
    expect(isProductionHost("clinic.med1.uz")).toBe(true);
    expect(isProductionHost("evil.med1.uz")).toBe(false);
    expect(isProductionHost("localhost")).toBe(false);
  });
});