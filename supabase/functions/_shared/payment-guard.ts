// Shared server-side guards for checkout creation.

const ALLOWED_RETURN_HOSTS = new Set([
  "med1.uz", "www.med1.uz", "ai.med1.uz", "admin.med1.uz", "clinic.med1.uz", "doctors.med1.uz",
]);

/** Returns a safe return URL (only Med1 domains / Lovable preview), or null. */
export function safeReturnUrl(raw: unknown, fallback = "https://med1.uz/payment/success"): string | null {
  const value = raw ? String(raw) : fallback;
  try {
    const u = new URL(value);
    const isLocal = u.hostname === "localhost";
    if (u.protocol !== "https:" && !isLocal) return null;
    if (!isLocal && !ALLOWED_RETURN_HOSTS.has(u.hostname) && !u.hostname.endsWith(".lovable.app")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

const PACKAGE_CODE_RE = /^[A-Za-z0-9_.-]{1,64}$/;

/**
 * Resolves the server-authoritative price.
 * - When package_code is supplied, it must be a real active package; its price wins.
 * - Otherwise the amount must match an active package price exactly.
 */
export async function resolvePackagePrice(
  admin: any,
  packageCode: string | null,
  amount: number,
): Promise<{ ok: true; amount: number; packageId: string | null } | { ok: false; error: string }> {
  if (packageCode) {
    if (!PACKAGE_CODE_RE.test(packageCode)) return { ok: false, error: "Noto'g'ri paket" };
    const { data: pkg } = await admin
      .from("payment_packages")
      .select("id, price")
      .eq("is_active", true)
      .eq("code", packageCode)
      .limit(1)
      .maybeSingle();
    if (!pkg || !(Number(pkg.price) > 0)) return { ok: false, error: "Paket topilmadi" };
    return { ok: true, amount: Number(pkg.price), packageId: pkg.id };
  }
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Noto'g'ri summa" };
  const { data: pkg } = await admin
    .from("payment_packages")
    .select("id, price")
    .eq("is_active", true)
    .eq("price", amount)
    .limit(1)
    .maybeSingle();
  if (!pkg) return { ok: false, error: "Summa hech qaysi tarifga mos kelmaydi" };
  return { ok: true, amount: Number(pkg.price), packageId: pkg.id };
}
