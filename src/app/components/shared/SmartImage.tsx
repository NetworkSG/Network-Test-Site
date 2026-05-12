import { useEffect, useRef, useState } from "react";
import { thumbnailUrl } from "../../utils/image-url";
import { useNetworkProfile } from "./useNetworkProfile";

// Standard srcset widths. We over-cover desktop a touch (1440px) so that
// retina laptops on fast connections still get crisp images, and start
// at 320px so a phone on Slow 3G doesn't have to pull a 720px file.
const STANDARD_WIDTHS = [320, 480, 720, 1080, 1440] as const;

type SmartImageProps = {
  src: string;
  alt: string;
  /** Standard `<img>` sizes attribute. Drives which width the browser picks. */
  sizes?: string;
  /** Intrinsic dimensions. Strongly recommended — kills layout shift while
   *  the image streams in. Either pixel numbers or strings ("auto"). */
  width?: number | string;
  height?: number | string;
  /** True on the page's LCP image. Adds fetchpriority="high" + loading="eager". */
  priority?: boolean;
  /** "blur" renders a 16px blurred copy underneath that fades out on load.
   *  Skipped automatically on the smallest connections to save the extra request. */
  placeholder?: "blur" | "none";
  /** Base quality (default 75). Network profile scales this down on 2G/3G. */
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Forwarded onLoad — useful if a parent wants to crossfade. */
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** referrerpolicy — Google review avatars need "no-referrer". */
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
};

export function SmartImage({
  src,
  alt,
  sizes = "100vw",
  width,
  height,
  priority = false,
  placeholder = "none",
  quality = 75,
  className,
  style,
  onLoad,
  referrerPolicy,
}: SmartImageProps) {
  const profile = useNetworkProfile();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const mainRef = useRef<HTMLImageElement>(null);

  // Reset error state when the source changes so a fresh URL gets a fresh chance.
  useEffect(() => { setErrored(false); }, [src]);

  // Cached-image race: when an <img> is already cached, the browser may have
  // finished loading it before React attached the onLoad listener, so onLoad
  // never fires and `loaded` stays false — leaving the main image at opacity
  // 0 forever in the placeholder="blur" path. After mount, check the actual
  // image element and flip the flag if it's already complete.
  useEffect(() => {
    const el = mainRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  // Caller is expected to pass an already-resolved URL (i.e. having run
  // resolveImg() on figma:asset references). Bundled figma assets and
  // data:/blob: URLs aren't http: so they skip the srcset path entirely.
  const resolved = src;
  const isHttp = typeof resolved === "string" && /^https?:\/\//i.test(resolved);

  // Clamp by network profile and scale quality.
  const cap = profile.maxWidth;
  const q = Math.max(35, Math.min(95, Math.round(quality * profile.qualityScale)));

  // Build srcset. For non-http sources (figma:asset, data:, blob:), skip the
  // srcset and let the browser use the resolved URL directly.
  let srcSet: string | undefined;
  let mainSrc = resolved;
  if (isHttp) {
    const widths = STANDARD_WIDTHS.filter((w) => w <= cap);
    // Always include the cap itself so high-DPI screens have a clear top end.
    if (!widths.includes(cap as any) && cap < STANDARD_WIDTHS[STANDARD_WIDTHS.length - 1]) widths.push(cap);
    srcSet = widths.map((w) => `${thumbnailUrl(resolved, w, q)} ${w}w`).join(", ");
    // Fallback `src` for ancient browsers / View Source: pick the median
    // width so the file size is reasonable either way.
    const mid = widths[Math.floor(widths.length / 2)] || 720;
    mainSrc = thumbnailUrl(resolved, mid, q);
  }

  // LQIP placeholder — only for http sources, only when the caller asked for
  // it, and only when we're not already on the slowest network (where the
  // extra round-trip is the very thing we're trying to save).
  const showBlur = placeholder === "blur" && isHttp && !profile.reduceMotion;
  const blurSrc = showBlur ? thumbnailUrl(resolved, 24, 30) : null;

  const imgStyle: React.CSSProperties = {
    ...style,
    transition: showBlur ? "opacity 300ms ease" : style?.transition,
    opacity: showBlur && !loaded ? 0 : style?.opacity ?? 1,
  };

  // Graceful fallback when the network/CDN returns an error: render a neutral
  // tile in place of the broken <img> so layouts don't collapse to a black void
  // (or show a UA-default broken-image glyph). Uses the same className/style so
  // object-fit, positioning, and intrinsic sizing carry over.
  if (errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={className}
        style={{
          ...style,
          background:
            "linear-gradient(135deg, #1a1916 0%, #2a2724 50%, #1a1916 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(255,255,255,0.25)" }} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  const imgEl = (
    <img
      src={mainSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      // Browser-native priority hints. `fetchpriority` is forwarded as a
      // lowercase attribute by React 19 / Vite even though the HTMLImageElement
      // typing still calls it `fetchPriority` in some versions.
      {...({ fetchpriority: priority ? "high" : "auto" } as any)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy={referrerPolicy}
      onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
      onError={() => setErrored(true)}
      className={className}
      style={imgStyle}
    />
  );

  if (!showBlur || !blurSrc) return imgEl;

  // Wrap in a relative container so the blur sits behind the full image.
  // Container takes the same className so layout / object-fit rules apply
  // to it; the inner <img>s stretch to fill.
  return (
    <span className={className} style={{ position: "relative", display: "block", overflow: "hidden", ...style }}>
      <img
        src={blurSrc}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "blur(16px)",
          transform: "scale(1.08)",
          transition: "opacity 300ms ease",
          opacity: loaded ? 0 : 1,
        }}
      />
      <img
        ref={mainRef}
        src={mainSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        {...({ fetchpriority: priority ? "high" : "auto" } as any)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy={referrerPolicy}
        onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
        onError={() => setErrored(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transition: "opacity 300ms ease", opacity: loaded ? 1 : 0 }}
      />
    </span>
  );
}
