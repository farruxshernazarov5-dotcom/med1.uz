/** Presentation-only attribution. Never use this to authorize an account. */
export function isClickExperience(pathname = window.location.pathname): boolean {
  if (pathname === '/click' || pathname.startsWith('/click/')) return true;
  try { return sessionStorage.getItem('med1_click_entry') === '1'; } catch { return false; }
}