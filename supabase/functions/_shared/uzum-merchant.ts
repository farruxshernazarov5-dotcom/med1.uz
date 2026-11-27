export const UZUM_METHODS = ["check", "create", "confirm", "reverse", "status"] as const;
export type UzumMethod = (typeof UZUM_METHODS)[number];

export function uzumMethodFromPath(pathname: string): UzumMethod | null {
  const candidate = pathname.split("/").filter(Boolean).at(-1) ?? "";
  return (UZUM_METHODS as readonly string[]).includes(candidate) ? candidate as UzumMethod : null;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function uzumOrderIdFromParams(params: Record<string, unknown>): string | null {
  for (const key of ["order_id", "payment_id", "account"]) {
    const value = params[key];
    if (typeof value === "string" && isUuid(value.trim())) return value.trim();
  }
  return null;
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    const a = index < left.length ? left.charCodeAt(index) : 0;
    const b = index < right.length ? right.charCodeAt(index) : 0;
    difference |= a ^ b;
  }
  return difference === 0;
}

export function verifyUzumBasicAuth(
  authorization: string | null,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  if (!authorization || !expectedUsername || !expectedPassword) return false;
  const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(authorization.trim());
  if (!match) return false;

  let decoded: string;
  try {
    decoded = atob(match[1]);
  } catch {
    return false;
  }

  const separator = decoded.indexOf(":");
  if (separator < 1) return false;
  const usernameMatches = constantTimeEqual(decoded.slice(0, separator), expectedUsername);
  const passwordMatches = constantTimeEqual(decoded.slice(separator + 1), expectedPassword);
  return usernameMatches && passwordMatches;
}

export function expectedUzumServiceId(
  metadata: Record<string, unknown> | null | undefined,
  liveServiceId: number | null,
  sandboxServiceId: number | null,
): number | null {
  const stored = Number(metadata?.uzum_service_id);
  if (Number.isSafeInteger(stored) && stored > 0) return stored;
  return metadata?.environment === "sandbox" ? sandboxServiceId ?? liveServiceId : liveServiceId;
}

export function uzumResponseData(paymentId: string) {
  return { order_id: { value: paymentId } };
}

export function buildUzumPaymentUrl(input: {
  serviceId: number;
  paymentId: string;
  amountTiyin: number;
  returnUrl: string;
}): string {
  const params = new URLSearchParams({
    serviceId: String(input.serviceId),
    order_id: input.paymentId,
    amount: String(input.amountTiyin),
    redirectUrl: input.returnUrl,
  });
  return `https://www.uzumbank.uz/open-service?${params.toString()}`;
}
