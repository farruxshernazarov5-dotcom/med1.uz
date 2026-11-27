export type CanonicalPaymentStatus = "pending" | "paid" | "cancelled";

export interface PaymentStatusMeta {
  key: CanonicalPaymentStatus;
  label: string;
  receiptBanner: string;
  thermalBanner: string;
  description: string;
}

export function normalizePaymentStatus(raw?: string | null): CanonicalPaymentStatus {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "paid" || value === "completed" || value === "confirmed" || value === "success") {
    return "paid";
  }
  if (
    value === "cancelled" ||
    value === "canceled" ||
    value === "failed" ||
    value === "refunded" ||
    value === "reversed" ||
    value === "expired" ||
    value === "rejected"
  ) {
    return "cancelled";
  }
  return "pending";
}

export function getPaymentStatusMeta(raw?: string | null): PaymentStatusMeta {
  const key = normalizePaymentStatus(raw);
  if (key === "paid") {
    return {
      key,
      label: "Muvaffaqiyatli",
      receiptBanner: "TO'LOV MUVAFFAQIYATLI QABUL QILINDI",
      thermalBanner: "MUVAFFAQIYATLI TO'LANDI",
      description: "To'lov tasdiqlandi va xizmat faollashtirildi.",
    };
  }
  if (key === "cancelled") {
    return {
      key,
      label: "Bekor qilingan",
      receiptBanner: "TO'LOV BEKOR QILINGAN",
      thermalBanner: "TO'LOV BEKOR QILINGAN",
      description: "To'lov bekor qilindi yoki amalga oshmadi. Qayta urinib ko'rishingiz mumkin.",
    };
  }
  return {
    key,
    label: "Kutilmoqda",
    receiptBanner: "TO'LOV KUTILMOQDA",
    thermalBanner: "TO'LOV KUTILMOQDA",
    description: "To'lov bank tomonidan tasdiqlanishini kutmoqda.",
  };
}

export function formatUzumPaymentError(error?: string | null): string {
  const raw = String(error || "").trim();
  const lower = raw.toLowerCase();
  if (!raw) {
    return "Uzum Bank orqali to'lovni boshlab bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.";
  }
  if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("qayta kiring")) {
    return "Sessiya muddati tugagan. Tizimga qayta kirib, Uzum Bank to'lovini qaytadan boshlang.";
  }
  if (lower.includes("shartnoma") || lower.includes("contract")) {
    return "Pullik obuna uchun avval elektron shartnomani tasdiqlashingiz kerak.";
  }
  if (lower.includes("sozlanmagan") || lower.includes("503")) {
    return "Uzum Bank xizmati vaqtincha mavjud emas. Birozdan so'ng qayta urinib ko'ring.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("timeout")) {
    return "Server bilan aloqa uzildi. Internet aloqangizni tekshirib, qayta urinib ko'ring.";
  }
  return raw;
}