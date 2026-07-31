import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SITE = "https://www.med1.uz";

/** Route prefixes that must never be indexed (private / transactional areas). */
const NOINDEX_PREFIXES = [
  "/dashboard",
  "/admin",
  "/auth",
  "/reset-password",
  "/forgot-password",
  "/oauth",
  "/payment-success",
  "/check-in",
  "/staff-check-in",
  "/unsubscribe",
  "/booking",
  "/verify",
  "/contract-verify",
  "/report-verification",
  "/partner",
];

/** Query params that must be stripped from the canonical URL. */
const STRIP_PARAMS = /^(utm_|fbclid|gclid|yclid|ref|partner|diag|from|source)/i;

function buildCanonicalPath(pathname: string, search: string) {
  // Collapse duplicate slashes and drop a trailing slash (except root)
  let path = pathname.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");

  const params = new URLSearchParams(search);
  const kept = new URLSearchParams();
  // Keep only params that genuinely change the content (e.g. paging, category)
  for (const [k, v] of params.entries()) {
    if (STRIP_PARAMS.test(k)) continue;
    if (["page", "category", "city", "specialty", "q"].includes(k)) kept.append(k, v);
  }
  const qs = kept.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Sitewide canonical + robots fallback for every route.
 * Pages that render their own <SEO /> override these tags (Helmet dedupes
 * by name/property and the per-page canonical is emitted later in the tree).
 */
export function RouteCanonical() {
  const { pathname, search } = useLocation();
  const path = buildCanonicalPath(pathname, search);
  const noindex = NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <Helmet>
      <link rel="canonical" href={`${SITE}${path === "/" ? "/" : path}`} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"}
      />
      <meta property="og:url" content={`${SITE}${path === "/" ? "/" : path}`} />
    </Helmet>
  );
}

export default RouteCanonical;
