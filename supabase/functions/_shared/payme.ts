// Payme (Paycom) Merchant API uchun umumiy yordamchilar.
// Hujjat: https://developer.help.paycom.uz/protokol-merchant-api/

export const paymeCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

/** Payme JSON-RPC xato kodlari */
export const PAYME_ERR = {
  TRANSPORT: { code: -32300, message: { uz: "Transport xatosi", ru: "Ошибка транспорта", en: "Transport error" } },
  PARSE: { code: -32700, message: { uz: "JSON o'qib bo'lmadi", ru: "Ошибка разбора JSON", en: "Parse error" } },
  INVALID_RPC: { code: -32600, message: { uz: "Noto'g'ri RPC so'rov", ru: "Неверный RPC запрос", en: "Invalid RPC request" } },
  METHOD_NOT_FOUND: { code: -32601, message: { uz: "Metod topilmadi", ru: "Метод не найден", en: "Method not found" } },
  INVALID_PARAMS: { code: -32602, message: { uz: "Noto'g'ri parametrlar", ru: "Неверные параметры", en: "Invalid params" } },
  INTERNAL: { code: -32400, message: { uz: "Ichki xatolik", ru: "Внутренняя ошибка", en: "Internal error" } },
  INVALID_AUTH: { code: -32504, message: { uz: "Ruxsat yetarli emas", ru: "Недостаточно привилегий", en: "Insufficient privileges" } },
  INVALID_AMOUNT: { code: -31001, message: { uz: "Summa noto'g'ri", ru: "Неверная сумма", en: "Invalid amount" } },
  TX_NOT_FOUND: { code: -31003, message: { uz: "Tranzaksiya topilmadi", ru: "Транзакция не найдена", en: "Transaction not found" } },
  CANNOT_PERFORM: { code: -31008, message: { uz: "Amalni bajarib bo'lmaydi", ru: "Невозможно выполнить операцию", en: "Unable to perform operation" } },
  CANNOT_CANCEL: { code: -31007, message: { uz: "Buyurtma yakunlangan, bekor qilib bo'lmaydi", ru: "Заказ выполнен, отмена невозможна", en: "Order completed, cannot cancel" } },
  ORDER_NOT_FOUND: { code: -31050, message: { uz: "Buyurtma topilmadi", ru: "Заказ не найден", en: "Order not found" } },
  ORDER_UNAVAILABLE: { code: -31051, message: { uz: "Buyurtma to'lov uchun mavjud emas", ru: "Заказ недоступен для оплаты", en: "Order is not available for payment" } },
} as const;

/** Payme tranzaksiya kutish muddati — 12 soat (millisekund) */
export const PAYME_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export type PaymeFiscalItem = {
  title: string;
  price: number; // tiyin
  count: number;
  code: string; // MXIK
  package_code: string;
  vat_percent: number;
  discount?: number;
  units?: number;
};

/**
 * CheckPerformTransaction javobidagi `detail` obyekti (soliq oborotida chek ko'rinishi uchun).
 * https://developer.help.paycom.uz/metody-merchant-api/checktransaction
 */
export function buildFiscalDetail(
  item: { title: string; mxik_code: string; package_code: string; vat_percent: number; units?: number | null } | null,
  amountTiyin: number,
  fallbackTitle = "MED1.UZ xizmati",
): { receipt_type: number; items: PaymeFiscalItem[] } {
  const fiscal: PaymeFiscalItem = {
    title: item?.title ?? fallbackTitle,
    price: amountTiyin,
    count: 1,
    code: item?.mxik_code ?? "10305001001000000",
    package_code: item?.package_code ?? "1471385",
    vat_percent: item?.vat_percent ?? 0,
  };
  if (item?.units) fiscal.units = item.units;
  return { receipt_type: 0, items: [fiscal] };
}

function paymeKeys(): string[] {
  return [
    Deno.env.get("PAYME_SECRET_KEY"),
    Deno.env.get("PAYME_SECRET_KEY_TEST"),
    Deno.env.get("PAYME_TEST_KEY"),
  ]
    // Sozlamalarda tasodifiy bo'sh joy/yangi qator bo'lsa ham ishlashi uchun tozalaymiz.
    .map((k) => (k ?? "").trim())
    .filter((k) => k.length > 0);
}

/**
 * Basic auth tekshiruvi: base64("Paycom:KEY"). Test va live kalitlar qo'llab-quvvatlanadi.
 * Paycom ba'zan login sifatida "Paycom" o'rniga merchant ID yuborishi mumkin,
 * shuning uchun faqat parol (kalit) qismini solishtiramiz.
 */
export function verifyPaymeAuth(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const match = /^basic\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return false;

  let decoded = "";
  try {
    decoded = atob(match[1].trim());
  } catch {
    return false;
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  const password = decoded.slice(sep + 1).trim();
  if (!password) return false;

  return paymeKeys().some((key) => key === password);
}

/** Diagnostika uchun (maxfiy qiymatlarni oshkor qilmaydi). */
export function paymeAuthDebug(authHeader: string | null) {
  return {
    auth_present: Boolean(authHeader),
    auth_scheme: authHeader ? authHeader.trim().split(/\s+/)[0] : null,
    keys_configured: paymeKeys().length,
  };
}
