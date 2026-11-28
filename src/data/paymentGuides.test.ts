import { describe, expect, it } from "vitest";
import { paymentGuides } from "./paymentGuides";

describe("payment guide registry", () => {
  it("contains all seven confirmed official partners with unique article routes", () => {
    expect(paymentGuides).toHaveLength(7);
    expect(new Set(paymentGuides.map((guide) => guide.slug)).size).toBe(7);
    expect(paymentGuides.every((guide) => guide.partnership === "official")).toBe(true);
  });

  it("marks only Click, Payme and Uzum Bank as direct online payment methods", () => {
    expect(paymentGuides.filter((guide) => guide.availability === "To‘lovda mavjud").map((guide) => guide.paymentMethod)).toEqual(["click", "payme", "uzum"]);
  });

  it("keeps Uzum Nasiya limited to services where the option is active", () => {
    const nasiya = paymentGuides.find((guide) => guide.slug === "uzum-nasiya");
    expect(nasiya?.availability).toBe("Tanlangan xizmatlarda");
    expect(nasiya?.paymentMethod).toBe("uzum_nasiya");
  });

  it("does not expose the internal Nasiya markup in public guide content", () => {
    const publicContent = JSON.stringify(paymentGuides);
    expect(publicContent).not.toContain("+13%");
    expect(publicContent).not.toContain("13 foiz");
  });
});
