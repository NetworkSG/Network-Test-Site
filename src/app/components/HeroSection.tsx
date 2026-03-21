import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-joburr35cn";
import img3DMinimalHouse1 from "figma:asset/8728a4911c5416a6277c67c83d7f811ae2c951e8.png";
import img3DMinimalHouse2 from "figma:asset/de35c0f42ba2d1d4f6b1f6785425ec4b0713a4f9.png";
import img3DMinimalHouse3 from "figma:asset/aba5f9bb658878a2b279a872ddd8545ef0961386.png";

export function HeroSection() {
  return (
    <section className="text-center px-[32px] pt-[220px] pb-[96px]">
      {/* Badge */}
      <div className="inline-flex items-center bg-[#fff6dc] border border-[#ffeab1] rounded-[100px] px-5 py-2 shadow-[0px_8px_33.4px_0px_rgba(0,0,0,0.18)] mb-8 md:mb-10">
        <p className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-[#09090b] tracking-[-0.8px]">
          <span className="font-bold">3,214 homeowners</span>
          <span> matched this year</span>
        </p>
      </div>

      {/* Heading */}
      <h1 className="font-['Inter',sans-serif] font-semibold text-[48px] md:text-[80px] text-[#09090b] tracking-[-2px] md:tracking-[-4px] leading-[1.05]">
        Renovation
      </h1>
      <p className="font-['Inter',sans-serif] font-medium text-[48px] md:text-[80px] text-[#71717a] tracking-[-2.8px] md:tracking-[-4.8px] leading-[1.05] mb-6 md:mb-8">
        Made Simple
      </p>

      {/* Description */}
      <div className="max-w-[637px] mx-auto mb-8 md:mb-12">
        <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a]">
          {`Meet designers who've actually delivered before you commit to anyone.`}
        </p>
        <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a]">
          100% free for homeowners. No hidden markups.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="relative z-10">
        {/* Desktop: expandable CTA buttons */}
        <div className="hidden md:block">
          <CTAButtonGroup />
        </div>
        {/* Mobile: single Get Matched button + bottom sheet */}
        <MobileCTASheet />
      </div>

      {/* Bottom link */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <span className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#09090b]">
          Planning a landed or commercial project?
        </span>
        <span className="font-['Inter',sans-serif] font-semibold text-[18px] md:text-[20px] text-[#09090b] tracking-[-1px] cursor-pointer relative">
          Start here
          <svg className="absolute -bottom-1 left-0 w-full h-[7px]" fill="none" viewBox="0 0 88.31 7.07">
            <path d={svgPaths.p15c8b880} fill="#F8D26B" />
          </svg>
        </span>
      </div>
    </section>
  );
}

function CTAButton({ icon, label, width }: { icon: string; label: string; width: string }) {
  return (
    <div className={`bg-[#f6f6f6] border border-white rounded-[100px] shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.17)] h-[60px] md:h-[70px] ${width} relative`}>
      <div className="absolute inset-[6px] md:inset-[7px] bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center px-3 md:px-5 gap-2">
        <div className="size-[28px] md:size-[34px] -scale-y-100 rotate-180 shrink-0">
          <img alt="" className="size-full object-cover" src={icon} />
        </div>
        <span className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-white tracking-[-0.8px] whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}

function ExpandableCTAButton({ icon, label, width, hoverDescription, ctaText, isHovered, onHover, onLeave, slideX, onCtaClick }: { icon: string; label: string; width: string; hoverDescription: string; ctaText: string; isHovered: boolean; onHover: () => void; onLeave: () => void; slideX: number; onCtaClick: () => void }) {
  return (
    <motion.div
      className={`relative ${width} h-[60px] md:h-[70px]`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      animate={{ x: slideX }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Expanded card (absolutely positioned overlay, center-anchored) */}
      <motion.div
        className="absolute top-1/2 left-1/2 bg-[#f6f6f6] border border-white shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.17)] overflow-hidden"
        initial={false}
        animate={{
          width: isHovered ? 320 : "100%",
          height: isHovered ? 410 : "100%",
          borderRadius: isHovered ? 34 : 100,
          x: "-50%",
          y: "-50%",
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ zIndex: isHovered ? 10 : 1 }}
      >
        {/* Inner dark container */}
        <motion.div
          className="absolute bg-[#09090b] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
          initial={false}
          animate={{
            borderRadius: isHovered ? 29 : 100,
            top: isHovered ? 6 : 7,
            left: isHovered ? 8 : 7,
            right: isHovered ? 8 : 7,
            bottom: isHovered ? 8 : 7,
          }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Pill state content */}
          <motion.div
            className="absolute inset-0 flex items-center px-5 gap-2"
            initial={false}
            animate={{ opacity: isHovered ? 0 : 1 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <div className="size-[28px] md:size-[34px] -scale-y-100 rotate-180 shrink-0">
              <img alt="" className="size-full object-cover" src={icon} />
            </div>
            <span className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-white tracking-[-0.8px] whitespace-nowrap">
              {label}
            </span>
          </motion.div>

          {/* Expanded card content */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center pointer-events-none"
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3, delay: isHovered ? 0.15 : 0, ease: "easeInOut" }}
          >
            {/* Icon */}
            <div className="flex items-center justify-center size-[73px] mt-[40px]">
              <div className="-scale-y-100 rotate-180">
                <img alt="" className="size-[73px] object-cover" src={icon} />
              </div>
            </div>

            {/* Title */}
            <p className="font-['Inter',sans-serif] font-extrabold text-[20px] text-white tracking-[-1.2px] whitespace-nowrap mt-[18px]">
              {label}
            </p>

            {/* Description */}
            <p className="font-['Inter',sans-serif] text-[15px] text-[#b0b0b0] text-center px-6 mt-[12px] leading-[1.4]">
              {hoverDescription}
            </p>

            {/* CTA Button */}
            <motion.button
              onClick={(e) => { e.stopPropagation(); onCtaClick(); }}
              className="pointer-events-auto mt-[16px] bg-white text-[#09090b] font-['Inter',sans-serif] font-semibold text-[15px] tracking-[-0.5px] rounded-[100px] px-8 py-3 shadow-sm"
              whileHover={{ scale: 1.05, boxShadow: "0px 6px 20px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {ctaText}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function CTAButtonGroup() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const slideAmount = 40;

  const getSlideX = (index: number) => {
    if (hoveredIndex === null) return 0;
    if (index === hoveredIndex) return 0;
    if (index < hoveredIndex) return -slideAmount;
    return slideAmount;
  };

  const buttons = [
    {
      icon: img3DMinimalHouse3,
      label: "It's My First Home",
      width: "w-[200px] md:w-[233px]",
      hoverDescription: "New BTO or condo? Get matched with designers who specialize in first-time renovations and guide you from planning to move-in.",
      ctaText: "Start Now",
    },
    {
      icon: img3DMinimalHouse1,
      label: "I'm Upgrading My Space",
      width: "w-[240px] md:w-[288px]",
      hoverDescription: "Already own your home? Get matched with designers experienced in upgrades, remodels, and full makeovers tailored to your lifestyle.",
      ctaText: "Upgrade Now",
    },
    {
      icon: img3DMinimalHouse2,
      label: "I need a Contractor",
      width: "w-[200px] md:w-[233px]",
      hoverDescription: "Looking for a reliable contractor? We'll match you with vetted professionals who deliver quality work on time and on budget.",
      ctaText: "Get Matched",
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
      {buttons.map((btn, i) => (
        <ExpandableCTAButton
          key={btn.label}
          icon={btn.icon}
          label={btn.label}
          width={btn.width}
          hoverDescription={btn.hoverDescription}
          ctaText={btn.ctaText}
          isHovered={hoveredIndex === i}
          onHover={() => setHoveredIndex(i)}
          onLeave={() => setHoveredIndex(null)}
          slideX={getSlideX(i)}
          onCtaClick={() => navigate(`/get-matched?inquiry=${encodeURIComponent(btn.label)}`)}
        />
      ))}
    </div>
  );
}

function MobileCTASheet() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const sheetButtons = [
    {
      icon: img3DMinimalHouse3,
      label: "It's my first home",
    },
    {
      icon: img3DMinimalHouse1,
      label: "I'm upgrading my space",
    },
    {
      icon: img3DMinimalHouse2,
      label: "I need a contractor",
    },
  ];

  return (
    <div className="block md:hidden mb-8">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#f6f6f6] border border-white rounded-[100px] shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.17)] h-[80px] w-[300px] relative"
      >
        <div className="absolute inset-[6px] bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center px-6 gap-4">
          <span className="text-[32px] leading-none">🚀</span>
          <span className="font-['Inter',sans-serif] font-semibold text-[20px] text-white tracking-[-0.8px]">
            Get Matched
          </span>
        </div>
      </button>

      {/* Bottom Sheet Overlay — portal wraps AnimatePresence so exit animations work */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/40 z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsOpen(false)}
              />

              {/* Sheet */}
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-[30px] px-6 pt-6 pb-10 shadow-[0px_-10px_40px_rgba(0,0,0,0.15)]"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                {/* Close button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="size-[32px] flex items-center justify-center text-[#71717a]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Heading */}
                <h3 className="font-['Inter',sans-serif] font-semibold text-[24px] text-[#09090b] tracking-[-1.2px] text-center mb-8 leading-[1.3]">
                  Tell us where you are in<br />your home journey.
                </h3>

                {/* CTA Options */}
                <div className="flex flex-col gap-4">
                  {sheetButtons.map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/get-matched?inquiry=${encodeURIComponent(btn.label)}`);
                      }}
                      className="bg-[#f6f6f6] border border-white rounded-[100px] p-[6px] shadow-[0px_10px_25px_rgba(0,0,0,0.08)]"
                    >
                      <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center px-5 py-4 gap-3">
                        <div className="size-[34px] -scale-y-100 rotate-180 shrink-0">
                          <img alt="" className="size-full object-cover" src={btn.icon} />
                        </div>
                        <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-[-0.8px]">
                          {btn.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}