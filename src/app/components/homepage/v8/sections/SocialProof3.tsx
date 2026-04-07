import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { C, FadeIn, TagLabel } from "../primitives";
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const selectedImages = [
  { src: "/social-proof-selected/img-000.jpg", caption: "Homeowner impressed by designer's professionalism" },
  { src: "/social-proof-selected/img-009.jpg", caption: "Homeowner happy with designer match quality" },
  { src: "/social-proof-selected/img-010.jpg", caption: "Positive feedback on renovation experience" },
  { src: "/social-proof-selected/img-018.jpg", caption: "Great experience with matched designer" },
  { src: "/social-proof-selected/img-029.jpg", caption: "Designer follow-up and project update" },
  { src: "/social-proof-selected/img-033.jpg", caption: "Successful consultation with matched firm" },
  { src: "/social-proof-selected/img-056.jpg", caption: "Homeowner recommends Network to friends" },
  { src: "/social-proof-selected/img-082.jpg", caption: "Smooth renovation journey from start to finish" },
  { src: "/social-proof-selected/img-087.jpg", caption: "Contractor confirms winning project through Network" },
];

function Lightbox({ index, onClose, onPrev, onNext }: { index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const img = selectedImages[index];

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") onPrev();
    if (e.key === "ArrowRight") onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey); };
  }, [handleKey]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors z-10">
        <X size={20} className="text-white" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-2 md:left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors z-10">
        <ChevronLeft size={22} className="text-white" />
      </button>
      <div className="max-w-[95vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img src={img.src} alt={img.caption} className="max-w-full max-h-[82vh] object-contain rounded-lg" />
        <div className="mt-3 text-center" style={{ fontFamily: sans }}>
          <span className="text-white/40 text-[13px]">{index + 1} / {selectedImages.length}</span>
          <span className="mx-2 text-white/20">|</span>
          <span className="text-white/60 text-[13px]">{img.caption}</span>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-2 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors z-10">
        <ChevronRight size={22} className="text-white" />
      </button>
    </div>,
    document.body
  );
}

export function SocialProof3() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const total = selectedImages.length;
  const initialCount = 4;
  const visibleImages = expanded ? selectedImages : selectedImages.slice(0, initialCount);
  const hasMore = selectedImages.length > initialCount;

  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]" style={{ background: C.creamDark }}>
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>Real feedback</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-4">
          <h2 className="font-normal leading-[1.15] max-w-[700px] mx-auto" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            What Homeowners Are Saying <span style={{ color: C.gray }}>About Network</span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.08} className="text-center mb-16">
          <p className="text-[15px] font-normal leading-[1.75] max-w-[560px] mx-auto" style={{ color: C.gray, fontFamily: sans }}>
            Real conversations between our concierge team and homeowners we've matched. No scripts, no edits, just genuine feedback from people who went through the process.
          </p>
        </FadeIn>

        <div className="flex flex-wrap justify-center gap-3">
          {visibleImages.map((item, i) => (
            <FadeIn key={item.src} delay={i * 0.03} className="w-[calc(50%-6px)] sm:w-[calc(50%-6px)] lg:w-[calc(25%-9px)]">
              <div
                className="overflow-hidden cursor-pointer group"
                style={{ borderRadius: "8px", border: `1px solid ${C.creamBorder}`, background: C.white }}
                onClick={() => setLightboxIndex(i)}
              >
                <div className="overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.caption}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[12px] leading-[1.5]" style={{ color: C.gray, fontFamily: sans }}>
                    {item.caption}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {hasMore && (
          <>
            <FadeIn delay={0.15}>
              <div className="flex flex-col items-center gap-3 mt-4">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 px-6 py-3 text-[14px] font-medium cursor-pointer hover:opacity-70 transition-all duration-200"
                  style={{
                    color: C.black,
                    background: C.white,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: 100,
                    fontFamily: sans,
                  }}
                >
                  {expanded ? (
                    <>Show less <ChevronUp size={16} /></>
                  ) : (
                    <>View More <ChevronDown size={16} /></>
                  )}
                </button>
              </div>
            </FadeIn>
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + total) % total)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % total)}
        />
      )}
    </section>
  );
}
