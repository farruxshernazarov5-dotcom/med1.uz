import { expect, it } from "vitest";
import { hostedAssetUrl } from "./assetUrl";
it("loads native safety photographs from the real host, not phone localhost", () => {
  expect(hostedAssetUrl("/__l5e/assets-v1/photo/safety.webp", true)).toBe("https://med1.uz/__l5e/assets-v1/photo/safety.webp");
  expect(hostedAssetUrl("/__l5e/assets-v1/photo/safety.webp", false)).toBe("/__l5e/assets-v1/photo/safety.webp");
  expect(hostedAssetUrl("/assets/logo.webp", true)).toBe("/assets/logo.webp");
});