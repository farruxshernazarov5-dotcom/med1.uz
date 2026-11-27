import { describe, expect, it } from "vitest";
import {
  formatUzumPaymentError,
  getPaymentStatusMeta,
  normalizePaymentStatus,
} from "./paymentStatus";

describe("paymentStatus helpers", () => {
  it("maps raw database and Uzum statuses into pending, paid, and cancelled", () => {
    expect(normalizePaymentStatus("pending")).toBe("pending");
    expect(normalizePaymentStatus("CREATED")).toBe("pending");
    expect(normalizePaymentStatus("paid")).toBe("paid");
    expect(normalizePaymentStatus("completed")).toBe("paid");
    expect(normalizePaymentStatus("CONFIRMED")).toBe("paid");
    expect(normalizePaymentStatus("cancelled")).toBe("cancelled");
    expect(normalizePaymentStatus("failed")).toBe("cancelled");
    expect(normalizePaymentStatus("refunded")).toBe("cancelled");
    expect(normalizePaymentStatus("REVERSED")).toBe("cancelled");
  });

  it("returns exact Uzbek labels and receipt banners for every status", () => {
    expect(getPaymentStatusMeta("pending").label).toBe("Kutilmoqda");
    expect(getPaymentStatusMeta("pending").receiptBanner).toBe("TO'LOV KUTILMOQDA");
    expect(getPaymentStatusMeta("paid").label).toBe("Muvaffaqiyatli");
    expect(getPaymentStatusMeta("paid").receiptBanner).toBe("TO'LOV MUVAFFAQIYATLI QABUL QILINDI");
    expect(getPaymentStatusMeta("cancelled").label).toBe("Bekor qilingan");
    expect(getPaymentStatusMeta("refunded").receiptBanner).toBe("TO'LOV BEKOR QILINGAN");
  });

  it("turns technical Uzum failures into clear Uzbek messages", () => {
    expect(formatUzumPaymentError("Failed to fetch")).toContain("Internet aloqangizni tekshirib");
    expect(formatUzumPaymentError("Unauthorized")).toContain("Tizimga qayta kirib");
    expect(formatUzumPaymentError("")).toContain("qayta urinib ko'ring");
  });
});