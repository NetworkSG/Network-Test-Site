import { useEffect, useState } from "react";

// Network-aware image sizing profile. Reads the (Chromium-only) Network
// Information API plus the user's Data Saver preference and the
// `prefers-reduced-data` media query, and returns clamps that <SmartImage>
// applies to its srcset width and quality. Safari + desktop Chrome (where
// the API is missing) get the 4g defaults — same behaviour as before this
// landed, just with srcset on top.
export type NetworkProfile = {
  /** Hard upper bound on the largest srcset width we'll request. */
  maxWidth: number;
  /** Multiplied into the requested quality (1.0 = baseline). */
  qualityScale: number;
  /** True on slow connections / Data Saver / prefers-reduced-data. Callers
   * use this to skip auto-advancing carousels and pre-loading non-visible
   * slides. */
  reduceMotion: boolean;
};

const DEFAULTS: NetworkProfile = {
  maxWidth: 1920,
  qualityScale: 1.0,
  reduceMotion: false,
};

const SLOW: NetworkProfile = {
  maxWidth: 480,
  qualityScale: 0.7,
  reduceMotion: true,
};

const MEDIUM: NetworkProfile = {
  maxWidth: 720,
  qualityScale: 0.85,
  reduceMotion: false,
};

function detect(): NetworkProfile {
  if (typeof navigator === "undefined") return DEFAULTS;
  // Type-narrow: navigator.connection isn't in the DOM lib types yet.
  const conn: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  // prefers-reduced-data lands the user explicitly opting into smaller payloads.
  const prefersReducedData = typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-data: reduce)").matches;

  if (prefersReducedData) return SLOW;
  if (!conn) return DEFAULTS;
  if (conn.saveData) return SLOW;
  const eff = String(conn.effectiveType || "").toLowerCase();
  if (eff === "slow-2g" || eff === "2g") return SLOW;
  if (eff === "3g") return MEDIUM;
  return DEFAULTS;
}

export function useNetworkProfile(): NetworkProfile {
  const [profile, setProfile] = useState<NetworkProfile>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    return detect();
  });

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const conn: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!conn || typeof conn.addEventListener !== "function") return;
    const onChange = () => setProfile(detect());
    conn.addEventListener("change", onChange);
    return () => conn.removeEventListener("change", onChange);
  }, []);

  return profile;
}
