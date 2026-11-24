/** Pure helpers for Med ALL Avans Card QR generation and scanning. */

const CARD_RE = /^\d{16}$/;

export function buildCardQrPayload(card: string, origin: string): string {
  const clean = card.replace(/\D/g, "").slice(0, 16);
  return `${origin.replace(/\/+$/, "")}/mobile-profile?section=cash_wallet&pay=${clean}`;
}

export function parseCardFromQr(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Custom medall:card:<16 digits>
  if (/^medall:card:/i.test(trimmed)) {
    const digits = trimmed.replace(/^medall:card:/i, "").replace(/\D/g, "");
    return CARD_RE.test(digits) ? digits : null;
  }

  // 2. URL with ?pay=<16 digits>
  try {
    const url = new URL(trimmed);
    const pay = (url.searchParams.get("pay") ?? "").replace(/\D/g, "");
    if (CARD_RE.test(pay)) return pay;
    return null;
  } catch {
    // Not a URL — check plain digits
  }

  // 3. Plain 16-digit card number (with optional spaces or dashes)
  if (/^[\d\s-]+$/.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, "");
    return CARD_RE.test(digits) ? digits : null;
  }

  return null;
}