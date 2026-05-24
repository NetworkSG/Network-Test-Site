import { Link } from "react-router";
import { Star, Shield, Trophy, Zap, Circle } from "lucide-react";
import { SmartImage } from "../../../shared/SmartImage";
import { C, serif, sans } from "../../v8/primitives";

/* ───────────────────────────────────────────────────────────────────────────
   NetworkStarDesignerCard

   Implements the card spec from the May 2026 Designer Positioning Research
   plus the Network Star ribbon framework. Nine zones top-to-bottom:

     1. Hero photo + four overlay chips (Star tier, response time,
        project count, service-model tier)
     2. Firm identity (logo + name)
     3. Rating row (verbal band + numeric)
     4. Tagline
     5. Trust chips (Handshake + accreditations)
     6. Specialization row
     7. Stats row (years / budget / reply time)
     8. Social proof row (Star recipient count + matched this month)
     9. CTA button → /designer/{slug}
   ─────────────────────────────────────────────────────────────────────────── */

export type NetworkStarCardData = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  logo: string;
  rating: number;
  reviews: number;
  projects: number;
  yearsActive: number;
  budget: string;
  accreditations: string[];
  propertyTypes: string[];

  /* Positioning fields (currently derived/mocked in FeaturedDesignersGrid) */
  starTier: 1 | 2 | 3;
  starRecipientYears: number;
  handshakeEligible: boolean;
  serviceModel: "Design-led" | "Design & build" | "Build-contractor-ID";
  respondsFast: boolean;
  replyTimeLabel: string;
  matchedThisMonth: number;
};

const AMBER = "#BA7517";
const AMBER_TEXT = "#FAEEDA";
const GREEN_DARK = "#27500A";
const GREEN_LIGHT = "#EAF3DE";

function verbalBand(rating: number): string | null {
  if (rating >= 4.7) return "Highly rated";
  if (rating >= 4.4) return "Well reviewed";
  return null;
}

function StarRibbon({ tier }: { tier: 1 | 2 | 3 }) {
  const stars = "★".repeat(tier);
  const label = tier === 3 ? "Three Network Stars" : tier === 2 ? "Two Network Stars" : "Network Star";
  return (
    <div
      style={{
        background: AMBER,
        color: AMBER_TEXT,
        padding: "5px 12px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.3px",
        fontFamily: sans,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
      }}
      title={label}
    >
      <span style={{ letterSpacing: "1px" }}>{stars}</span>
    </div>
  );
}

export function NetworkStarDesignerCard({ d }: { d: NetworkStarCardData }) {
  const band = verbalBand(d.rating);

  // Cap accreditation chips at 3 visible + overflow indicator.
  const accVisible = d.accreditations.slice(0, 3);
  const accOverflow = Math.max(0, d.accreditations.length - 3);

  return (
    <article
      style={{
        background: C.white,
        border: `0.5px solid ${C.creamBorder}`,
        borderRadius: "10px",
        fontFamily: sans,
        color: C.black,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ─── 1. HERO PHOTO + OVERLAY CHIPS ─── */}
      <div style={{ position: "relative", width: "100%", height: "220px", background: C.creamDark }}>
        {d.image ? (
          <SmartImage
            src={d.image}
            alt={d.name}
            width="100%"
            height={220}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}

        {/* Top-right: Star ribbon */}
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <StarRibbon tier={d.starTier} />
        </div>

        {/* Top-left: response status pill */}
        {d.respondsFast && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(0,0,0,0.45)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backdropFilter: "blur(4px)",
            }}
          >
            <Circle size={8} fill="#97C459" stroke="#97C459" />
            Responds fast
          </div>
        )}

        {/* Bottom-left: project count */}
        {d.projects > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {d.projects} projects
          </div>
        )}

        {/* Bottom-right: service-model tier */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            background: "rgba(255,255,255,0.95)",
            color: "#2C2C2A",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.4px",
          }}
        >
          {d.serviceModel}
        </div>
      </div>

      {/* ─── 2–9. BODY ─── */}
      <div style={{ padding: "16px 20px 20px" }}>
        {/* 2. Firm identity row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          {d.logo ? (
            <img
              src={d.logo}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                objectFit: "cover",
                background: C.creamDark,
                border: `0.5px solid ${C.creamBorder}`,
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: C.creamDark,
                border: `0.5px solid ${C.creamBorder}`,
                flexShrink: 0,
              }}
            />
          )}
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 500,
              letterSpacing: "0.3px",
              fontFamily: serif,
              color: C.black,
              margin: 0,
              lineHeight: 1.2,
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {d.name}
          </h3>
        </div>

        {/* 3. Rating row */}
        {d.rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            {band && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: GREEN_DARK,
                  background: GREEN_LIGHT,
                  padding: "3px 9px",
                  borderRadius: "6px",
                }}
              >
                {band}
              </span>
            )}
            <Star size={14} fill={AMBER} stroke={AMBER} />
            <span style={{ fontSize: "14px", fontWeight: 500, color: C.black }}>{d.rating.toFixed(1)}</span>
            <span style={{ fontSize: "13px", color: C.gray }}>
              ({d.reviews.toLocaleString()} reviews)
            </span>
          </div>
        )}

        {/* 4. Tagline */}
        {d.tagline && (
          <p
            style={{
              fontStyle: "italic",
              fontFamily: serif,
              fontSize: "13px",
              color: C.gray,
              marginBottom: "14px",
              lineHeight: 1.4,
              minHeight: "18px",
            }}
          >
            {d.tagline}
          </p>
        )}

        {/* 5. Trust chips row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {d.handshakeEligible && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 500,
                color: GREEN_DARK,
                background: GREEN_LIGHT,
                padding: "4px 9px",
                borderRadius: "6px",
              }}
            >
              <Shield size={11} />
              Handshake eligible
            </span>
          )}
          {accVisible.map((a) => (
            <span
              key={a}
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: C.gray,
                background: C.creamDark,
                padding: "4px 9px",
                borderRadius: "6px",
              }}
            >
              {a}
            </span>
          ))}
          {accOverflow > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: C.gray,
                background: C.creamDark,
                padding: "4px 9px",
                borderRadius: "6px",
              }}
            >
              +{accOverflow} more
            </span>
          )}
        </div>

        {/* 6. Specialization row */}
        {d.propertyTypes.length > 0 && (
          <div style={{ fontSize: "12px", marginBottom: "14px", lineHeight: 1.4 }}>
            <span style={{ color: C.black, fontWeight: 500 }}>Specializes in: </span>
            <span style={{ color: C.gray }}>{d.propertyTypes.join(" · ")}</span>
          </div>
        )}

        {/* 7. Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            fontSize: "12px",
            padding: "10px 0",
            borderTop: `0.5px solid ${C.creamBorder}`,
            borderBottom: `0.5px solid ${C.creamBorder}`,
            marginBottom: "12px",
          }}
        >
          <div>
            <div style={{ color: C.black, fontWeight: 500 }}>{d.yearsActive || "—"} yrs</div>
            <div style={{ color: C.gray, fontSize: "11px" }}>experience</div>
          </div>
          <div style={{ borderLeft: `0.5px solid ${C.creamBorder}`, paddingLeft: "8px" }}>
            <div style={{ color: C.black, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {d.budget || "—"}
            </div>
            <div style={{ color: C.gray, fontSize: "11px" }}>budget</div>
          </div>
          <div style={{ borderLeft: `0.5px solid ${C.creamBorder}`, paddingLeft: "8px" }}>
            <div style={{ color: C.black, fontWeight: 500 }}>{d.replyTimeLabel}</div>
            <div style={{ color: C.gray, fontSize: "11px" }}>reply time</div>
          </div>
        </div>

        {/* 8. Social proof row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: C.gray,
            marginBottom: "14px",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Trophy size={12} color={AMBER} />
            {d.starRecipientYears}-time Network Star
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Zap size={12} />
            Matched {d.matchedThisMonth}× this month
          </span>
        </div>

        {/* 9. CTA */}
        <Link
          to={`/designer/${d.slug}`}
          style={{
            display: "block",
            textAlign: "center",
            background: C.black,
            color: C.white,
            padding: "13px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.2px",
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          Request this firm
        </Link>
      </div>
    </article>
  );
}

/* ─── Skeleton (loading placeholder) ─── */
export function NetworkStarDesignerCardSkeleton() {
  return (
    <div
      style={{
        background: C.white,
        border: `0.5px solid ${C.creamBorder}`,
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", height: "220px", background: C.creamDark }} />
      <div style={{ padding: "16px 20px 20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "8px", background: C.creamDark }} />
          <div style={{ height: 18, flex: 1, background: C.creamDark, borderRadius: 4 }} />
        </div>
        <div style={{ height: 14, width: "60%", background: C.creamDark, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 14, width: "80%", background: C.creamDark, borderRadius: 4, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <div style={{ height: 20, width: 90, background: C.creamDark, borderRadius: 6 }} />
          <div style={{ height: 20, width: 70, background: C.creamDark, borderRadius: 6 }} />
        </div>
        <div style={{ height: 44, background: C.creamDark, borderRadius: 8 }} />
      </div>
    </div>
  );
}
