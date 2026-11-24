import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SUBDOMAIN_ROUTING_ENABLED,
  currentSubdomain,
  isProductionHost,
  redirectTargetForLocation,
  urlForPath,
} from "@/lib/subdomains";

const BOUNCE_KEY = "med1_sub_redirect";
const BOUNCE_WINDOW_MS = 5000;

function canSafelyRedirectTo(targetHost: string, currentHost: string): boolean {
  try {
    const raw = sessionStorage.getItem(BOUNCE_KEY);
    if (raw) {
      const prev = JSON.parse(raw) as { from?: string; to?: string; at?: number };
      if (prev.from === currentHost && prev.to === targetHost && prev.at && Date.now() - prev.at < BOUNCE_WINDOW_MS) {
        return false;
      }
    }
    sessionStorage.setItem(BOUNCE_KEY, JSON.stringify({ from: currentHost, to: targetHost, at: Date.now() }));
  } catch {
    // sessionStorage unavailable
  }
  return true;
}

/**
 * Subdomen marshrutizatsiyasi:
 *  1. Subdomen ildizi ("/") ochilsa — o'sha bo'lim bosh sahifasiga o'tkazadi.
 *  2. Subdomenga tegishli bo'lmagan sahifa ochilsa — to'g'ri domenga yo'naltiradi.
 *  3. Sayt ichidagi havolalar bosilganda — kerakli subdomenga o'tkazadi.
 */
const SubdomainRouter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1 + 2: joriy manzilni tekshirish
  useEffect(() => {
    if (!SUBDOMAIN_ROUTING_ENABLED) return;
    if (!isProductionHost()) return;
    const host = window.location.hostname;
    const sub = currentSubdomain(host);
    const path = location.pathname;

    if (sub.key !== "www" && (path === "/" || path === "")) {
      navigate(`${sub.home}${location.search}${location.hash}`, { replace: true });
      return;
    }

    const redirectTarget = redirectTargetForLocation(path, host, location.search, location.hash);
    if (redirectTarget) {
      const targetHost = new URL(redirectTarget).host;
      if (canSafelyRedirectTo(targetHost, host)) {
        window.location.replace(redirectTarget);
      }
    }
  }, [location.pathname, location.search, location.hash, navigate]);


  // 3: ichki havolalarni ushlab, kerakli subdomenga yuborish
  useEffect(() => {
    if (!SUBDOMAIN_ROUTING_ENABLED) return;
    if (!isProductionHost()) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target && anchor.target !== "_self") return;
      const [pathname] = href.split(/[?#]/);
      const url = urlForPath(pathname);
      if (!url) return;
      e.preventDefault();
      window.location.href = `https://${new URL(url).host}${href}`;
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
};

export default SubdomainRouter;
