import { describe, expect, it } from "vitest";
import { buildCardQrPayload, parseCardFromQr } from "./cardQr";

describe("cardQr", () => {
  it("builds canonical card transfer QR URL", () => {
    expect(buildCardQrPayload("7700 1234 5678 9012", "https://med1.uz/")).toBe(
      "https://med1.uz/mobile-profile?section=cash_wallet&pay=7700123456789012",
    );
  });

  it("extracts 16-digit card from Med ALL QR URL", () => {
    expect(
      parseCardFromQr("https://med1.uz/mobile-profile?section=cash_wallet&pay=7700123456789012"),
    ).toBe("7700123456789012");
  });

  it("extracts 16-digit card from formatted digits and custom scheme", () => {
    expect(parseCardFromQr("7700 1234 5678 9012")).toBe("7700123456789012");
    expect(parseCardFromQr("medall:card:7700123456789012")).toBe("7700123456789012");
  });

  it("rejects non-card URLs and invalid lengths", () => {
    expect(parseCardFromQr("https://med1.uz/link-device?token=abc")).toBeNull();
    expect(parseCardFromQr("77001234")).toBeNull();
    expect(parseCardFromQr("")).toBeNull();
  });
});