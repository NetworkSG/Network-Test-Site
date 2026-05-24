import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { C, serif, sans, FadeIn } from "../../v8/primitives";
import { collapseBudgetRange } from "../../../DesignerProfile";
import {
  NetworkStarDesignerCard,
  NetworkStarDesignerCardSkeleton,
  type NetworkStarCardData,
} from "./NetworkStarDesignerCard";

/* ───────────────────────────────────────────────────────────────────────────
   FeaturedDesignersGrid

   Section for the test homepage. Fetches active designers from the existing
   Supabase Edge Function (same endpoint /interior-designers uses), ranks the
   top 12 by rating × log(reviews+1), derives mocked positioning fields, and
   renders the Network Star cards in a 3×4 grid.

   The mapper here is a slimmed-down snapshot of `mapDesigner()` in
   DesignersDirectory.tsx — only the fields the card actually consumes.
   The directory page keeps its own (richer) copy for filter logic.
   ─────────────────────────────────────────────────────────────────────────── */

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

type RawDesigner = any;

type BaseCard = Omit<
  NetworkStarCardData,
  "starTier" | "starRecipientYears" | "handshakeEligible" | "serviceModel" | "respondsFast" | "replyTimeLabel" | "matchedThisMonth"
> & { verified: boolean };

function mapToBase(d: RawDesigner): BaseCard {
  const stats = d.stats || {};
  const images = d.images || {};
  const bInfo: { label: string; value: string }[] = d.businessInfo || [];

  // Hero image: first featured project cover, then fallback to images.cover.
  const projects = Array.isArray(d.projects) ? d.projects : [];
  const firstFeatured = projects.find((p: any) => p?.isFeatured);
  const image =
    firstFeatured?.coverImage ||
    firstFeatured?.featuredImage ||
    firstFeatured?.image ||
    firstFeatured?.images?.cover ||
    images.cover ||
    "";

  // Property types
  let propertyTypes: string[] = [];
  const ptEntry = bInfo.find((b: any) => b.label === "Project types");
  if (ptEntry?.value) {
    const raw = ptEntry.value.split(/\s*·\s*/).filter(Boolean);
    propertyTypes = [
      ...new Set(
        raw.map((t: string) => {
          if (/hdb/i.test(t)) return "HDB";
          if (/executive\s*condo/i.test(t) || /\bec\b/i.test(t)) return "EC";
          if (/condo/i.test(t)) return "Condo";
          if (/landed/i.test(t)) return "Landed";
          if (/commercial/i.test(t)) return "Commercial";
          return t;
        })
      ),
    ];
  }

  // Budget — reuse the canonical collapser from DesignerProfile.
  const budgetEntry = bInfo.find((b: any) => b.label?.toLowerCase().includes("budget"));
  const budget = collapseBudgetRange(budgetEntry?.value || "");

  // Accreditations
  const credentials = d.credentials || {};
  const accreditations: string[] = [];
  if (credentials.hdb?.active) accreditations.push("HDB Licensed");
  if (credentials.bca?.active) accreditations.push("BCA Registered");
  if (credentials.landedEligible) accreditations.push("Landed Eligible");
  const licensesEntry = bInfo.find((b: any) => /licens/i.test(b.label || ""));
  if (licensesEntry?.value) {
    for (const piece of String(licensesEntry.value).split(/[,·]/).map((s) => s.trim()).filter(Boolean)) {
      const head = piece.split(/\s+/)[0]?.toLowerCase();
      const dupe = accreditations.some((a) => {
        const aHead = a.split(/\s+/)[0]?.toLowerCase();
        return a.toLowerCase() === piece.toLowerCase() || (head && aHead && head === aHead);
      });
      if (!dupe) accreditations.push(piece);
    }
  }

  const currentYear = new Date().getFullYear();
  const yearsActive = d.foundedYear ? currentYear - d.foundedYear : parseInt(stats.years) || 0;

  return {
    slug: d.slug || "",
    name: d.name || "Untitled Designer",
    tagline: d.tagline || "",
    image,
    logo: images.logo || "",
    rating:
      typeof d.googleMeta?.rating === "number" && d.googleMeta.rating > 0
        ? d.googleMeta.rating
        : parseFloat(stats.rating) || 0,
    reviews:
      typeof d.googleMeta?.totalRatings === "number" && d.googleMeta.totalRatings > 0
        ? d.googleMeta.totalRatings
        : parseInt(stats.reviewCount) || 0,
    projects: d.totalProjects || 0,
    yearsActive,
    budget,
    accreditations,
    propertyTypes,
    verified: !!d.verified,
  };
}

/* ──────────────────────────────────────────────────────────────
   MOCK — replace with backend fields when Network Star schema lands.
   Deterministic, per-slug derivation so the same firm always renders
   the same positioning values across reloads.
   ────────────────────────────────────────────────────────────── */

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function pickReplyTime(slug: string): string {
  const buckets = ["~2 hrs", "~4 hrs", "~1 day"];
  return buckets[hashSlug(slug) % buckets.length];
}

function pickMatched(slug: string): number {
  const buckets = [15, 27, 42, 61];
  return buckets[hashSlug(slug) % buckets.length];
}

function pickServiceModel(card: BaseCard): NetworkStarCardData["serviceModel"] {
  if (/studio|atelier/i.test(card.name)) return "Design-led";
  if (card.accreditations.some((a) => /bca/i.test(a))) return "Design & build";
  return "Design & build";
}

function rankScore(card: BaseCard): number {
  return card.rating * Math.log(card.reviews + 1);
}

function decorate(card: BaseCard, rank: number): NetworkStarCardData {
  const starTier: 1 | 2 | 3 = rank === 0 ? 3 : rank <= 2 ? 2 : 1;
  return {
    ...card,
    starTier,
    starRecipientYears: 1, // Year 1 of the award — all winners are 1-time recipients
    handshakeEligible: card.verified,
    serviceModel: pickServiceModel(card),
    respondsFast: hashSlug(card.slug) % 2 === 0,
    replyTimeLabel: pickReplyTime(card.slug),
    matchedThisMonth: pickMatched(card.slug),
  };
}

/* ────────────────────────────────────────────────────────────── */

export function FeaturedDesignersGrid() {
  const [raw, setRaw] = useState<RawDesigner[] | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${API}/designers?limit=100`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (cancelled) return;
        setRaw(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error("FeaturedDesignersGrid fetch failed:", err);
        if (!cancelled) setErrored(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo<NetworkStarCardData[] | null>(() => {
    if (!raw) return null;
    const active = raw.filter((d) => d.active !== false);
    const mapped = active.map(mapToBase).filter((c) => c.slug && c.rating > 0 && c.reviews > 0);
    mapped.sort((a, b) => rankScore(b) - rankScore(a));
    return mapped.slice(0, 12).map((c, i) => decorate(c, i));
  }, [raw]);

  // Hide entirely on hard error — don't break the homepage flow.
  if (errored) return null;
  if (cards && cards.length === 0) return null;

  const loading = cards === null;

  return (
    <section style={{ background: C.cream, padding: "80px 0 96px", fontFamily: sans, color: C.black }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Section header */}
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.grayLight,
                marginBottom: "14px",
              }}
            >
              Network Star 2026
            </p>
            <h2
              style={{
                fontFamily: serif,
                fontSize: "clamp(32px, 4vw, 44px)",
                fontWeight: 500,
                color: C.black,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                marginBottom: "14px",
              }}
            >
              Featured designers
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: C.gray,
                maxWidth: "620px",
                margin: "0 auto",
                lineHeight: 1.55,
              }}
            >
              The firms our concierge team trusts with our own clients — ranked, vetted, and protected by Handshake escrow.
            </p>
          </div>
        </FadeIn>

        {/* Grid */}
        <div
          className="grid gap-6 md:gap-7"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <NetworkStarDesignerCardSkeleton key={i} />)
            : cards!.map((c) => <NetworkStarDesignerCard key={c.slug} d={c} />)}
        </div>

        {/* See all CTA */}
        <FadeIn delay={0.05}>
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link
              to="/interior-designers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: C.black,
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                padding: "12px 20px",
                borderBottom: `1px solid ${C.black}`,
              }}
            >
              See all 120+ verified firms
              <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
