import { expect, it } from "vitest";
import { DOCTOR_REGION_BOUNDS, doctorRegionBounds } from "./doctorRegionBounds";
it("includes all 14 selectable regions, even when no doctors are listed", () => {
  expect(Object.keys(DOCTOR_REGION_BOUNDS)).toHaveLength(14);
  expect(doctorRegionBounds("Сурхандарьинская область")).toEqual([[37.17721, 66.52073], [39.03368, 68.40534]]);
});
it("fits the entire Samarkand region rather than a 10km city radius", () => {
  expect(doctorRegionBounds("Самаркандская область")).toEqual([[39.29277, 65.11971], [40.61916, 67.50444]]);
});