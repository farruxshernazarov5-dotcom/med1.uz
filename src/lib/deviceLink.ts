/**
 * QR device pairing: the signed-in browser shows a QR code, the Med ALL phone
 * app scans it and signs in to the same account. Tokens are single-use and
 * live for 5 minutes (see `device-link-qr` / `device-link-redeem` functions).
 */
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { publicOrigin } from "./nativeApp";

export const LINK_PATH = "/link-device";

export type DeviceLink = { token: string; url: string; expiresAt: number };

/** Creates a pairing token and the URL the QR code should encode. */
export async function createDeviceLink(): Promise<DeviceLink> {
  const { data, error } = await supabase.functions.invoke("device-link-qr", { body: {} });
  if (error || !data?.token) throw new Error(data?.error || error?.message || "link_failed");
  return {
    token: data.token as string,
    url: `${publicOrigin()}${LINK_PATH}?token=${data.token}`,
    expiresAt: Date.parse(data.expires_at),
  };
}

/** Renders the pairing URL as a QR image (data URL) for the dialog. */
export async function deviceLinkQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#0A2540", light: "#ffffff" } });
}

/** True once the phone has redeemed this token (polled by the QR dialog). */
export async function isDeviceLinkUsed(token: string): Promise<boolean> {
  const { data } = await supabase
    .from("device_link_tokens")
    .select("used_at")
    .eq("token", token)
    .maybeSingle();
  return !!data?.used_at;
}

/**
 * Redeems a scanned token on the phone and signs in. Returns the signed-in
 * email. Throws with a user-readable Uzbek message on failure.
 */
export async function redeemDeviceLink(token: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("device-link-redeem", { body: { token } });
  const code = data?.error || (error as any)?.message;
  if (error || !data?.token_hash) {
    if (code === "token_expired_or_used") throw new Error("QR kod muddati o'tgan yoki ishlatilgan. Kompyuterdagi sahifada yangi QR oling.");
    if (code === "invalid_token") throw new Error("QR kod noto'g'ri. Med ALL ilovasidagi skaner bilan qayta urinib ko'ring.");
    throw new Error("Ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.");
  }
  const { error: otpErr } = await supabase.auth.verifyOtp({
    type: "email",
    email: data.email,
    token_hash: data.token_hash,
  });
  if (otpErr) throw new Error("Kirish tasdiqlanmadi. QR kodni qayta yarating.");
  return data.email as string;
}
