import { useEffect } from "react";

/**
 * /api-docs — renders the static Swagger UI page (public/api-docs.html)
 * inside the SPA so deep links work. The static HTML loads /openapi.json
 * from a CDN-served Swagger UI bundle (no npm dependency added).
 */
export default function ApiDocsPage() {
  useEffect(() => {
    document.title = "AI Services API — OpenAPI 3.0 · MED1.UZ";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content",
      "Interactive OpenAPI 3.0 / Swagger UI documentation for the MED1.UZ AI Services API — 14 medical AI endpoints for B2B partners.");
  }, []);

  return (
    <iframe
      src="/api-docs.html"
      title="MED1.UZ AI Services API — Swagger UI"
      style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
    />
  );
}
