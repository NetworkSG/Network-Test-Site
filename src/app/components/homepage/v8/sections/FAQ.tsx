import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, serif, sans, FadeIn, TagLabel, SectionCTA } from "../primitives";
import { FAQ_ITEMS_V2 } from "../../content";
import type { FAQAnswerBlock, FAQItem } from "../../types";

// Render simple **bold** segments inline. Keeps the data file plain JSON-friendly
// while still letting list items lead with a bolded label (e.g. "**HDB flats:** 8 to 12 weeks…").
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ fontWeight: 600, color: C.black }}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}

function AnswerBody({ faq }: { faq: FAQItem }) {
  const blocks: FAQAnswerBlock[] = faq.answerBlocks ?? [faq.answer];
  const paragraphStyle: React.CSSProperties = {
    color: C.gray,
    fontFamily: sans,
  };
  return (
    <div className="pb-6 max-w-[600px] flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (typeof block === "string") {
          return (
            <p key={i} className="text-[15px] font-normal leading-[1.75]" style={paragraphStyle}>
              {renderInline(block)}
            </p>
          );
        }
        if ("ol" in block) {
          return (
            <ol key={i} className="text-[15px] font-normal leading-[1.75] pl-5 list-decimal flex flex-col gap-1.5" style={paragraphStyle}>
              {block.ol.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
            </ol>
          );
        }
        return (
          <ul key={i} className="text-[15px] font-normal leading-[1.75] pl-5 list-disc flex flex-col gap-1.5" style={paragraphStyle}>
            {block.ul.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
          </ul>
        );
      })}
    </div>
  );
}

export function FAQ({ scrollToForm }: { scrollToForm: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // FAQPage structured data (JSON-LD) — emitted as a <script> in the section so
  // Google can show these as expandable rich-result dropdowns and so AI
  // assistants (ChatGPT / Claude / Perplexity / Gemini) can pull canonical
  // answers when users ask about Network. Uses the flat `answer` text rather
  // than the rich blocks because schema.org/Question expects plain text.
  const faqJsonLd = useMemo(() => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS_V2.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }), []);

  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]">
      {/* SEO: FAQPage rich-result schema. Safe to embed once per page. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>FAQs</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-4">
          <h2 className="font-normal leading-[1.15]" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            Questions <span style={{ color: C.gray }}>we get asked the most</span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.08} className="text-center mb-14">
          <p className="text-[15px] font-normal leading-[1.75]" style={{ color: C.grayLight, fontFamily: sans }}>
            Straight answers. No fine print.
          </p>
        </FadeIn>

        <div className="max-w-[760px] mx-auto">
          {FAQ_ITEMS_V2.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.02}>
              <div style={{ borderBottom: `1px solid ${C.creamBorder}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left py-6 cursor-pointer group flex items-center justify-between gap-6 hover:opacity-70"
                  aria-expanded={openFaq === i}
                  style={{ transition: "all 0.15s" }}>
                  <span className="text-[17px] md:text-[20px] font-normal leading-[1.3]" style={{ fontFamily: serif, color: C.black }}>{faq.question}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[20px] shrink-0 w-7 h-7 flex items-center justify-center"
                    style={{ color: C.grayLight }}>+</motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <AnswerBody faq={faq} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.15} className="text-center mt-12">
          <SectionCTA label="Get My Free Matches" onClick={scrollToForm} />
        </FadeIn>
      </div>
    </section>
  );
}
