export const DEVICE_LINK_TOKEN_RE = /^[a-f0-9]{48}$/;
export function deviceLinkTokenFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["med1.uz", "www.med1.uz"].includes(url.hostname) || url.port || url.username || url.password || url.pathname !== "/link-device") return null;
    const token = url.searchParams.get("token") ?? "";
    return DEVICE_LINK_TOKEN_RE.test(token) ? token : null;
  } catch { return null; }
}