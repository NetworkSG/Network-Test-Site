import { C, FadeIn, TagLabel } from "../primitives";
import { Star } from "lucide-react";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const serif = "'EB Garamond', Georgia, serif";

const GOOGLE_LINK = "https://maps.app.goo.gl/KaND1AnU6v1NvFqG6";

const reviews = [
  {
    name: "LYDIA Poh",
    initial: "L",
    color: "#4285F4",
    rating: 5,
    time: "a month ago",
    text: "I have Reno Customer Service officer ~ HAKEEM, to thanks heartily! Appreciated your patience & professionalism on understanding my wants for my new nest then connected me to a more then satisfactory Build & Design company - Explore Living, at our 1st meet up.\n\nYour passion & sincerity on your customer service attitude deeply touches me. Thank you Hakeem & may you continue to help all the new home owners out there to give them a good match just like u had given me.",
    link: "https://maps.app.goo.gl/KaND1AnU6v1NvFqG6",
  },
  {
    name: "Jonnie Josiah Soo",
    initial: "J",
    color: "#EA4335",
    rating: 5,
    time: "a month ago",
    text: "Jann has been amazing to work with. She took the time to really understand what I was looking for and went the extra mile to help match me with the right interior designers. Her helpful attitude and positive energy made the whole process smooth and enjoyable.",
    link: "https://maps.app.goo.gl/zFRbCWKb6wzPrUXZA",
  },
  {
    name: "Ephraim Ang",
    initial: "E",
    color: "#34A853",
    rating: 5,
    time: "6 months ago",
    text: "Jann has been really helpful and responsive in helping me match with IDs that are willing to accommodate to my budget and theme.\nReally a great service! Saves me time looking for IDs who are willing to work with me on my tiny flat.",
    link: "https://maps.app.goo.gl/Y3QhqcDLt5DM9dNK7",
  },
  {
    name: "sean weng san",
    initial: "S",
    color: "#795548",
    rating: 5,
    time: "2 months ago",
    text: "Good experience with Shawn. Giving good guidance and always follow up with client to make sure engagement with recommended ID was smooth.",
    link: "https://maps.app.goo.gl/gYmbwrDaYZawMVN97",
  },
  {
    name: "Leslie Nakachima",
    initial: "L",
    color: "#795548",
    rating: 5,
    time: "5 months ago",
    text: "Just talked to April earlier. She have gave me alot of guidance about the right interior designer to work with. All of the IDs are case trust accredited.",
    link: "https://maps.app.goo.gl/7ezEEtFQCNtnXSmR6",
  },
  {
    name: "Peiyuan wang",
    initial: "P",
    color: "#795548",
    rating: 5,
    time: "6 months ago",
    text: "I was talking to Daryl the other day, he mentioned great things about Sync Interior one of the designers who did up their nursery. & saw that Sync Interior was under Network!! Amazing job!!",
    link: "https://maps.app.goo.gl/TYvBaZ2VKXSTfgjh7",
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} fill="#FBBC05" stroke="#FBBC05" />
      ))}
    </div>
  );
}

export function GoogleReviews() {
  return (
    <section className="px-6 md:px-10 py-[60px] md:py-[80px]" style={{ background: C.cream }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Section heading */}
        <FadeIn className="text-center mb-6">
          <TagLabel>Verified reviews</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-4">
          <h2 className="font-normal leading-[1.15] max-w-[700px] mx-auto" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            Don't Take Our Word for It. <span style={{ color: C.gray }}>Read the Reviews.</span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.08} className="text-center mb-12">
          <p className="text-[15px] font-normal leading-[1.75] max-w-[560px] mx-auto" style={{ color: C.gray, fontFamily: sans }}>
            Real reviews from real homeowners on Google. No edits, no filters — just honest feedback from people we've matched.
          </p>
        </FadeIn>

        {/* Google badge + CTA */}
        <FadeIn delay={0.1} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-[32px] h-[32px] shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-semibold" style={{ color: C.black, fontFamily: sans }}>4.8</span>
                <StarRow count={5} />
              </div>
              <p className="text-[13px]" style={{ color: C.gray, fontFamily: sans }}>
                Google Reviews
              </p>
            </div>
          </div>
          <a
            href={GOOGLE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium px-5 py-2.5 hover:opacity-80 transition-opacity cursor-pointer no-underline"
            style={{
              color: C.black,
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: 100,
              fontFamily: sans,
            }}
          >
            See all reviews on Google
          </a>
        </FadeIn>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <FadeIn key={review.name} delay={i * 0.06}>
              <a
                href={review.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full no-underline group"
              >
                <div
                  className="h-full p-6 flex flex-col transition-shadow duration-300 group-hover:shadow-md"
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${C.creamBorder}`,
                    background: C.white,
                  }}
                >
                  {/* Reviewer info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[16px] font-semibold text-white shrink-0"
                      style={{ background: review.color }}
                    >
                      {review.initial}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold leading-tight" style={{ color: C.black, fontFamily: sans }}>
                        {review.name}
                      </p>
                    </div>
                  </div>

                  {/* Stars + time */}
                  <div className="flex items-center gap-2 mb-3">
                    <StarRow count={review.rating} />
                    <span className="text-[12px]" style={{ color: C.grayLight, fontFamily: sans }}>
                      {review.time}
                    </span>
                  </div>

                  {/* Review text */}
                  <p
                    className="text-[13px] leading-[1.7] flex-1"
                    style={{
                      color: C.gray,
                      fontFamily: sans,
                      display: "-webkit-box",
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: "vertical" as any,
                      overflow: "hidden",
                    }}
                  >
                    {review.text}
                  </p>

                  {/* Google attribution */}
                  <div className="flex items-center gap-1.5 mt-4 pt-4" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
                    <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>
                      Posted on Google
                    </span>
                  </div>
                </div>
              </a>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
