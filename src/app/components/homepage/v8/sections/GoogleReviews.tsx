import { useState, useEffect, useCallback, useRef } from "react";
import { C, FadeIn } from "../primitives";
import { AnimatePresence, motion } from "motion/react";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const serif = "'EB Garamond', Georgia, serif";

// Exported so other landing pages (e.g. the ad LP) can reuse the same
// verified review pool instead of duplicating quotes.
export const GOOGLE_REVIEWS = [
  {
    name: "LYDIA Poh",
    initial: "L",
    color: "#4285F4",
    rating: 5,
    text: "I have Reno Customer Service officer ~ HAKEEM, to thanks heartily! Appreciated your patience & professionalism on understanding my wants for my new nest then connected me to a more then satisfactory Build & Design company - Explore Living, at our 1st meet up.",
    link: "https://maps.app.goo.gl/KaND1AnU6v1NvFqG6",
  },
  {
    name: "Jonnie Josiah Soo",
    initial: "J",
    color: "#EA4335",
    rating: 5,
    text: "Jann has been amazing to work with. She took the time to really understand what I was looking for and went the extra mile to help match me with the right interior designers. Her helpful attitude and positive energy made the whole process smooth and enjoyable.",
    link: "https://maps.app.goo.gl/zFRbCWKb6wzPrUXZA",
  },
  {
    name: "Ephraim Ang",
    initial: "E",
    color: "#34A853",
    rating: 5,
    text: "Jann has been really helpful and responsive in helping me match with IDs that are willing to accommodate to my budget and theme. Really a great service! Saves me time looking for IDs who are willing to work with me on my tiny flat.",
    link: "https://maps.app.goo.gl/Y3QhqcDLt5DM9dNK7",
  },
  {
    name: "sean weng san",
    initial: "S",
    color: "#795548",
    rating: 5,
    text: "Good experience with Shawn. Giving good guidance and always follow up with client to make sure engagement with recommended ID was smooth.",
    link: "https://maps.app.goo.gl/gYmbwrDaYZawMVN97",
  },
  {
    name: "Leslie Nakachima",
    initial: "L",
    color: "#795548",
    rating: 5,
    text: "Just talked to April earlier. She have gave me alot of guidance about the right interior designer to work with. All of the IDs are case trust accredited.",
    link: "https://maps.app.goo.gl/7ezEEtFQCNtnXSmR6",
  },
  {
    name: "Peiyuan wang",
    initial: "P",
    color: "#795548",
    rating: 5,
    text: "I was talking to Daryl the other day, he mentioned great things about Sync Interior one of the designers who did up their nursery. & saw that Sync Interior was under Network!! Amazing job!!",
    link: "https://maps.app.goo.gl/TYvBaZ2VKXSTfgjh7",
  },
];

const reviews = GOOGLE_REVIEWS;

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

export function GoogleReviews() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 6000);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    resetTimer();
  };

  // Touch swipe support
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
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
            Testimonials
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
            Turns out, people like{"\n"}getting matched{" "}
            <em style={{ color: C.gray }}>right.</em>
          </h2>
        </FadeIn>

        {/* Stars */}
        <FadeIn delay={0.08} className="mb-10">
          <Stars />
        </FadeIn>

        {/* Carousel review */}
        <div className="relative min-h-[280px] md:min-h-[240px] flex items-start justify-center">
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
              {/* Quote */}
              <p
                className="text-[19px] md:text-[22px] leading-[1.7] mb-10"
                style={{ fontFamily: serif, color: C.black }}
              >
                "{review.text}"
              </p>

              {/* Reviewer */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-white font-semibold text-[20px] shrink-0"
                  style={{ background: review.color, fontFamily: sans }}
                >
                  {review.initial}
                </div>
                <div>
                  <a
                    href={review.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] font-semibold leading-tight no-underline hover:underline"
                    style={{ fontFamily: sans, color: C.black }}
                  >
                    {review.name}
                  </a>
                  <p
                    className="text-[14px] mt-1"
                    style={{ fontFamily: sans, color: C.gray }}
                  >
                    Homeowner
                  </p>
                </div>
                {/* Google Verified badge */}
                <div className="flex items-center gap-1.5 mt-1">
                  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[12px] font-medium" style={{ fontFamily: sans, color: C.grayLight }}>
                    Verified
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-10">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent border-0"
              aria-label={`Go to review ${i + 1}`}
            >
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full transition-all duration-300 block"
                style={{
                  background: i === current ? C.black : C.creamBorder,
                  transform: i === current ? "scale(1.25)" : "scale(1)",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
