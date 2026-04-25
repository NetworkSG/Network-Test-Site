import { Helmet } from "react-helmet-async";

const SITE = "https://www.networksg.net";
const DEFAULT_OG = `${SITE}/og-image.webp`;

interface SeoProps {
  title: string;
  description: string;
  /** Path or absolute URL. Defaults to current document location. */
  canonical?: string;
  ogImage?: string;
  /** Set true on private/utility pages we don't want indexed. */
  noindex?: boolean;
  /** Optional additional JSON-LD blocks rendered as <script type="application/ld+json"> */
  jsonLd?: object | object[];
}

export function Seo({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const canonicalUrl = canonical
    ? canonical.startsWith("http")
      ? canonical
      : `${SITE}${canonical.startsWith("/") ? canonical : `/${canonical}`}`
    : undefined;

  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(b)}
        </script>
      ))}
    </Helmet>
  );
}
