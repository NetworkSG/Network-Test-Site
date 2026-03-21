import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import svgPaths from "../../imports/svg-joburr35cn";

const steps = [
  {
    number: "01",
    title: "Tell Us About Your Project",
    content:
      "Share your budget, timeline, and style preferences with our concierge team. We'll ask the right questions to understand exactly what you need — no pushy sales talk, just clarity.",
    tags: ["3-minute call", "Budget discussion", "Style preferences", "+ more"],
  },
  {
    number: "02",
    title: "We Shortlist 3-5 Designers for You",
    content:
      "From our network of 120+ verified firms, we filter by your budget, style, and timeline. Every designer is HDB-licensed, BCA-registered, and vetted through past homeowner feedback.",
    tags: ["HDB-licensed", "Past project verified", "Budget matched", "+ more"],
  },
  {
    number: "03",
    title: "Designers Reach Out with Proposals",
    content:
      "Your matched designers will contact you directly (usually via WhatsApp) to schedule a no-obligation meeting. They'll show you their portfolios, discuss layout ideas, and provide itemized quotes.",
    tags: ["Portfolio review", "Layout concepts", "Transparent quotes", "+ more"],
  },
  {
    number: "04",
    title: "You Choose — Or Don't",
    content:
      "Meet the designers at your own pace. Ask questions. Compare quotes. If someone feels right, move forward. If not, walk away — zero obligations, zero pressure.",
    extraContent:
      "Our concierge team stays available if you need help deciding or want additional matches.",
    tags: ["Zero obligations", "Your timeline", "Concierge support", "+ more"],
  },
];

export function HowItWorks() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="px-4 md:px-8 py-12 md:py-20">
      <div className="max-w-[1293px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Card */}
          <div className="bg-white border border-white shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.08)] p-1.5 md:p-2 lg:w-[504px] shrink-0 self-start rounded-[50px]">
            <div className="bg-[#f6f6f6] p-6 md:p-8 rounded-[45px]">
              <div className="bg-[#f0f0f0] border border-[#3f3f3f] rounded-[100px] shadow-[0px_7px_12.3px_0px_rgba(0,0,0,0.18)] inline-flex items-center justify-center px-5 py-2 mb-6">
                <span className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090b] tracking-[-0.8px]">
                  What we do
                </span>
              </div>

              <h2 className="font-['Inter',sans-serif] font-semibold text-[28px] md:text-[36px] text-[#09090b] tracking-[-1.8px] mb-4 max-w-[329px]">
                How Network Actually Works
              </h2>

              <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] mb-3 max-w-[422px]">
                Get matched with 3-5 vetted renovators who fit your budget, style, and timeline. You meet them, compare their proposals, and choose — or walk away.
              </p>

              <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] mb-8 max-w-[422px]">
                {`Here's how we make it that simple.`}
              </p>

              <div className="bg-[#f6f6f6] border border-white rounded-[100px] inline-block p-[6px] cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center gap-2 px-6 py-3 whitespace-nowrap">
                  <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-[-0.8px]">
                    Get Matched with Renovators
                  </span>
                  <svg className="size-[18px]" fill="none" viewBox="0 0 18 8.72">
                    <path d={svgPaths.p3eae7e00} fill="white" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Steps & Tags */}
          <div className="flex-1">
            {/* Accordion Steps */}
            <div className="space-y-0">
              {steps.map((step, index) => (
                <div key={step.number}>
                  <div
                    className="flex items-start justify-between py-6 cursor-pointer"
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  >
                    <h3 className="font-['Inter',sans-serif] font-semibold text-[20px] md:text-[26px] text-[#09090b] tracking-[-1.3px] max-w-[530px]">
                      {step.number} {step.title}
                    </h3>
                    <button className="shrink-0 ml-4">
                      <motion.div
                        className="size-[32px] bg-[#e3e3e3] rounded-full border border-white/50 shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.06)] flex items-center justify-center"
                        animate={{ rotate: openIndex === index ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <line x1="7" x2="7" y1="2" y2="12" stroke="#A4A4A4" strokeWidth="2" strokeLinecap="round" />
                          <line x1="12" x2="2" y1="7" y2="7" stroke="#A4A4A4" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </motion.div>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {openIndex === index && step.content && (
                      <motion.div
                        key={`content-${step.number}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="pb-6 max-w-[603px]">
                          <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a]">
                            {step.content}
                          </p>
                          {step.extraContent && (
                            <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] mt-4">
                              {step.extraContent}
                            </p>
                          )}
                          {step.tags && (
                            <div className="flex flex-wrap gap-3 mt-4">
                              {step.tags.map((tag) => (
                                <div
                                  key={tag}
                                  className="bg-white border border-[#ddd] rounded-[100px] shadow-[0px_7px_11.6px_0px_rgba(0,0,0,0.03)] px-5 py-2"
                                >
                                  <span className="font-['Inter',sans-serif] text-[14px] text-[#09090b] tracking-[-0.7px]">
                                    {tag}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {index < steps.length - 1 && (
                    <div className="h-px bg-[#DBDBDB]" />
                  )}
                </div>
              ))}
            </div>

            {/* Free info box */}
            <div className="bg-[#f9fafb] border border-[#dddbdb] rounded-[20px] md:rounded-[30px] p-6 md:p-8 mt-8">
              <h4 className="font-['Inter',sans-serif] font-semibold text-[18px] md:text-[20px] text-[#09090b] tracking-[-1px] mb-4">
                {`"But how is this actually free?"`}
              </h4>
              <p className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-[#71717a] tracking-[-0.16px]">
                {`Designers pay us a subscription to access our platform. You don't pay us anything — not now, not ever.`}
              </p>
              <p className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-[#71717a] tracking-[-0.16px] mt-4">
                {`We don't take commissions from your project, so there's no markup on quotes. What they quote is what you pay.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}