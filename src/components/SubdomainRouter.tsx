import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SUBDOMAIN_ROUTING_ENABLED,
  currentSubdomain,
  isActiveSubdomainHost,
  isProductionHost,
  ownerOf,
  urlForPath,
} from "@/lib/subdomains";

/**
 * Subdomen marshrutizatsiyasi:
 *  1. Subdomen ildizi ("/") ochilsa — o'sha bo'lim bosh sahifasiga o'tkazadi.
 *  2. Subdomenga tegishli bo'lmagan sahifa ochilsa — to'g'ri domenga yo'naltiradi.
 *  3. Sayt ichidagi havolalar bosilganda — kerakli subdomenga o'tkazadi.
 */
const SubdomainRouter = () => {
  const location = useLocation();

  // 1 + 2: joriy manzilni tekshirish
  useEffect(() => {
    if (!isProductionHost()) return;
    const host = window.location.hostname;
    const sub = currentSubdomain(host);
    const path = location.pathname;

    if (sub.key !== "www" && (path === "/" || path === "")) {
      window.location.replace(`https://${host}${sub.home}${location.search}`);
      return;
    }

    const target = ownerOf(path);
    if (target.host !== host && isActiveSubdomainHost(target.host)) {
      window.location.replace(`https://${target.host}${path}${location.search}${location.hash}`);
    }
  }, [location.pathname, location.search, location.hash]);

  // 3: ichki havolalarni ushlab, kerakli subdomenga yuborish
  useEffect(() => {
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
