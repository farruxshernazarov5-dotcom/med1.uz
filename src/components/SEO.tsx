import { Helmet } from "react-helmet-async";

const SITE = "https://med1.uz";

type JsonLd = Record<string, any> | Record<string, any>[];

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. "/clinics/123"
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  jsonLd?: JsonLd;
  noindex?: boolean;
}

/**
 * Per-route head. Overrides title/description/canonical/og:* from index.html.
 * Use on every leaf route to avoid duplicate snippets in search results.
 */
export function SEO({ title, description, path, ogType = "website", ogImage, jsonLd, noindex }: SEOProps) {
  const url = `${SITE}${path}`;
  const shortDesc = description.length > 158 ? description.slice(0, 155).trim() + "…" : description;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={shortDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={shortDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={shortDesc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}

export default SEO;
