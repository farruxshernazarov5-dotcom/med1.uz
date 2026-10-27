import { describe, expect, it } from "vitest";
import { deviceLinkTokenFromUrl } from "./deviceLinkValidation";
describe("QR link safety", () => {
  const token = "a".repeat(48);
  it("accepts only canonical account pairing links", () => {
    expect(deviceLinkTokenFromUrl(`https://med1.uz/link-device?token=${token}`)).toBe(token);
    expect(deviceLinkTokenFromUrl(`https://evil.example/link-device?token=${token}`)).toBeNull();
    expect(deviceLinkTokenFromUrl(`https://med1.uz/other?token=${token}`)).toBeNull();
  });
  it("rejects malformed login credentials", () => {
    expect(deviceLinkTokenFromUrl("https://med1.uz/link-device?token=12345")).toBeNull();
  });
});