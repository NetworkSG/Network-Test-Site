// Shared blog post data used by both the index grid and the article page.
// Keeping it in one module means the article route can look up a post by
// slug without re-fetching anything from the API.

export type BlogCategory =
  | "Cost Guides"
  | "Designer Tips"
  | "Renovation Process"
  | "Style & Layout"
  | "Protect Your Money";

// Article body is modelled as a list of typed blocks so the renderer can
// style each one consistently without parsing markdown.
// Text blocks may contain inline HTML produced by the rich-text editor
// (<strong>, <em>, <u>, <a>) — kept as a string so the renderer can drop
// it straight in via dangerouslySetInnerHTML.
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "divider" };

export interface Post {
  slug: string;
  category: BlogCategory;
  title: string;
  description: string;
  image: string;
  author: { name: string; avatar: string };
  readMin: number;
  publishedOn: string; // ISO yyyy-mm-dd
  lede: string;
  body: Block[];
  // ── Optional rich-editor fields ─────────────────────────────────
  // All optional and backward-compatible; the admin editor sets them
  // but old/seed posts can omit them safely.
  imageAlt?: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];   // secondary categories beyond `category`
  featured?: boolean;
  allowComments?: boolean;
  relatedSlugs?: string[];
}

const COMMON_TAIL: Block[] = [
  {
    type: "h2",
    text: "Where to go from here",
  },
  {
    type: "p",
    text:
      "If you're still in the planning phase, take a slow read through our Cost Guides — they cover the line items most homeowners only discover after signing. If you're already comparing designers, our concierge can hand-pick three trustworthy firms for your scope, free, in under 24 hours.",
  },
];

export const POSTS: Post[] = [
  {
    slug: "50k-renovation-budget-singapore",
    category: "Cost Guides",
    title:
      "Is Your $50K Renovation Budget Realistic? Real HDB & Condo Costs Inside",
    description:
      "We break down where the money actually goes — from hacking to carpentry — so you can plan with confidence before you ever meet a designer.",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80&auto=format&fit=crop",
    author: { name: "Network Editorial", avatar: "NE" },
    readMin: 6,
    publishedOn: "2026-04-12",
    lede:
      "A $50,000 budget can stretch beautifully — or vanish in three months — depending on where you choose to spend it. Here's the breakdown most designers won't volunteer until you ask.",
    body: [
      {
        type: "p",
        text:
          "Most Singapore homeowners walk into their first ID meeting with a number in their head and very little context for what that number actually buys. The result is predictable: a quote that 'feels reasonable' on the surface, followed by variation orders that quietly push the project 30–40% over budget by month three.",
      },
      {
        type: "p",
        text:
          "The fix isn't to negotiate harder. It's to understand the four buckets your money flows into long before you sign anything.",
      },
      { type: "h2", text: "1. Hacking & masonry" },
      {
        type: "p",
        text:
          "The least glamorous line — and usually the first to creep. Hacking depends on what your unit came with: a brand-new BTO costs almost nothing here, while a resale HDB with built-in carpentry can easily tip $4,000–$8,000 before a single new wall is built.",
      },
      { type: "h2", text: "2. Carpentry" },
      {
        type: "p",
        text:
          "The single biggest swing factor in any quote. Two firms can quote the same kitchen with a 60% price gap simply because one uses plywood with HDF backing and the other quietly substitutes particle board. Ask what's behind the doors, not just the door material.",
      },
      { type: "h2", text: "3. Plumbing, electrical, and aircon" },
      {
        type: "p",
        text:
          "Move a single power point and you'll often pay more than the point itself in labour and rerouting. The cheap line item is the one you don't move.",
      },
      { type: "h2", text: "4. Finishes & soft costs" },
      {
        type: "p",
        text:
          "Tiles, paint, false ceilings, lighting — the bucket that looks small in the spreadsheet but is where most $50K budgets quietly become $65K budgets. Lock specifications before signing, not after.",
      },
      ...COMMON_TAIL,
    ],
  },

  {
    slug: "red-flags-interior-designer",
    category: "Designer Tips",
    title: "5 Red Flags to Spot Before You Sign With an Interior Designer",
    description:
      "Glossy Instagram portfolios hide a lot. Here are the warning signs that separate trustworthy designers from the ones who overpromise and disappear.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80&auto=format&fit=crop",
    author: { name: "Sarah Tan", avatar: "ST" },
    readMin: 8,
    publishedOn: "2026-04-04",
    lede:
      "The most expensive mistake homeowners make isn't the wrong tile — it's the wrong designer. These are the five signals that tell you to walk away before paying a single deposit.",
    body: [
      {
        type: "p",
        text:
          "A good interior designer will save you money. A bad one will quietly cost you a renovation's worth on top of the renovation. The difference is usually visible inside the first two meetings — if you know what to look for.",
      },
      { type: "h2", text: "1. They quote without measuring" },
      {
        type: "p",
        text:
          "A trustworthy designer asks to see the unit before committing to a price. Anyone willing to quote from a floor plan alone is either inexperienced or planning to recover the unknowns through variation orders later.",
      },
      { type: "h2", text: "2. The quote has no specifications" },
      {
        type: "p",
        text:
          "If the quote says 'kitchen cabinet — $7,500' without naming the material, thickness, edging, or hinge brand, you have no way to compare it to another firm. That ambiguity is rarely accidental.",
      },
      { type: "h2", text: "3. They pressure you to decide fast" },
      {
        type: "p",
        text:
          "'Sign today and I'll waive the design fee' is a sales tactic, not a deal. A reputable firm has a pipeline; they don't need to close you in 48 hours.",
      },
      { type: "h2", text: "4. Their reviews are all five stars and recent" },
      {
        type: "p",
        text:
          "Healthy review profiles have a mix of ratings stretching back years. Look for how they respond to the 3-star reviews — that tells you who you'll actually be dealing with when something goes wrong.",
      },
      { type: "h2", text: "5. The contract is one page" },
      {
        type: "p",
        text:
          "A real renovation contract spells out payment milestones, variation order policy, defect rectification windows, and dispute procedures. If yours fits on a single A4, it isn't protecting you.",
      },
      ...COMMON_TAIL,
    ],
  },

  {
    slug: "read-renovation-quote-singapore",
    category: "Cost Guides",
    title: "How to Read a Renovation Quote Without Getting Burned",
    description:
      "Every line item, decoded. Learn which costs are negotiable, which are inflated, and the four words that should never appear in your quote.",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80&auto=format&fit=crop",
    author: { name: "Marcus Lee", avatar: "ML" },
    readMin: 10,
    publishedOn: "2026-03-22",
    lede:
      "Most renovation quotes are designed to look comparable while being anything but. Here's how to translate the document on your kitchen table into a real apples-to-apples comparison.",
    body: [
      {
        type: "p",
        text:
          "The first time most homeowners see a renovation quote, they focus on the bottom line. By the second or third quote, the panic sets in: the numbers don't match, the line items don't align, and nobody seems to be quoting the same thing.",
      },
      { type: "h2", text: "Watch for these four words" },
      {
        type: "ul",
        items: [
          "'Allowance' — means the price will be revised when you choose the actual item. Often upward.",
          "'Subject to' — anything qualified this way isn't actually quoted. It's a placeholder.",
          "'Estimated' — same as above, in a different jacket.",
          "'As required' — the catch-all that turns into a variation order on day 14.",
        ],
      },
      { type: "h2", text: "Demand specifications, not descriptions" },
      {
        type: "p",
        text:
          "'Quality laminate' is a description. '0.7mm PET laminate, ABS edge banding, soft-close hinges' is a specification. The first protects the designer; the second protects you.",
      },
      ...COMMON_TAIL,
    ],
  },

  {
    slug: "small-home-layout-mistakes",
    category: "Style & Layout",
    title: "The 7 Layout Mistakes That Make Small Singapore Homes Feel Smaller",
    description:
      "Avoid the spatial blunders most homeowners only notice after move-in — plus simple fixes you can apply before the carpenter cuts a single panel.",
    image:
      "https://images.unsplash.com/photo-1618220179428-22790b461013?w=1600&q=80&auto=format&fit=crop",
    author: { name: "Priya Kumar", avatar: "PK" },
    readMin: 7,
    publishedOn: "2026-03-14",
    lede:
      "Square footage is fixed. How a space feels isn't. These are the seven layout choices that quietly compress a small Singapore home — and the alternatives that open it back up.",
    body: [
      {
        type: "p",
        text:
          "Most cramped homes weren't cramped by their floor plan. They were cramped by a series of small decisions that added up — usually decided in a single afternoon with a designer who was already booked for the week.",
      },
      { type: "h2", text: "1. Floor-to-ceiling cabinetry on every wall" },
      {
        type: "p",
        text:
          "Storage is good. Storage that consumes every vertical surface is not. Leave one wall to breathe.",
      },
      { type: "h2", text: "2. Mounting the TV before the sofa is chosen" },
      {
        type: "p",
        text:
          "TV first, sofa later is how living rooms end up awkwardly proportioned. Pick the seating, then anchor the screen.",
      },
      ...COMMON_TAIL,
    ],
  },

  {
    slug: "protect-renovation-payments",
    category: "Protect Your Money",
    title: "Why 1 in 3 Homeowners Lose Money to Their ID — And How to Protect Yours",
    description:
      "From disappearing deposits to delayed projects, we explain the most common ways homeowners lose money — and the simple safeguards that prevent it.",
    image:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1600&q=80&auto=format&fit=crop",
    author: { name: "Jonathan Ng", avatar: "JN" },
    readMin: 9,
    publishedOn: "2026-03-03",
    lede:
      "Most homeowners only learn about renovation horror stories after signing one of their own. Here's how the money actually goes missing — and the three safeguards that stop it.",
    body: [
      {
        type: "p",
        text:
          "The phrase 'they took the deposit and disappeared' is one of the most common refrains in Singapore homeowner forums. It's also one of the most preventable.",
      },
      { type: "h2", text: "Where the money goes" },
      {
        type: "p",
        text:
          "Sometimes it's outright fraud. More often it's a firm that's quietly insolvent, juggling new deposits to fund delivery on older projects until the music stops.",
      },
      { type: "h2", text: "The three safeguards" },
      {
        type: "ul",
        items: [
          "Pay in milestones tied to actual on-site progress, not the calendar.",
          "Use an escrow-style payment service so the firm cannot draw funds until you confirm.",
          "Never pay more than 25% upfront — even for 'discounts'.",
        ],
      },
      ...COMMON_TAIL,
    ],
  },

  {
    slug: "renovation-timeline-12-weeks",
    category: "Renovation Process",
    title: "From Handover to Move-In: Your 12-Week Renovation Timeline Explained",
    description:
      "A clear, week-by-week breakdown of what should be happening on site — so you know exactly when to be worried and when to relax.",
    image:
      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1600&q=80&auto=format&fit=crop",
    author: { name: "Network Editorial", avatar: "NE" },
    readMin: 5,
    publishedOn: "2026-02-20",
    lede:
      "Most renovation anxiety comes from not knowing what should be happening on any given week. Use this timeline as your reference — and a quiet check on your designer's promises.",
    body: [
      { type: "h2", text: "Weeks 1–2 — Hacking and demolition" },
      {
        type: "p",
        text:
          "Walls down, tiles up, old carpentry stripped. The dustiest phase. If hacking is still ongoing in week 3, the project is already drifting.",
      },
      { type: "h2", text: "Weeks 3–5 — Masonry, plumbing, electrical" },
      {
        type: "p",
        text:
          "New walls, water points, electrical conduits. The skeleton of the home is rebuilt here. Quiet weeks visually, critical weeks structurally.",
      },
      { type: "h2", text: "Weeks 6–9 — Carpentry, tiling, painting" },
      {
        type: "p",
        text:
          "The home starts to look like itself. This is also when most variation orders surface — review them in writing, never verbally.",
      },
      { type: "h2", text: "Weeks 10–12 — Defects, deep clean, handover" },
      {
        type: "p",
        text:
          "Walk through twice: once with the designer, once on your own. Document everything. The defects you let slide here are the ones you'll pay to fix yourself in six months.",
      },
      ...COMMON_TAIL,
    ],
  },
];

export function findPostBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function relatedPosts(slug: string, limit = 3): Post[] {
  const current = findPostBySlug(slug);
  if (!current) return POSTS.slice(0, limit);
  const sameCategory = POSTS.filter(
    (p) => p.slug !== slug && p.category === current.category
  );
  const others = POSTS.filter(
    (p) => p.slug !== slug && p.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function formatPublishedDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-SG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
