export type DesignVariant = 1 | 2 | 3;

export interface LeadFormData {
  name: string;
  phone: string;
  email: string;
}

export interface QualifyingOption {
  label: string;
  response: string;
  /** Only for Q4 — budget reveal text */
  reveal?: string;
}

export interface QualifyingQuestion {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: QualifyingOption[];
  /** Designer note shown above options (e.g. Q4 outcome reveal instruction) */
  note?: string;
}

// One block of a rich FAQ answer. Strings render as paragraphs; objects render
// as ordered or unordered lists. Items support **bold** segments via simple
// inline markdown so the data file stays plain JSON-friendly.
export type FAQAnswerBlock = string | { ol: string[] } | { ul: string[] };

export interface FAQItem {
  /** Heading shown in the accordion. */
  question: string;
  /** Flat plain-text answer — used for FAQPage JSON-LD (Google + AI assistants). */
  answer: string;
  /** Optional rich render — paragraphs + ordered/unordered lists for the visible UI. */
  answerBlocks?: FAQAnswerBlock[];
}

export interface TrustStat {
  value: string;
  label: string;
}

export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
}

export interface ProjectCard {
  propertyTag: string;
  reviewQuote: string;
  verified: boolean;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

export interface ValueProp {
  label: string;
  headline: string;
  body: string;
  cta: string;
}

export interface Differentiator {
  icon: string;
  headline: string;
  body: string;
}


export interface GuaranteeContent {
  label: string;
  headline: string;
  body: string;
  bullets: string[];
  cta: string;
}

export interface FinalRecapContent {
  headline: string;
  subheadline: string;
  bullets: string[];
  cta: string;
}

export interface PainPointContent {
  label: string;
  salutation: string;
  painQuestions: string[];
  agitate: string;
  solve: string;
  cta: string;
}

export type FormState = "idle" | "qualifying" | "complete";
