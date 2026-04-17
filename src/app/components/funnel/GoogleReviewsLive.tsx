import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { C, FadeIn, serif, sans } from "../homepage/v8/primitives";
import { useGoogleReviews } from "../useGoogleReviews";
import { FUNNEL_GOOGLE_REVIEWS } from "./content";

function Stars() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill={C.black}>
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 13.88l-4.94 2.82.94-5.49-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleLogo({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function GoogleReviewsLive() {
  const { uiReviews, loading } = useGoogleReviews("network");
  const reviews = uiReviews.filter((r) => r.rating === 5).slice(0, 6);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (reviews.length <= 1) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 6000);
  }, [reviews.length]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  // Keep index in bounds when reviews arrive/change
  useEffect(() => {
    if (current >= reviews.length && reviews.length > 0) setCurrent(0);
  }, [reviews.length, current]);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    resetTimer();
  };

  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (reviews.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setDirection(1);
        setCurrent((prev) => (prev + 1) % reviews.length);
      } else {
        setDirection(-1);
        setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);
      }
      resetTimer();
    }
  };

  // Hide section entirely when cache is empty (slug not yet seeded)
  if (!loading && reviews.length === 0) return null;

  const review = reviews[current];

  return (
    <section
      className="px-6 md:px-10 py-[80px] md:py-[100px]"
      style={{ background: C.cream }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-[680px] mx-auto text-center">
        {/* Tag */}
        <FadeIn className="mb-8 flex justify-center">
          <span
            className="inline-block px-5 py-2 text-[12px] font-medium"
            style={{
              fontFamily: sans,
              color: C.black,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: 100,
              letterSpacing: "0.02em",
            }}
          >
            {FUNNEL_GOOGLE_REVIEWS.eyebrow}
          </span>
        </FadeIn>

        {/* Heading */}
        <FadeIn delay={0.05} className="mb-14">
          <h2
            className="font-normal leading-[1.15]"
            style={{
              fontFamily: serif,
              color: C.black,
              fontSize: "clamp(32px, 4vw, 52px)",
              letterSpacing: "-0.01em",
            }}
          >
            {FUNNEL_GOOGLE_REVIEWS.headline}{" "}
            <em style={{ color: C.gray }}>{FUNNEL_GOOGLE_REVIEWS.headlineItalic}</em>
          </h2>
        </FadeIn>

        {/* Stars */}
        <FadeIn delay={0.08} className="mb-10">
          <Stars />
        </FadeIn>

        {/* Carousel */}
        <div className="relative min-h-[280px] md:min-h-[240px] flex items-start justify-center">
          {review && (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full"
              >
                <p
                  className="text-[19px] md:text-[22px] leading-[1.7] mb-10"
                  style={{ fontFamily: serif, color: C.black }}
                >
                  "{review.text.length > 320 ? review.text.slice(0, 317).trimEnd() + "…" : review.text}"
                </p>

                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-[56px] h-[56px] rounded-full flex items-center justify-center font-semibold text-[20px] shrink-0 ${review.bgColor} ${review.textColor}`}
                    style={{ fontFamily: sans }}
                  >
                    {review.initial}
                  </div>
                  <div>
                    <span
                      className="text-[16px] font-semibold leading-tight"
                      style={{ fontFamily: sans, color: C.black }}
                    >
                      {review.name}
                    </span>
                    <p
                      className="text-[14px] mt-1"
                      style={{ fontFamily: sans, color: C.gray }}
                    >
                      Homeowner
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <GoogleLogo size={16} />
                    <span
                      className="text-[12px] font-medium"
                      style={{ fontFamily: sans, color: C.grayLight }}
                    >
                      Verified
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Dots */}
        {reviews.length > 1 && (
          <div className="flex justify-center gap-2.5 mt-10">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="w-2 h-2 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  background: i === current ? C.black : C.creamBorder,
                  transform: i === current ? "scale(1.25)" : "scale(1)",
                }}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* View all link */}
        <FadeIn delay={0.2} className="mt-10">
          <a
            href={FUNNEL_GOOGLE_REVIEWS.viewAllHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] font-medium cursor-pointer hover:opacity-70"
            style={{ color: C.gray, fontFamily: sans, transition: "opacity 0.15s" }}
          >
            <GoogleLogo size={14} />
            {FUNNEL_GOOGLE_REVIEWS.viewAllLabel}
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
