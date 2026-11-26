import { describe, expect, it } from "vitest";
import {
  expectedUzumServiceId,
  uzumMethodFromPath,
  uzumOrderIdFromParams,
  verifyUzumBasicAuth,
} from "../../supabase/functions/_shared/uzum-merchant";

const ORDER_ID = "5c398d7e-76b6-11ee-96da-f3a095c6289d";

describe("Uzum Merchant API protocol", () => {
  it("accepts exactly the five official webhook paths through direct and proxy URLs", () => {
    for (const method of ["check", "create", "confirm", "reverse", "status"]) {
      expect(uzumMethodFromPath(`/functions/v1/uzum-webhook/${method}`)).toBe(method);
      expect(uzumMethodFromPath(`/uzum/${method}`)).toBe(method);
      expect(uzumMethodFromPath(`/api/uzum/${method}`)).toBe(method);
    }
    expect(uzumMethodFromPath("/uzum")).toBeNull();
    expect(uzumMethodFromPath("/uzum/unknown")).toBeNull();
  });

  it("requires the exact Basic Auth username and password", () => {
    const header = `Basic ${btoa("med1:correct-password")}`;
    expect(verifyUzumBasicAuth(header, "med1", "correct-password")).toBe(true);
    expect(verifyUzumBasicAuth(header, "med1", "wrong-password")).toBe(false);
    expect(verifyUzumBasicAuth(header, "wrong-user", "correct-password")).toBe(false);
    expect(verifyUzumBasicAuth(`Bearer ${btoa("med1:correct-password")}`, "med1", "correct-password")).toBe(false);
    expect(verifyUzumBasicAuth("Basic broken", "med1", "correct-password")).toBe(false);
  });

  it("reads the platform order UUID from supported Merchant params", () => {
    expect(uzumOrderIdFromParams({ order_id: ORDER_ID })).toBe(ORDER_ID);
    expect(uzumOrderIdFromParams({ payment_id: ORDER_ID })).toBe(ORDER_ID);
    expect(uzumOrderIdFromParams({ account: ORDER_ID })).toBe(ORDER_ID);
    expect(uzumOrderIdFromParams({ account: "123456789" })).toBeNull();
    expect(uzumOrderIdFromParams({})).toBeNull();
  });

  it("binds each order to its stored service ID and environment", () => {
    expect(expectedUzumServiceId({ uzum_service_id: 101202, environment: "sandbox" }, 101202, 999999)).toBe(101202);
    expect(expectedUzumServiceId({ environment: "sandbox" }, 101202, 999999)).toBe(999999);
    expect(expectedUzumServiceId({ environment: "live" }, 101202, 999999)).toBe(101202);
    expect(expectedUzumServiceId({}, null, null)).toBeNull();
  });
});
