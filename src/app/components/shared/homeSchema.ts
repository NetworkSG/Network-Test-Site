// Structured data for the homepage. Uses LIVE Google Maps data from the
// `/google-reviews/network` Supabase edge function (see useGoogleReviews.ts)
// so AggregateRating + Review schema match the real Google Business Profile.
//
// All review text is sourced from public Google Maps reviews — these are
// third-party reviews republished on our site, not self-serving reviews.

import type { CachedGoogleReviewsPayload } from "../useGoogleReviews";

const SITE = "https://www.networksg.net";

export function buildHomeStructuredData(
  payload: CachedGoogleReviewsPayload | null,
) {
  const reviews = payload?.reviews ?? [];
  const rating = payload?.rating ?? null;
  const totalRatings = payload?.totalRatings ?? null;

  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE}/#localbusiness`,
    name: "Network",
    alternateName: "Network Singapore",
    url: SITE,
    logo: `${SITE}/handshake-logo.webp`,
    image: `${SITE}/og-image.webp`,
    description:
      "Singapore's interior design matching service. Get paired with vetted interior design firms that fit your style, budget, and timeline.",
    priceRange: "Free",
    areaServed: { "@type": "Country", name: "Singapore" },
    address: { "@type": "PostalAddress", addressCountry: "SG" },
  };

  // Only emit aggregateRating when we have real data from Google.
  if (rating !== null && totalRatings !== null && totalRatings > 0) {
    localBusiness.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: totalRatings,
      reviewCount: reviews.length || totalRatings,
    };
  }

  if (reviews.length > 0) {
    localBusiness.review = reviews.map((r) => {
      const review: Record<string, unknown> = {
        "@type": "Review",
        author: { "@type": "Person", name: r.author || "Anonymous" },
        reviewRating: {
          "@type": "Rating",
          ratingValue: typeof r.rating === "number" ? r.rating : 5,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.text || "",
        publisher: { "@type": "Organization", name: "Google" },
      };
      // Convert epoch seconds → ISO date if provided.
      if (r.time && Number.isFinite(r.time)) {
        review.datePublished = new Date(r.time * 1000).toISOString().slice(0, 10);
      }
      return review;
    });
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: SITE,
    name: "Network",
    publisher: { "@id": `${SITE}/#localbusiness` },
  };

  return [localBusiness, website];
}
