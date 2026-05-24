import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { HomepageNav } from "./shared/HomepageNav";
import { HomepageFooter } from "./shared/HomepageFooter";
import { C, serif, sans } from "./homepage/v8/primitives";
import { Seo } from "./shared/Seo";
import {
  formatPublishedDate,
  type Post,
  type Block,
} from "./blog/posts";
import { findPublishedPost, getPublishedPosts, bumpView } from "./blog/blogStore";

function relatedPosts(slug: string, limit = 3): Post[] {
  const all = getPublishedPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return all.slice(0, limit);
  const sameCategory = all.filter(
    (p) => p.slug !== slug && p.category === current.category
  );
  const others = all.filter(
    (p) => p.slug !== slug && p.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, limit);
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[28px] px-3 text-[12px]"
      style={{
        background: C.white,
        color: C.black,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: "999px",
        fontFamily: sans,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

function AuthorRow({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: C.black,
          color: C.white,
          fontFamily: serif,
          fontSize: 14,
        }}
      >
        {post.author.avatar}
      </div>
      <div className="flex flex-col">
        <span
          className="text-[11px] uppercase tracking-[0.12em]"
          style={{ color: C.grayLight, fontFamily: sans, fontWeight: 600 }}
        >
          Written by
        </span>
        <span
          className="text-[14px]"
          style={{ color: C.black, fontFamily: sans, fontWeight: 500 }}
        >
          {post.author.name}
        </span>
      </div>
    </div>
  );
}

function ArticleBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          className="text-[26px] md:text-[30px] leading-[1.2] mt-12 mb-4 m-0"
          style={{
            color: C.black,
            fontFamily: serif,
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          className="text-[22px] md:text-[24px] leading-[1.25] mt-10 mb-3 m-0"
          style={{ color: C.black, fontFamily: serif, fontWeight: 500 }}
        >
          {block.text}
        </h3>
      );
    case "p":
      // text may contain inline HTML from the rich-text editor
      // (<strong>, <em>, <u>, <a>) — render through innerHTML.
      return (
        <p
          className="text-[17px] leading-[1.7] m-0 mb-5"
          style={{ color: "#3a3833", fontFamily: sans }}
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      );
    case "ul":
      return (
        <ul
          className="m-0 mb-5 pl-6 flex flex-col gap-2.5 text-[17px] leading-[1.7]"
          style={{ color: "#3a3833", fontFamily: sans }}
        >
          {block.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol
          className="m-0 mb-5 pl-6 flex flex-col gap-2.5 text-[17px] leading-[1.7] list-decimal"
          style={{ color: "#3a3833", fontFamily: sans }}
        >
          {block.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote
          className="m-0 my-8 pl-5 text-[20px] leading-[1.45] italic"
          style={{
            borderLeft: `3px solid ${C.black}`,
            color: C.black,
            fontFamily: serif,
            fontWeight: 500,
          }}
        >
          {block.text}
        </blockquote>
      );
    case "image":
      return (
        <figure className="my-8 m-0">
          <img
            src={block.src}
            alt={block.alt || ""}
            className="w-full rounded-2xl"
            loading="lazy"
          />
        </figure>
      );
    case "divider":
      return (
        <hr
          className="my-10 border-0"
          style={{ borderTop: `1px solid ${C.creamBorder}` }}
        />
      );
  }
}

function RelatedCard({ post }: { post: Post }) {
  return (
    <a
      href={`/blog/${post.slug}`}
      className="group flex flex-col cursor-pointer hover:-translate-y-0.5 transition-transform duration-200"
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
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: C.grayLight, fontFamily: sans }}
        >
          {post.category}
        </span>
        <h3
          className="text-[18px] leading-[1.25] m-0"
          style={{ color: C.black, fontFamily: serif, fontWeight: 500 }}
        >
          {post.title}
        </h3>
        <span
          className="text-[12px] mt-1"
          style={{ color: C.grayLight, fontFamily: sans }}
        >
          {post.readMin} min read
        </span>
      </div>
    </a>
  );
}

export function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? findPublishedPost(slug) : undefined;

  // Reset scroll on slug change so jumping between articles always lands
  // the reader back at the headline.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  // Record a view exactly once per slug visit. The ref guard prevents
  // React 18 strict-mode double-mount from inflating the count.
  const viewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!post) return;
    if (viewedRef.current === post.slug) return;
    viewedRef.current = post.slug;
    bumpView(post.slug);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen" style={{ background: C.cream }}>
        <HomepageNav ctaLabel="Get matched" />
        <div className="max-w-[640px] mx-auto px-6 py-32 text-center">
          <h1
            className="text-[36px] m-0 mb-3"
            style={{ color: C.black, fontFamily: serif, fontWeight: 500 }}
          >
            Article not found.
          </h1>
          <p
            className="text-[16px] mb-8 m-0"
            style={{ color: C.gray, fontFamily: sans }}
          >
            The article you're looking for doesn't exist or has been moved.
          </p>
          <button
            type="button"
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 h-[48px] px-7 text-[14px] font-medium cursor-pointer hover:opacity-85"
            style={{
              background: C.black,
              color: C.white,
              borderRadius: "12px",
              fontFamily: sans,
              border: "none",
            }}
          >
            <ArrowLeft size={16} /> Back to all articles
          </button>
        </div>
      </div>
    );
  }

  const related = relatedPosts(post.slug, 3);

  return (
    <>
      <Seo
        title={`${post.title} — Network Singapore`}
        description={post.description}
        canonical={`https://www.network.sg/blog/${post.slug}`}
      />
      <div className="min-h-screen" style={{ background: C.cream }}>
        <HomepageNav ctaLabel="Get matched" />

        {/* ── Back link ─────────────────────────────────────── */}
        <div className="px-6 md:px-10 pt-10 md:pt-14">
          <div className="max-w-[760px] mx-auto">
            <a
              href="/blog"
              className="inline-flex items-center gap-2 text-[13px] hover:opacity-70"
              style={{ color: C.gray, fontFamily: sans, textDecoration: "none" }}
            >
              <ArrowLeft size={14} /> All articles
            </a>
          </div>
        </div>

        {/* ── Header ────────────────────────────────────────── */}
        <header className="px-6 md:px-10 pt-6 md:pt-8">
          <div className="max-w-[760px] mx-auto flex flex-col gap-6">
            <h1
              className="text-[36px] md:text-[52px] leading-[1.08] m-0"
              style={{
                color: C.black,
                fontFamily: serif,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {post.title}
            </h1>
            <p
              className="text-[18px] md:text-[19px] leading-[1.5] m-0"
              style={{ color: C.gray, fontFamily: sans }}
            >
              {post.lede}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <AuthorRow post={post} />
              <div className="flex flex-wrap items-center gap-2">
                <MetaChip>{post.category}</MetaChip>
                <MetaChip>{formatPublishedDate(post.publishedOn)}</MetaChip>
                <MetaChip>
                  <Clock size={12} strokeWidth={2} />
                  {post.readMin} min read
                </MetaChip>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero image ────────────────────────────────────── */}
        <section className="px-6 md:px-10 pt-10 md:pt-14">
          <div className="max-w-[1000px] mx-auto">
            <div
              className="overflow-hidden"
              style={{
                background: C.creamDark,
                borderRadius: "20px",
                aspectRatio: "16 / 10",
              }}
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ── Body ──────────────────────────────────────────── */}
        <article className="px-6 md:px-10 pt-12 md:pt-16">
          <div className="max-w-[720px] mx-auto">
            {post.body.map((block, i) => (
              <ArticleBlock key={i} block={block} />
            ))}
          </div>
        </article>

        {/* ── CTA Block ─────────────────────────────────────── */}
        <section className="px-6 md:px-10 pt-16 md:pt-24">
          <div className="max-w-[760px] mx-auto">
            <div
              className="flex flex-col items-start gap-4 p-8 md:p-10"
              style={{
                background: C.black,
                color: C.white,
                borderRadius: "20px",
              }}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "#a8a39a", fontFamily: sans }}
              >
                Renovate With Confidence
              </span>
              <h3
                className="text-[26px] md:text-[32px] leading-[1.15] m-0"
                style={{ fontFamily: serif, fontWeight: 500 }}
              >
                Want three trustworthy designers picked for your home?
              </h3>
              <p
                className="text-[15px] leading-[1.6] m-0"
                style={{ color: "#c9c5bc", fontFamily: sans }}
              >
                Tell us your scope and budget. Our concierge hand-matches 3
                verified firms — free, no obligation, within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => navigate("/get-matched")}
                className="inline-flex items-center gap-2 h-[48px] px-7 mt-2 text-[14px] font-medium cursor-pointer hover:opacity-85"
                style={{
                  background: C.white,
                  color: C.black,
                  borderRadius: "12px",
                  fontFamily: sans,
                  border: "none",
                  transition: "all 0.15s",
                }}
              >
                Get matched <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Related ───────────────────────────────────────── */}
        <section className="px-6 md:px-10 pt-20 md:pt-28 pb-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-end justify-between mb-8 md:mb-10 gap-6">
              <div className="flex flex-col gap-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.grayLight, fontFamily: sans }}
                >
                  Keep Reading
                </span>
                <h2
                  className="text-[28px] md:text-[36px] leading-[1.1] m-0"
                  style={{
                    color: C.black,
                    fontFamily: serif,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                  }}
                >
                  More from the blog.
                </h2>
              </div>
              <a
                href="/blog"
                className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-medium hover:gap-2 transition-all"
                style={{ color: C.black, fontFamily: sans, textDecoration: "none" }}
              >
                View all <ArrowRight size={14} />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {related.map((p) => (
                <RelatedCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>

        <HomepageFooter />
      </div>
    </>
  );
}
