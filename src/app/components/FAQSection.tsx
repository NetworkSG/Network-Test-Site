import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../../imports/svg-joburr35cn";

const faqs = [
  {
    question: "How is Network actually free for homeowners?",
    answer:
      "Designers pay us a subscription to access our platform. You never pay us anything.\n\nUnlike other platforms, we don't take commissions from your project, so there's no markup passed to you. What they quote is what you pay.",
  },
  {
    question: "Do I have to sign a contract with Network?",
    answer:
      "No. We're just making introductions.\n\nIf you choose a designer, you sign a contract directly with them — not with us.",
  },
  {
    question: "Is my budget too low to use Network?",
    answer:
      "Probably not. We work with budgets from $30K (HDB) to $400K+ (Landed).\n\nIf your budget doesn't match your scope, our team will tell you honestly and suggest adjustments. Use our cost guide if you want to check first.",
  },
  {
    question: "When should I reach out to Network?",
    answer:
      "Ideally 2–3 months before key collection or starting renovation.\n\nBut if you're 6+ months away or already collected keys, that's fine too. Reach out when you're ready to start planning seriously.",
  },
  {
    question: "Are you the interior designer?",
    answer:
      "No. We're not a design firm.\n\nWe help you find the right designer for your project by matching you with verified professionals who fit your style, scope, and budget.",
  },
  {
    question: "Are your designers licensed or certified?",
    answer:
      "Yes. Every designer is HDB-registered and meets licensing standards.\n\nWe only work with firms that have verified backgrounds and real completed projects.",
  },
  {
    question: "What's the difference between interior designers and contractors?",
    answer:
      "Interior Designers: Handle design AND execution (layouts, materials, managing contractors).\nContractors: Execute existing designs only (you need plans from an architect/ID first).\n\nMost homeowners need an ID. Our team will help you figure out what fits your project.",
  },
  {
    question: "Will I get spam calls after signing up?",
    answer:
      "No. Our team calls you once to understand your project, then we match you with 3-5 designers.\n\nThose designers reach out to schedule meetings. That's it — no spam, no pushy follow-ups.",
  },
  {
    question: "Can I see portfolios before meeting the designers?",
    answer:
      "Designers bring portfolios to your first meeting so you can see their work and ask questions directly.\n\nWe can share basic firm profiles after matching if you want to research first — just ask our team.",
  },
  {
    question: "Do I need to provide my floor plan?",
    answer:
      "Not immediately, but it helps designers give accurate quotes and layout suggestions.\n\nIf you don't have it yet, we can still match you and you can provide it later.",
  },
  {
    question: "Do I have to commit right away?",
    answer:
      "Not at all. Your first meeting is just to explore ideas and get quotes.\n\nTake time to compare proposals. Walk away if nothing feels right. Zero pressure.",
  },
  {
    question: "What if I get matched but don't like any of the designers?",
    answer:
      "That's fine. We can match you with different designers, help refine your brief, or give you more time.\n\nYou're never obligated to choose anyone.",
  },
  {
    question: "What if I'm just exploring and not ready to commit yet?",
    answer:
      "No problem. Use our free tools (cost guide, 3D render) to plan at your own pace.\n\nWhen you're ready to meet designers, we'll be here. No pressure to move forward.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="px-4 md:px-8 py-12 md:py-20">
      <div className="max-w-[1293px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Left Side */}
          <div className="lg:w-[420px] shrink-0 flex flex-col">
            <div className="flex-1">
              <div className="lg:sticky lg:top-[120px] px-[0px] pt-[36px] pb-[12px]">
                <div className="bg-[#f0f0f0] border border-[#3f3f3f] rounded-[100px] shadow-[0px_7px_12.3px_0px_rgba(0,0,0,0.18)] inline-flex items-center justify-center px-5 py-2 mb-6 self-start">
                  <span className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090b] tracking-[-0.8px]">
                    FAQs
                  </span>
                </div>

                <h2 className="font-['Inter',sans-serif] font-semibold text-[28px] md:text-[36px] text-[#09090b] tracking-[-1.8px] mb-4 max-w-[388px]">
                  Still Have Questions? We Thought You Might.
                </h2>

                <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] max-w-[422px] mb-8">
                  {`Here's what most homeowners want to know before getting matched.`}
                </p>
              </div>
            </div>

            {/* Contact Card */}
            <div className="hidden md:flex bg-[#f6f6f6] border border-white rounded-[20px] shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.06)] p-3 md:p-4 max-w-[469px] mt-auto flex-col items-center text-center">
              {/* White inner card */}
              <div className="bg-white rounded-[15px] w-full p-6 md:p-8 flex flex-col items-center mb-4">
                <p className="font-['Inter',sans-serif] font-semibold text-[22px] md:text-[26px] text-[#09090b] tracking-[-1.2px] mb-5">
                  {`Can't find your answer?`}
                </p>
                <div className="bg-[#f6f6f6] border border-white rounded-[100px] inline-block p-[6px]">
                  <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center gap-3 px-8 py-3.5">
                    <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-[-0.8px]">
                      Talk to Our Team
                    </span>
                    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 8.72">
                      <path d={svgPaths.p3eae7e00} fill="white" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Gray copy below */}
              <p className="font-['Inter',sans-serif] text-[15px] text-[#999] tracking-[-0.3px] mb-1.5">
                or email us at
              </p>
              <a href="mailto:customersupport@orangenetworkstudios.com" className="font-['Inter',sans-serif] font-medium text-[15px] md:text-[17px] text-[#09090b] tracking-[-0.5px] underline underline-offset-4 hover:text-[#333] transition-colors mb-2">
                customersupport@orangenetworkstudios.com
              </a>
            </div>
          </div>

          {/* Right Side - FAQ Accordion */}
          <div className="flex-1">
            {faqs.map((faq, index) => (
              <div key={index}>
                <div
                  className="flex items-start justify-between py-6 cursor-pointer"
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                >
                  <h3 className="font-['Inter',sans-serif] font-semibold text-[20px] md:text-[26px] text-[#09090b] tracking-[-1.3px] max-w-[530px]">
                    {String(index + 1).padStart(2, "0")}. {faq.question}
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
                  {openIndex === index && faq.answer && (
                    <motion.div
                      key={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] pb-6 max-w-[603px] whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {index < faqs.length - 1 && <div className="h-px bg-[#DBDBDB]" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}