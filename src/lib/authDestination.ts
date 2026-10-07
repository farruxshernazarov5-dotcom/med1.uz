/** Validate a navigation destination without accepting external URLs or control characters. */
export function safeAuthDestination(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const base = 'https://med1.uz';
    const parsed = new URL(value, base);
    if (parsed.origin !== base || /^\/(?:auth|reset-password|forgot-password)(?:\/|$)/.test(parsed.pathname)) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch { return null; }
}

export function signInDestination(path: string): string {
  return `/auth?next=${encodeURIComponent(safeAuthDestination(path) ?? '/mobile-profile')}`;
}