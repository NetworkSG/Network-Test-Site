import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

/**
 * Raw shape returned by the Supabase edge function.
 * The server caches this in KV for 30 days and refreshes monthly via cron.
 */
export type CachedGoogleReview = {
  author: string;
  initial: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhoto: string | null;
  photoUrl: string | null;
  time: number;
};

export type CachedGoogleReviewsPayload = {
  source: "outscraper" | "google" | "mock" | "empty";
  placeId: string | null;
  rating: number;
  totalRatings: number;
  reviews: CachedGoogleReview[];
  fetchedAt: string;
  expiresAt: string;
};

/**
 * UI shape consumed by <ReviewCard /> in DesignerProfile.tsx.
 * We translate Google's payload into this shape so the existing
 * masonry/grid component doesn't need to change.
 */
export type UiReview = {
  // Identity
  name: string;
  initial: string;
  bgColor: string;
  textColor: string;
  profilePhoto?: string | null;
  // Content
  title: string;
  text: string;
  fullText: string;
  date: string;
  rating: number;
  // Optional media (Google reviews don't supply project images)
  img?: string;
  hasVideo?: boolean;
};

const AVATAR_PALETTE: Array<{ bg: string; text: string }> = [
  { bg: "bg-[#fef3c7]", text: "text-[#a16207]" },
  { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
  { bg: "bg-[#dcfce7]", text: "text-[#166534]" },
  { bg: "bg-[#fce7f3]", text: "text-[#9d174d]" },
  { bg: "bg-[#e9d5ff]", text: "text-[#6b21a8]" },
  { bg: "bg-[#ffe4e6]", text: "text-[#9f1239]" },
];

function pickPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function deriveTitle(text: string): string {
  if (!text) return "Google Review";
  // Use the first sentence (or first ~60 chars) as a title.
  const firstSentence = text.split(/(?<=[.!?])\s/)[0] || text;
  return firstSentence.length > 80 ? firstSentence.slice(0, 77).trimEnd() + "…" : firstSentence;
}

export function transformGoogleReviewsToUi(payload: CachedGoogleReviewsPayload | null): UiReview[] {
  if (!payload || !Array.isArray(payload.reviews)) return [];
  return payload.reviews.map((r) => {
    const palette = pickPalette(r.author || "?");
    return {
      name: r.author || "Anonymous",
      initial: (r.initial || (r.author || "?").charAt(0) || "?").toUpperCase(),
      bgColor: palette.bg,
      textColor: palette.text,
      profilePhoto: r.profilePhoto || null,
      title: deriveTitle(r.text),
      text: r.text || "",
      fullText: r.text || "",
      date: r.relativeTime || "",
      rating: typeof r.rating === "number" ? r.rating : 5,
      img: r.photoUrl || undefined,
      hasVideo: false,
    };
  });
}

export function useGoogleReviews(slug: string | undefined) {
  const [payload, setPayload] = useState<CachedGoogleReviewsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setPayload(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Check sessionStorage first to avoid redundant edge function calls
    const cacheKey = `google-reviews:${slug}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedGoogleReviewsPayload;
        if (parsed && Array.isArray(parsed.reviews)) {
          setPayload(parsed);
          setLoading(false);
          return;
        }
      }
    } catch { /* sessionStorage unavailable or corrupt — continue to fetch */ }

    fetch(`${API}/google-reviews/${slug}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const data = json?.data ?? null;
        setPayload(data);
        setLoading(false);

        // Cache in sessionStorage for this browsing session
        if (data) {
          try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* full or unavailable */ }
          console.log(
            `Google reviews loaded for ${slug}: source=${data.source}, count=${data.reviews?.length ?? 0}, fetchedAt=${data.fetchedAt}`,
          );
        }
      })
      .catch((err) => {
        console.error("Failed to fetch google reviews:", err);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const uiReviews = transformGoogleReviewsToUi(payload);

  return { payload, uiReviews, loading, error };
}
