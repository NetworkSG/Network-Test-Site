import type {
  QualifyingQuestion, FAQItem, TrustStat, HowItWorksStep, ProjectCard, Testimonial,
  PainPointContent, ValueProp, Differentiator, GuaranteeContent, FinalRecapContent,
} from "./types";

// ─── Navbar ───
export const NAVBAR = {
  logo: "NETWORK",
  links: [
    { label: "Get matched", href: "#lead-form" },
    { label: "Find your design style", href: "/explore" },
    { label: "Cost guide", href: "/cost-guide" },
  ],
  cta: { label: "Get matched", href: "#lead-form" },
};

// ─── Hero ───
export const HERO = {
  eyebrow: "Trusted by 3,214 Singapore homeowners this year",
  headline: "Renovate Your Home With Total Confidence.",
  headlineItalic: "We'll Match You to a Designer You Can Trust.",
  subheadline:
    "Struggling to find a reliable interior designer? Our concierge team handpicks 3 verified firms that fit your style, budget, and timeline. Free. Within the day. No obligation.",
  formTitle: "Get Your Free Designer Match",
  formSubtitle: "Answer 6 quick questions and get matched with verified designers who fit your project. Free, no obligations.",
  submitButton: "Get My Free Matches",
  trustMicrocopy: "3,214 homeowners matched this year · Free · No obligations",
};

// ─── Qualifying Questions ───
export const QUALIFYING_QUESTIONS: QualifyingQuestion[] = [
  {
    questionNumber: 1,
    totalQuestions: 7,
    question: "What best describes your situation?",
    options: [
      {
        label: "Collecting keys for a new home — BTO or new launch condo",
        response:
          "Great. New homes are the best time to get the design right from the start. We'll make sure the firms we match you with specialise in new key collections and can work around your timeline.",
      },
      {
        label: "Buying a resale flat or condo",
        response:
          "Good to know. Resale homes often need more considered planning around existing conditions. We'll match you with firms experienced in resale renovations who know how to work with what's already there.",
      },
      {
        label: "I already own my home — Planning to renovate",
        response:
          "Noted. Whether it's a refresh or a full gut job, we'll find firms that have done it before and can give you an honest scope before you commit to anything.",
      },
    ],
  },
  {
    questionNumber: 2,
    totalQuestions: 7,
    question: "When are you looking to start renovation?",
    options: [
      {
        label: "Within 3 months",
        response:
          "You're in the right window. We'll prioritise firms with availability who can move at your pace and get proposals to you quickly.",
      },
      {
        label: "3 to 6 months",
        response:
          "Good timing. Enough runway to shortlist properly, compare proposals, and make a decision without feeling rushed.",
      },
      {
        label: "6 to 12 months",
        response:
          "Still a bit out but worth starting conversations early. The best firms book up fast. We'll match you with designers who are happy to plan ahead.",
      },
      {
        label: "Not ready yet — still early days",
        response:
          "No problem. We won't match you with a designer just yet — it's a bit early and wouldn't be a good use of anyone's time. We'll send you our cost guide and design style resources to help you plan. When you're within 6 months of starting, come back and we'll get you matched properly.",
      },
    ],
  },
  {
    questionNumber: 3,
    totalQuestions: 7,
    question: "What type of home are you renovating?",
    options: [
      {
        label: "HDB flat",
        response:
          "Most of our matched firms specialise in HDB renovations and understand the specific requirements, restrictions, and opportunities that come with the space.",
      },
      {
        label: "Condo",
        response:
          "Noted. Condo renovations come with their own set of MCST rules and considerations. We'll match you with firms that have handled condo projects and know how to navigate that.",
      },
    ],
  },
  {
    questionNumber: 4,
    totalQuestions: 7,
    question: "What best describes the home you want to create?",
    note: "Select an option to see typical cost ranges.",
    options: [
      {
        label: "Functional and clean — Everything works, nothing unfinished",
        response:
          "That's a clear brief. We'll match you with firms that are strong on practical execution and deliver clean, well-finished work without overcomplicating the scope.",
        reveal:
          "$30K–$60K for a typical HDB or condo. This covers the essentials well. Practical, liveable, done properly.",
      },
      {
        label: "Nice home, good finishes — Friends will notice. You will every day.",
        response:
          "Good direction. This is the level where design decisions start to feel cohesive and the finish quality becomes genuinely noticeable day to day. We'll match you with firms that work well in this range.",
        reveal:
          "$60K–$100K for a typical HDB or condo. This is where the home starts to feel considered. Better materials, cohesive decisions, spaces that flow into each other. You notice the difference every single day you live there. This is the threshold where full ID involvement becomes worth the investment.",
      },
      {
        label: "Considered and design-led — Reflects who you are as a family",
        response:
          "Understood. You're looking for a firm that thinks about how you actually live, not just how the home looks in photos. We'll match you with designers who lead with function and bring the aesthetic along with it.",
        reveal:
          "$100K–$150K for a typical HDB or condo. A home built around how you actually live. Custom details, intentional layout, materials that age well. A senior designer is usually involved from the start.",
      },
      {
        label: "Fully customised, no compromises — Every corner is deliberate",
        response:
          "Clear. You know what you want and you need a firm with the capability and process to execute at that level. We'll match you with designers who work at the top end and have the portfolio to back it up.",
        reveal:
          "$150K+ for a typical HDB or condo. No compromises. Every surface, every corner is deliberate. Usually for larger homes or homeowners who know exactly what they want.",
      },
    ],
  },
  {
    questionNumber: 5,
    totalQuestions: 7,
    question: "What is your biggest concern about renovating?",
    options: [
      {
        label: "Worried about poor workmanship — I want it done right, not just done fast",
        response:
          "That's the right thing to be thinking about. We only work with firms that have verified track records and real completed projects. We'll flag workmanship quality as a priority in your match brief.",
      },
      {
        label: "Don't know what design direction I want yet — I need help finding a direction",
        response:
          "That's more common than you think. The best ID firms are good at drawing out what you actually want even when you can't articulate it yet. We'll match you with designers who are strong on the brief-building process. In the meantime, our design style quiz might help you get clearer before the first meeting.",
      },
      {
        label: "Concerned about budget overruns — I want full cost transparency",
        response:
          "Completely valid. We'll match you with firms known for detailed, itemised quoting and transparent project management. No surprises mid-renovation.",
      },
      {
        label: "Not sure how to choose the right firm — Too many options, not enough clarity",
        response:
          "That's exactly what we're here for. Our concierge team will talk you through the options and make sure you feel confident in the shortlist before any meetings are scheduled.",
      },
    ],
  },
  {
    questionNumber: 6,
    totalQuestions: 7,
    question: "Are you the main decision maker for this renovation?",
    options: [
      {
        label: "Yes",
        response:
          "Perfect. That makes the process cleaner for everyone. Our team will reach out directly to you to confirm the brief and get your matches ready.",
      },
      {
        label: "No, I am helping someone else",
        response:
          "No problem. Let us know who we should be speaking to when our team reaches out and we'll make sure the right person is in the loop.",
      },
    ],
  },
  {
    questionNumber: 7,
    totalQuestions: 7,
    question: "How would you prefer to meet your matched designers?",
    options: [
      {
        label: "Virtual",
        response:
          "Got it. We'll let your matched designers know you prefer a virtual meeting. They'll schedule a video call at a time that works for you.",
      },
      {
        label: "Physical",
        response:
          "Noted. We'll let your matched designers know you'd like to meet in person. They'll arrange a face-to-face consultation at their studio or a convenient location.",
      },
    ],
  },
];

// ─── Completion Screen ───
export const COMPLETION = {
  headline: "You're in.",
  subheadline:
    "Our concierge team will reach out within the day to understand your brief and get your matches ready.",
  body: "In the meantime, use our cost guide to pressure-test your budget, or take the design style quiz to get clearer on your direction before the call.",
  cta1: { label: "Explore the cost guide", href: "/cost-guide" },
  cta2: { label: "Find your design style", href: "/explore" },
};

// ─── Trust Bar ───
export const TRUST_STATS: TrustStat[] = [
  { value: "120+", label: "verified firms" },
  { value: "4.8", label: "average rating" },
  { value: "3,214", label: "matched this year" },
  { value: "$0", label: "fee to homeowners" },
];

// ─── Social Proof ───
export const SOCIAL_PROOF = {
  label: "Matched through Network",
  subheadline: "Real homes. Real matches. Real results.",
  anchorLine:
    "Each of these homeowners started where you are now. They filled in the form, got matched, and chose a designer they trusted.",
  cta: "Get My Free Matches →",
  projects: [
    {
      propertyTag: "4-Room HDB · Bishan · $65K · Full renovation",
      reviewQuote: "\"Felt like it was designed for us specifically.\"",
      verified: true,
    },
    {
      propertyTag: "3-Room HDB · Tampines · $48K · Full renovation",
      reviewQuote: "\"They understood what we wanted before we could explain it.\"",
      verified: true,
    },
    {
      propertyTag: "Condo · Clementi · $110K · Full renovation",
      reviewQuote: "\"Every detail was considered. We didn't have to chase anything.\"",
      verified: true,
    },
  ] as ProjectCard[],
};

// ─── Testimonials ───
export const TESTIMONIALS = {
  label: "Testimonials",
  headline: "Turns out, people like getting matched ",
  headlineItalic: "right.",
  items: [
    {
      name: "Sarah Lim",
      role: "Homeowner, Bishan HDB",
      quote:
        "The matching was spot on. Our designer understood exactly what we wanted before we could even explain it. The whole process felt effortless.",
      avatar: "/Profile/unnamed.png",
    },
    {
      name: "James Tan",
      role: "Homeowner, Clementi Condo",
      quote:
        "No chasing contractors, no guesswork. Network matched us with a firm that delivered exactly what was promised. Every detail was considered.",
      avatar: "/Profile/unnamed (2).png",
    },
    {
      name: "Rachel Wong",
      role: "Homeowner, Tampines HDB",
      quote:
        "We were nervous about our first renovation. Network made it easy to find a designer who fit our budget and style. Couldn't be happier with the result.",
      avatar: "/Profile/unnamed (1).png",
    },
  ] as Testimonial[],
};

// ─── How It Works ───
export const HOW_IT_WORKS = {
  label: "How it works",
  headline: "What happens after you submit",
  steps: [
    {
      number: "01",
      title: "Our concierge team reviews your profile",
      description:
        "Within the day, someone from our team reaches out to confirm your brief and answer any questions before we match you.",
    },
    {
      number: "02",
      title: "We shortlist 3 firms that actually fit",
      description:
        "From 120+ verified designers, we filter by your style direction, budget, home type, and timeline. You get 3 firms, not 6. Quality over volume.",
    },
    {
      number: "03",
      title: "Designers reach out with proposals",
      description:
        "Your matched designers contact you via WhatsApp to schedule a no-obligation consultation. They bring portfolios, layout ideas, and itemised quotes.",
    },
    {
      number: "04",
      title: "You choose, or you don't",
      description:
        "Meet them at your own pace. Compare proposals. Walk away if nothing feels right. Zero pressure, zero obligations.",
    },
  ] as HowItWorksStep[],
  inlineNote:
    "But how is this actually free? Designers pay a subscription to access our platform. We don't take commissions from your project, so there's no markup on quotes. What they quote is what you pay.",
};

// ─── FAQ ───
export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How is Network free for homeowners?",
    answer:
      "Designers pay a subscription to access our platform. We don't take commissions, so there's no markup on quotes. What they quote is what you pay.",
  },
  {
    question: "Do I have to sign anything with Network?",
    answer:
      "No. We're just making introductions. You sign directly with the designer, not with us.",
  },
  {
    question: "Is my budget too low?",
    answer:
      "We work with budgets from $30K up to $400K+. If your budget doesn't match your scope, our team will tell you honestly before matching you.",
  },
  {
    question: "When should I reach out?",
    answer:
      "Ideally 2 to 3 months before key collection. But if you're further out, reach out when you're ready to start planning seriously.",
  },
  {
    question: "Will I get spam calls?",
    answer:
      "No. Our team calls you once. Your matched designers reach out to schedule consultations. That's it.",
  },
  {
    question: "What if I'm just exploring?",
    answer:
      "Use our cost guide or design style quiz to plan at your own pace. When you're ready, we'll be here.",
  },
  {
    question: "Are your designers licensed?",
    answer:
      "Yes. Every designer is HDB-registered with verified backgrounds and real completed projects.",
  },
  {
    question: "ID vs contractor — what's the difference?",
    answer:
      "Interior designers handle design and execution. Contractors execute existing designs only. Most homeowners need an ID. Our team will help you figure out what fits.",
  },
];

// ─── Supabase Social Proof Images ───
const SUPABASE_SP = "https://ttalzucoummnkomjvcfr.supabase.co/storage/v1/object/public/social-proof";

export const SOCIAL_PROOF_IMAGES = {
  homeownerFeedback: [
    { url: `${SUPABASE_SP}/ho-feedback/img-000.jpg`, caption: "Homeowner impressed by designer's professionalism" },
    { url: `${SUPABASE_SP}/ho-feedback/img-002.jpg`, caption: "Thanking our team for prompt renovation help" },
    { url: `${SUPABASE_SP}/ho-feedback/img-005.jpg`, caption: "Homeowner confirms engaging a matched firm" },
    { url: `${SUPABASE_SP}/ho-feedback/img-090.jpg`, caption: "Designer updates on successful lead meetings" },
    { url: `${SUPABASE_SP}/ho-feedback/img-093.jpg`, caption: "Designer provides consultation status updates" },
    { url: `${SUPABASE_SP}/ho-feedback/img-094.jpg`, caption: "Homeowner comparing and shortlisting designers" },
    { url: `${SUPABASE_SP}/ho-feedback/img-095.jpg`, caption: "Designer eager to meet matched homeowner" },
    { url: `${SUPABASE_SP}/ho-feedback/img-096.jpg`, caption: "Team celebrates a successful homeowner match" },
    { url: `${SUPABASE_SP}/ho-feedback/img-097.jpg`, caption: "Site visit went well, preparing quotation" },
    { url: `${SUPABASE_SP}/ho-feedback/img-098.jpg`, caption: "Confirming successful meetup with homeowner" },
    { url: `${SUPABASE_SP}/ho-feedback/img-100.jpg`, caption: "New renovation lead distributed with details" },
    { url: `${SUPABASE_SP}/ho-feedback/img-102.jpg`, caption: "Homeowner confirms designer appointment went well" },
    { url: `${SUPABASE_SP}/ho-feedback/img-104.jpg`, caption: "Appointment confirmed for tomorrow with homeowner" },
    { url: `${SUPABASE_SP}/ho-feedback/img-105.jpg`, caption: "Designer updates on layout discussion progress" },
    { url: `${SUPABASE_SP}/ho-feedback/img-110.jpg`, caption: "Strong lead conversion results this month" },
    { url: `${SUPABASE_SP}/ho-feedback/img-111.jpg`, caption: "Contractor confirms winning project through Network" },
    // Short/wide screenshots last
    { url: `${SUPABASE_SP}/ho-feedback/img-006.jpg`, caption: "Homeowner feedback and renovation referral follow-up" },
    { url: `${SUPABASE_SP}/ho-feedback/img-007.jpg`, caption: "Homeowner confirms engaging a recommended designer" },
  ],
  googleReviews: [
    `${SUPABASE_SP}/google-reviews/img-001.jpg`,
    `${SUPABASE_SP}/google-reviews/img-003.jpg`,
    `${SUPABASE_SP}/google-reviews/img-004.jpg`,
  ],
  clientWins: [
    `${SUPABASE_SP}/client-wins/img-008.jpg`,
    `${SUPABASE_SP}/client-wins/img-009.jpg`,
    `${SUPABASE_SP}/client-wins/img-010.jpg`,
    `${SUPABASE_SP}/client-wins/img-011.jpg`,
    `${SUPABASE_SP}/client-wins/img-012.jpg`,
    `${SUPABASE_SP}/client-wins/img-013.jpg`,
  ],
};

// ─── Pain Point (PAS Framework) ───
export const PAIN_POINT: PainPointContent = {
  label: "Sound familiar?",
  salutation: "Dear Homeowner,",
  painQuestions: [
    "Do you feel overwhelmed comparing renovation quotes, unsure if you're being overcharged or getting a fair deal?",
    "Are you worried about hiring a designer who looks great online but delivers sloppy workmanship and broken promises?",
    "Have you spent weeks scrolling through portfolios that all look the same, with no real way to tell who is actually good?",
  ],
  agitate:
    "Here's what most homeowners do.\n\nThey spend 3 to 6 weeks reading forums. Collecting quotes from strangers. Asking friends who renovated 5 years ago.\n\nAnd after all that research? They still feel unsure.\n\nBecause the truth is:\n\n✓ The best firms don't advertise on classifieds\n✓ Portfolios can be staged or cherry-picked\n✓ Online reviews can be bought\n✓ The cheapest quote is almost never the best choice\n\nEvery week you delay is another week closer to key collection. Another week of stress. Another week your dream home stays on a Pinterest board instead of becoming reality.",
  solve:
    "You don't need to spend weeks researching.\n\nYou don't need to collect 10 quotes and compare them in a spreadsheet.\n\nYou don't need to gamble on a firm you found on social media.\n\nWhat you need is a shortlist of 3 verified designers who already match your style, budget, and timeline.\n\nThat's exactly what Network does.\n\nOur concierge team reviews your brief and handpicks 3 firms from 120+ verified designers. Free. Within the day. No obligations.\n\n3,214 homeowners have used this exact process this year.",
  cta: "Get My Free Designer Matches",
};

// ─── Value Props (WIFM) ───
export const VALUE_PROPS: ValueProp[] = [
  {
    label: "Verified quality",
    headline: "Only Vetted Designers. No Guesswork.",
    body: "Every firm on our platform is verified with real completed projects, real homeowner reviews, and background checks.\n\nNo paid listings. No fake portfolios. You only see designers who earned their place through actual results.",
    cta: "See My Matches",
  },
  {
    label: "Matched within the day",
    headline: "3 Handpicked Matches. Within the Day.",
    body: "A real person on our concierge team reviews your brief. Not an algorithm.\n\nYou get 3 firms, not 10. Each one is selected because they've done projects like yours and have capacity to start when you need them.",
    cta: "Start My Match",
  },
  {
    label: "Zero risk",
    headline: "No Cost. No Contract. No Obligation.",
    body: "There's nothing to sign with Network. No deposit. No commitment.\n\nMeet your matched designers, compare their proposals, and decide at your own pace. If nothing feels right, walk away. You pay nothing.",
    cta: "Get Matched Free",
  },
];

// ─── Differentiators ───
export const DIFFERENTIATORS: Differentiator[] = [
  {
    icon: "✓",
    headline: "Verified designers only",
    body: "Every firm passes our vetting process with real completed projects and real homeowner feedback. No paid placements.",
  },
  {
    icon: "$0",
    headline: "No commissions, no markup",
    body: "We never take a cut from your project. Designers pay a subscription to be here. What they quote is what you pay.",
  },
  {
    icon: "☎",
    headline: "Matched by a person, not a bot",
    body: "Our concierge team reads your brief and personally selects your matches. Human judgement, not an auto-generated list.",
  },
  {
    icon: "🏠",
    headline: "Built for Singapore homes",
    body: "HDB requirements, MCST rules, condo restrictions. Every match accounts for your specific home type and regulations.",
  },
  {
    icon: "★",
    headline: "Real homeowner feedback",
    body: "Read unfiltered WhatsApp conversations and project outcomes from homeowners who were matched through Network.",
  },
  {
    icon: "∞",
    headline: "Free for homeowners, always",
    body: "No hidden fees. No premium tiers. No upsells. The full service is free for every homeowner, every time.",
  },
];

// ─── How It Works (3 steps) ───
export const HOW_IT_WORKS_V2 = {
  label: "How it works",
  headline: "From first click to designer shortlist in 3 steps",
  steps: [
    {
      number: "01",
      title: "Tell us about your project",
      description:
        "Answer 6 quick questions about your home, style, budget, and timeline. Takes under 2 minutes. No account or credit card needed.",
    },
    {
      number: "02",
      title: "We handpick 3 designers for you",
      description:
        "Our concierge team reviews your brief and selects 3 verified firms from 120+ designers. Each match is chosen because they've done projects like yours before.",
    },
    {
      number: "03",
      title: "Meet them and decide on your terms",
      description:
        "Your matched designers reach out via WhatsApp with portfolios, layout ideas, and itemised quotes. Compare at your own pace. Walk away if nothing feels right.",
    },
  ] as HowItWorksStep[],
  inlineNote:
    "How is this free? Designers pay a subscription to be on our platform. We never take commissions from your project, so there's no markup on quotes. What they quote is what you pay.",
};

// ─── Guarantee ───
export const GUARANTEE: GuaranteeContent = {
  label: "Our promise to you",
  headline: "Nothing to lose. Everything to gain.",
  body: "We designed Network so there's zero risk on your end. Here's what that means:",
  bullets: [
    "No cost, ever. Designers pay to be on our platform, not you.",
    "No obligation to hire. Meet your matches, compare proposals, decide freely.",
    "No spam. Our team contacts you once. Your designers schedule consultations. That's it.",
    "Only verified firms. Every designer is vetted with real projects and real homeowner reviews.",
  ],
  cta: "Get My Free Matches",
};

// ─── Final Recap ───
export const FINAL_RECAP: FinalRecapContent = {
  headline: "Ready to find a designer you can trust?",
  subheadline: "3,214 Singapore homeowners got matched this year. Takes 2 minutes. Completely free.",
  bullets: [
    "120+ verified interior design firms",
    "3 handpicked matches within the day",
    "100% free, no obligation",
    "Real homeowner reviews you can read",
    "Matched by a real person, not a bot",
  ],
  cta: "Get My Free Matches",
};

// ─── FAQ (6 items) ───
export const FAQ_ITEMS_V2: FAQItem[] = [
  {
    question: "How is this free?",
    answer:
      "Designers pay a subscription to be on our platform. We never take commissions from your project. That means no markup on your quotes. What they quote is what you pay.",
  },
  {
    question: "Do I have to commit to hiring someone?",
    answer:
      "No. We make introductions. You sign directly with the designer if you choose to move forward. There's zero obligation to hire anyone we match you with.",
  },
  {
    question: "What if my budget is low?",
    answer:
      "We work with budgets from $30K to $400K+. If your budget doesn't match your scope, our team will tell you honestly before matching you.",
  },
  {
    question: "When should I reach out?",
    answer:
      "Ideally 2 to 3 months before key collection. But if you're further out, reach out when you're ready to start planning. The best firms book up fast, so starting early gives you more options.",
  },
  {
    question: "Will I get spam calls?",
    answer:
      "No. Our team contacts you once to confirm your brief. Your 3 matched designers reach out to schedule consultations. That's it.",
  },
  {
    question: "Are your designers licensed?",
    answer:
      "Yes. Every designer on Network is HDB-registered with verified backgrounds, real completed projects, and real homeowner reviews.",
  },
];

// ─── Footer CTA ───
export const FOOTER_CTA = {
  headline: "Your renovator match starts here.",
  subheadline:
    "Ready to renovate with confidence? Get matched with verified designers who fit your style and budget. Completely free.",
  button: "Get matched now",
};

// ─── Footer ───
export const FOOTER = {
  logo: "NETWORK",
  tagline: "Singapore's trusted platform for homeowner-designer matching.",
  links: [
    { label: "Get matched", href: "#lead-form" },
    { label: "Find your design style", href: "/explore" },
    { label: "Cost guide", href: "/cost-guide" },
  ],
  social: [
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "WhatsApp", href: "#" },
  ],
  newsletter: {
    text: "Practical advice for Singapore homeowners, delivered monthly. No spam.",
    button: "Subscribe",
  },
  copyright: "Copyright 2026. All rights reserved.",
};
