import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ClipboardCheck, UserCheck, Sofa, ChevronLeft, ChevronRight, ChevronDown, Play, ArrowRight } from "lucide-react";
import { HomepageNav } from "./shared/HomepageNav";
import { HomepageFooter } from "./shared/HomepageFooter";
import { C, serif, sans } from "./homepage/v8/primitives";
import { Seo } from "./shared/Seo";
import { type BlogCategory, type Post } from "./blog/posts";
import { getPublishedPosts, subscribe } from "./blog/blogStore";

type Category = "All" | BlogCategory;

const CATEGORIES: Category[] = [
  "All",
  "Cost Guides",
  "Designer Tips",
  "Renovation Process",
  "Style & Layout",
  "Protect Your Money",
];

function CategoryChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[40px] px-5 text-[13px] font-medium cursor-pointer transition-all"
      style={{
        background: active ? C.black : "transparent",
        color: active ? C.white : C.gray,
        borderRadius: "999px",
        border: `1px solid ${active ? C.black : C.creamBorder}`,
        fontFamily: sans,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function AuthorBadge({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: C.black, color: C.white, fontFamily: serif, fontSize: 12 }}
      >
        {initials}
      </div>
      <span className="text-[13px]" style={{ color: C.black, fontFamily: sans, fontWeight: 500 }}>
        {name}
      </span>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
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
      <div className="flex flex-col gap-3 p-6">
        <span
          className="self-start text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: C.grayLight, fontFamily: sans }}
        >
          {post.category}
        </span>
        <h3
          className="text-[20px] leading-[1.25] m-0"
          style={{ color: C.black, fontFamily: serif, fontWeight: 500 }}
        >
          {post.title}
        </h3>
        <p
          className="text-[14px] leading-[1.55] m-0"
          style={{ color: C.gray, fontFamily: sans }}
        >
          {post.description}
        </p>
        <div
          className="mt-2 pt-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${C.creamBorder}` }}
        >
          <AuthorBadge name={post.author.name} initials={post.author.avatar} />
          <span className="text-[12px]" style={{ color: C.grayLight, fontFamily: sans }}>
            {post.readMin} min read
          </span>
        </div>
      </div>
    </a>
  );
}

const PAGE_SIZE = 3;

// ─── Renovation 101 — stage-based reading paths ──────────────────────
// Names lead with the outcome the homeowner wants at that stage, not the
// task. Each card maps to a category filter on the same page.
// Each card can supply either a Lucide `icon` (rendered inside the cream
// badge) or an `illustration` URL (rendered larger as a Notion-style art
// tile). When both are present, `illustration` wins.
const RENO_101: {
  title: string;
  description: string;
  icon: typeof ClipboardCheck;
  illustration?: string;
  // Optional per-illustration zoom — useful when one of the source PNGs
  // has more whitespace around the subject than the others.
  imageScale?: number;
  href: string;
}[] = [
  {
    title: "Plan With Confidence",
    description:
      "Timelines, budgets, and the decisions you should lock in before signing anything.",
    icon: ClipboardCheck,
    illustration: "/Blog%20Illustration/Untitled%20design.png?v=2",
    href: "/blog?category=Cost+Guides",
  },
  {
    title: "Hire the Right Designer",
    description:
      "How to vet, compare, and protect yourself before you commit to a single firm.",
    icon: UserCheck,
    illustration: "/Blog%20Illustration/magnific_two-hands-shaking-with-a-_3004968476.png?v=1",
    href: "/blog?category=Designer+Tips",
  },
  {
    title: "Furnish Without Regret",
    description:
      "Source furniture, finishes, and appliances that look great and last beyond move-in.",
    icon: Sofa,
    illustration: "/Blog%20Illustration/magnific_a-friendly-armchair-besid_3004973217.png?v=1",
    imageScale: 1.35,
    href: "/blog?category=Style+%26+Layout",
  },
];

// ─── Quick Clips — short-form video lessons ──────────────────────────
const QUICK_CLIPS: {
  title: string;
  poster: string;
  duration: string;
}[] = [
  {
    title: "How to read a renovation contract before you sign",
    poster:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&auto=format&fit=crop",
    duration: "0:58",
  },
  {
    title: "Inside a 4-room HDB transformed into a calm, cave-style home",
    poster:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80&auto=format&fit=crop",
    duration: "1:12",
  },
  {
    title: "The pivot door trick that opened up this brutalist BTO",
    poster:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80&auto=format&fit=crop",
    duration: "0:42",
  },
  {
    title: "Floor-to-ceiling bookshelves: muji-inspired dining + study",
    poster:
      "https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=600&q=80&auto=format&fit=crop",
    duration: "1:04",
  },
  {
    title: "Why your ID quote is 20% higher than your neighbour's",
    poster:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop",
    duration: "0:51",
  },
];

function Renovation101Section() {
  return (
    <section
      className="px-6 md:px-10 py-20 md:py-28 mt-16 md:mt-24"
      style={{ background: C.black }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-3 mb-10 md:mb-12">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "#a8a39a", fontFamily: sans }}
          >
            Home Renovation 101
          </span>
          <h2
            className="text-[32px] md:text-[40px] leading-[1.1] m-0"
            style={{ color: C.white, fontFamily: serif, fontWeight: 500, letterSpacing: "-0.01em" }}
          >
            Start Here, Whatever Stage You're In.
          </h2>
          <p
            className="text-[16px] leading-[1.55] m-0 max-w-[640px]"
            style={{ color: "#c9c5bc", fontFamily: sans }}
          >
            Three short reading paths — each one written to answer the questions
            most homeowners only think to ask after it's too late.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {RENO_101.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.title}
                href={item.href}
                className="group flex items-start gap-5 p-6 cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
                style={{
                  background: C.white,
                  border: `1px solid ${C.white}`,
                  borderRadius: "16px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {item.illustration ? (
                  <div
                    className="shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ width: 150, height: 150 }}
                  >
                    <img
                      src={item.illustration}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-contain"
                      style={item.imageScale ? { transform: `scale(${item.imageScale})` } : undefined}
                    />
                  </div>
                ) : (
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{ width: 120, height: 120, color: C.black }}
                  >
                    <Icon size={48} strokeWidth={1.5} />
                  </div>
                )}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <h3
                    className="text-[18px] leading-[1.25] m-0"
                    style={{ color: C.black, fontFamily: sans, fontWeight: 600 }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-[13.5px] leading-[1.5] m-0"
                    style={{ color: C.gray, fontFamily: sans }}
                  >
                    {item.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-[13px] font-medium mt-1 group-hover:gap-1.5 transition-all"
                    style={{ color: C.black, fontFamily: sans }}
                  >
                    View articles
                    <ChevronDown size={14} strokeWidth={2} />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function QuickClipsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const tileWidth = el.firstElementChild instanceof HTMLElement
      ? el.firstElementChild.offsetWidth + 20 // includes gap
      : 280;
    el.scrollBy({ left: tileWidth * dir, behavior: "smooth" });
  };

  return (
    <section className="px-6 md:px-10 pt-16 md:pt-24">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-8 md:mb-10 gap-6">
          <div className="flex flex-col gap-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.grayLight, fontFamily: sans }}
            >
              Quick Clips
            </span>
            <h2
              className="text-[28px] md:text-[36px] leading-[1.1] m-0"
              style={{ color: C.black, fontFamily: serif, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              Renovation Lessons in 60 Seconds.
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous clips"
              className="w-11 h-11 flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-[0.96]"
              style={{
                background: C.white,
                color: C.black,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "999px",
                transition: "all 0.15s",
              }}
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next clips"
              className="w-11 h-11 flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-[0.96]"
              style={{
                background: C.white,
                color: C.black,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "999px",
                transition: "all 0.15s",
              }}
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 md:-mx-10 px-6 md:px-10 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {QUICK_CLIPS.map((clip, idx) => (
            <button
              key={idx}
              type="button"
              className="group relative shrink-0 snap-start cursor-pointer overflow-hidden"
              style={{
                width: "260px",
                aspectRatio: "9 / 16",
                borderRadius: "16px",
                background: C.creamDark,
                border: "none",
                padding: 0,
              }}
            >
              <img
                src={clip.poster}
                alt={clip.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
              />
              {/* Bottom gradient for legibility */}
              <div
                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(15,15,13,0) 0%, rgba(15,15,13,0.65) 100%)",
                }}
              />
              {/* Play badge */}
              <div
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center"
                style={{
                  background: "rgba(15,15,13,0.7)",
                  color: C.white,
                  borderRadius: "999px",
                  backdropFilter: "blur(6px)",
                }}
              >
                <Play size={14} fill={C.white} strokeWidth={0} />
              </div>
              {/* Duration pill */}
              <div
                className="absolute top-4 left-4 px-2 h-6 flex items-center text-[11px] font-medium"
                style={{
                  background: "rgba(15,15,13,0.7)",
                  color: C.white,
                  borderRadius: "999px",
                  backdropFilter: "blur(6px)",
                  fontFamily: sans,
                }}
              >
                {clip.duration}
              </div>
              {/* Title */}
              <p
                className="absolute left-4 right-4 bottom-4 text-left text-[14px] leading-[1.35] m-0"
                style={{ color: C.white, fontFamily: sans, fontWeight: 500 }}
              >
                {clip.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogIndex() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [posts, setPosts] = useState<Post[]>(() => getPublishedPosts());

  // Keep the list in sync when the admin publishes/edits/deletes.
  useEffect(() => subscribe(() => setPosts(getPublishedPosts())), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, query, posts]);

  // Reset pagination when the filter or query changes.
  const filterKey = `${activeCategory}::${query.trim().toLowerCase()}`;
  const lastKeyRef = useRef(filterKey);
  if (lastKeyRef.current !== filterKey) {
    lastKeyRef.current = filterKey;
    if (visible !== PAGE_SIZE) setVisible(PAGE_SIZE);
  }

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  return (
    <>
      <Seo
        title="Renovation Insights & Guides — Network Singapore"
        description="Expert renovation advice, cost breakdowns, and designer tips written for Singapore homeowners. Plan, protect, and decide with confidence."
        canonical="https://www.network.sg/blog"
      />
      <div className="min-h-screen" style={{ background: C.cream }}>
        <HomepageNav ctaLabel="Get matched" />

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="px-6 md:px-10 pt-16 md:pt-24 pb-10 md:pb-14">
          <div className="max-w-[820px] mx-auto flex flex-col items-center text-center">
            <span
              className="inline-flex items-center h-[28px] px-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{
                background: C.white,
                color: C.black,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "999px",
                fontFamily: sans,
              }}
            >
              Our Insights
            </span>
            <h1
              className="mt-6 text-[40px] md:text-[56px] leading-[1.05] m-0"
              style={{ color: C.black, fontFamily: serif, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              Insights and Inspiration,
              <br />
              for Every Renovation.
            </h1>
            <p
              className="mt-5 text-[16px] md:text-[17px] leading-[1.55] m-0 max-w-[620px]"
              style={{ color: C.gray, fontFamily: sans }}
            >
              Honest guides, cost breakdowns, and designer-vetted advice — written to help
              Singapore homeowners plan smarter and renovate with total confidence.
            </p>

            {/* Search */}
            <div className="mt-9 w-full max-w-[520px] relative">
              <Search
                size={18}
                className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: C.grayLight }}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, guides, and topics…"
                aria-label="Search blog articles"
                className="w-full h-[52px] pl-12 pr-5 text-[14px] outline-none"
                style={{
                  background: C.white,
                  color: C.black,
                  border: `1px solid ${C.creamBorder}`,
                  borderRadius: "12px",
                  fontFamily: sans,
                }}
              />
            </div>
          </div>
        </section>

        {/* ── Top Picks + Filters ────────────────────────────── */}
        <section className="px-6 md:px-10">
          <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-5">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.grayLight, fontFamily: sans }}
            >
              Top Picks
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c}
                  label={c}
                  active={activeCategory === c}
                  onClick={() => setActiveCategory(c)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Grid ───────────────────────────────────────────── */}
        <section className="px-6 md:px-10 pt-10 md:pt-14">
          <div className="max-w-[1200px] mx-auto">
            {filtered.length === 0 ? (
              <div
                className="text-center py-20"
                style={{
                  background: C.white,
                  border: `1px solid ${C.creamBorder}`,
                  borderRadius: "16px",
                  fontFamily: sans,
                }}
              >
                <p className="text-[16px] m-0" style={{ color: C.black }}>
                  No articles match your search.
                </p>
                <p className="text-[14px] mt-2 mb-0" style={{ color: C.gray }}>
                  Try a different keyword or clear the filter.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                  {shown.map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-12 md:mt-14 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="h-[52px] px-8 text-[14px] font-medium cursor-pointer hover:opacity-85 active:scale-[0.98]"
                      style={{
                        background: C.black,
                        color: C.white,
                        borderRadius: "12px",
                        fontFamily: sans,
                        border: "none",
                        transition: "all 0.15s",
                      }}
                    >
                      Load more articles
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <Renovation101Section />
        <QuickClipsSection />

        <div className="pb-24" />

        <HomepageFooter />
      </div>
    </>
  );
}
