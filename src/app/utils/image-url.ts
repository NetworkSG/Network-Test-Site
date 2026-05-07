// Build a CDN-resized URL for a given image source.
//
// We previously preferred Supabase's native `/render/image/` endpoint, but
// this project's Supabase tenant has the Image Transformations feature
// disabled (it returns 403 FeatureNotEnabled). We therefore route every
// public URL through the free `images.weserv.nl` proxy, which resizes to
// any width/quality we ask for and serves WebP automatically.
//
// Falls through unchanged for non-http URLs (data:, blob:, local assets,
// figma:asset references that callers should already have resolved via
// resolveImg before calling here).
//
// Extracted from DesignerProfile.tsx so SmartImage can use it without a
// circular import. The original export at DesignerProfile.tsx is kept as
// a re-export for backwards compatibility.
export function thumbnailUrl(src: string, width: number, quality = 75): string {
  if (!src || typeof src !== "string") return src;
  if (!/^https?:\/\//i.test(src)) return src;

  // Strip any pre-existing query params (we may have been handed a URL that
  // already has ?width=…&quality=…). Wrapping a URL with query string in
  // weserv as-is double-encodes the ? and the params get treated as part of
  // the upstream URL rather than weserv's own resize knobs.
  let cleanSrc = src;
  const qIdx = src.indexOf("?");
  if (qIdx >= 0) cleanSrc = src.slice(0, qIdx);

  // Some legacy database rows store cover/gallery URLs that point at
  // Supabase's `/render/image/` endpoint. That endpoint returns 403
  // FeatureNotEnabled on this tenant, so weserv would fail to fetch it.
  // Rewrite to the plain `/object/public/` form, which is always available.
  cleanSrc = cleanSrc.replace("/storage/v1/render/image/public/", "/storage/v1/object/public/");

  // weserv expects the URL without the protocol scheme.
  const stripped = cleanSrc.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&w=${width}&q=${quality}&output=webp`;
}
