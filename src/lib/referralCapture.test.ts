import { beforeEach, describe, expect, it } from "vitest";
import { captureReferralFromUrl, clearReferralCode, getStoredReferralCode, storeReferralCode } from "./referralCapture";

describe("referralCapture", () => {
  beforeEach(() => {
    clearReferralCode();
    window.history.replaceState({}, "", "/auth");
  });

  it("captures ref and oauth_ref query params", () => {
    window.history.replaceState({}, "", "/auth?oauth_ref=med2026");
    expect(captureReferralFromUrl()).toBe("MED2026");
    expect(getStoredReferralCode()).toBe("MED2026");
  });

  it("rejects invalid referral codes", () => {
    expect(storeReferralCode("ab")).toBeNull();
    expect(storeReferralCode("bad code!")).toBeNull();
  });
});