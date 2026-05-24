import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import {
  ensureLoaded,
  getPublishedPosts,
  subscribe,
} from "../../../blog/blogStore";
import type { Post } from "../../../blog/posts";
import { C, serif, sans, FadeIn } from "../primitives";

/* ───────────────────────────────────────────────────────────────────────────
   BlogHighlights — homepage editorial section

   Pulls the three most-recent published blog posts from the same store the
   /blog index uses, so anything the admin publishes shows up here within
   the same refresh cycle. If the store has no published posts (or is still
   loading the first response from the server), the section quietly hides
   itself instead of leaving an awkward empty grid.
   ─────────────────────────────────────────────────────────────────────────── */

const TOP_N = 3;

function pickTopPosts(): Post[] {
  return [...getPublishedPosts()]
    .sort((a, b) => (b.publishedOn || "").localeCompare(a.publishedOn || ""))
    .slice(0, TOP_N);
}

function formatDate(iso: string): string {
  // "2026-04-12" → "12 Apr 2026"
  if (!iso || iso.length < 10) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = Number(iso.slice(8, 10));
  const m = months[Number(iso.slice(5, 7)) - 1] || "";
  const y = iso.slice(0, 4);
  return `${d} ${m} ${y}`;
}

export function BlogHighlights() {
  const [posts, setPosts] = useState<Post[]>(() => pickTopPosts());

  useEffect(() => {
    ensureLoaded();
    return subscribe(() => setPosts(pickTopPosts()));
  }, []);

  const visible = useMemo(() => posts, [posts]);

  if (visible.length === 0) return null;

  return (
    <section style={{ background: C.cream, padding: "96px 0 96px", fontFamily: sans, color: C.black }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        {/* Section header */}
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="max-w-[640px]">
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
                From the journal
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
                Renovation know-how before you commit
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: C.gray,
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                Cost breakdowns, designer red flags, and process guides — written so you can
                read a quote without a designer translating it for you.
              </p>
            </div>
            <Link
              to="/blog"
              className="hidden md:inline-flex items-center gap-2 shrink-0"
              style={{
                color: C.black,
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: "999px",
                border: `1px solid ${C.creamBorder}`,
                background: C.white,
              }}
            >
              See all articles
              <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {visible.map((post) => (
            <FadeIn key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                className="group flex flex-col h-full hover:-translate-y-0.5 transition-transform duration-200"
                style={{
                  background: C.white,
                  border: `1px solid ${C.creamBorder}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  className="aspect-[16/10] overflow-hidden"
                  style={{ background: C.creamDark }}
                >
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 p-6 flex-1">
                  <span
                    className="self-start text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: C.grayLight, fontFamily: sans }}
                  >
                    {post.category}
                  </span>
                  <h3
                    style={{
                      fontFamily: serif,
                      fontSize: "20px",
                      fontWeight: 500,
                      lineHeight: 1.25,
                      color: C.black,
                      margin: 0,
                    }}
                  >
                    {post.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.55,
                      color: C.gray,
                      margin: 0,
                      // Clamp to 2 lines so the card heights stay close
                      // even when descriptions vary in length.
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {post.description}
                  </p>
                  <div
                    className="mt-auto pt-4 flex items-center justify-between"
                    style={{ borderTop: `1px solid ${C.creamBorder}` }}
                  >
                    <span style={{ fontSize: "12px", color: C.grayLight, fontFamily: sans }}>
                      {formatDate(post.publishedOn)}
                    </span>
                    <span style={{ fontSize: "12px", color: C.grayLight, fontFamily: sans }}>
                      {post.readMin} min read
                    </span>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        {/* Mobile-only CTA (desktop one sits in the header row) */}
        <FadeIn delay={0.05}>
          <div className="md:hidden mt-10 flex justify-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2"
              style={{
                color: C.black,
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "999px",
                border: `1px solid ${C.creamBorder}`,
                background: C.white,
              }}
            >
              See all articles
              <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
