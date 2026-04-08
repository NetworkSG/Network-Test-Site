import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import { Compass, Lightbulb, Handshake } from "lucide-react"
import { Container } from "@/app/components/shared/Container"
import { SectionLabel } from "@/app/components/shared/SectionLabel"
import { PillButton } from "@/app/components/shared/PillButton"
import { SiteNav } from "@/app/components/SiteNav"
import { SiteFooter } from "@/app/components/shared/SiteFooter"
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png"

/* -- photo grid URLs -- */
const gridPhotos = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
  "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&q=80",
  "https://images.unsplash.com/photo-1617104678098-de229db51175?w=400&q=80",
  "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400&q=80",
]

/* -- value props -- */
const valueProps = [
  {
    icon: Compass,
    title: "Define your vision",
    description: "Turn scattered Pinterest saves into a clear design direction you can actually brief to a contractor.",
  },
  {
    icon: Lightbulb,
    title: "Receive a style profile",
    description: "Get a personalized Design DNA breakdown — your colors, materials, layout preferences, and style traits in one place.",
  },
  {
    icon: Handshake,
    title: "Connect with the right team",
    description: "Your profile is used to recommend renovation firms whose portfolio aligns with your taste.",
  },
]

/* -- FAQ data -- */
const faqItems = [
  {
    q: "How does the style quiz work?",
    a: "You'll answer 6 visual questions — picking room photos, color palettes, furniture styles, layouts, materials, and lighting moods that appeal to you. Our algorithm scores your choices to produce a multi-dimensional style profile rather than a single generic label.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. The quiz is completely free and doesn't require sign-up. At the end we ask for your name and email so we can send your results and match you with relevant designers — but you control what you share.",
  },
  {
    q: "What happens after I get my results?",
    a: "You'll receive a Design DNA profile showing your primary style, color preferences, layout type, and key traits. You can download a style guide, create a mood board, or request to be matched with vetted renovation professionals.",
  },
  {
    q: "How are designer matches decided?",
    a: "We compare your Design DNA profile against the portfolios, specializations, and past project styles of firms on our platform. Matches are ranked by alignment with your preferences, budget range, and project scope.",
  },
  {
    q: "Is my information shared with third parties?",
    a: "Your contact details are only shared with designers you explicitly choose to connect with. We never sell your data to third parties or send unsolicited outreach on behalf of firms you haven't approved.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[#d8d3c8]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] md:text-[20px] text-[#0f0f0d] leading-[1.4] pr-4">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#9a9790] flex-shrink-0 text-[20px] font-light leading-none"
        >
          +
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.7] pb-5 pr-8">
          {a}
        </p>
      </motion.div>
    </div>
  )
}

export function StyleQuizLanding() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#f0ede6]">
      <SiteNav logoImg={imgRectangle1} onLogoClick={() => navigate("/")} />
      {/* HERO */}
      <section className="py-[60px] md:py-[80px] overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SectionLabel className="mb-5">
                <span className="inline-block w-8 h-px bg-[#d8d3c8] mr-3" />
                Style Quiz
              </SectionLabel>
              <h1 className="font-['EB_Garamond',Georgia,serif] font-normal text-[36px] md:text-[48px] text-[#0f0f0d] leading-[1.15] mb-4">
                Find out what your{" "}
                <em className="text-[#6b6860]">home should feel like</em>
              </h1>
              <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.7] max-w-[420px] mb-8">
                Most homeowners start renovating without a clear style
                direction. Answer six visual questions and walk away with a
                Design DNA profile you can hand straight to your contractor.
              </p>
              <Link to="/style-quiz/start">
                <PillButton size="lg">Start the quiz</PillButton>
              </Link>
              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#9a9790] mt-4">
                <span className="font-semibold text-[#6b6860]">1,200+</span>{" "}
                homeowners have completed the quiz this month
              </p>
            </motion.div>

            {/* Right — Photo Grid */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hidden md:grid grid-cols-3 gap-[6px] max-w-[460px] ml-auto"
            >
              {gridPhotos.map((url, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[8px] overflow-hidden"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </Container>
      </section>

      {/* VALUE PROPS */}
      <section className="py-[60px] md:py-[80px] border-t border-[#d8d3c8]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 max-w-[960px] mx-auto text-center">
            {valueProps.map((vp, i) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <div className="w-14 h-14 rounded-full bg-[#e8e4db] flex items-center justify-center mx-auto mb-4">
                  <vp.icon className="w-6 h-6 text-[#6b6860]" />
                </div>
                <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] md:text-[22px] text-[#0f0f0d] leading-[1.3] mb-2">
                  {vp.title}
                </h3>
                <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860] leading-[1.6] max-w-[260px] mx-auto">
                  {vp.description}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURE SECTION */}
      <section className="py-[60px] md:py-[80px] bg-[#e8e4db]">
        <Container>
          <div className="max-w-[960px] mx-auto">
            <div className="bg-[#fafaf8] rounded-[12px] border border-[#d8d3c8] overflow-hidden grid grid-cols-1 md:grid-cols-2">
              {/* Left — Copy */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[26px] md:text-[32px] text-[#0f0f0d] leading-[1.2] mb-4">
                  Stop guessing.{" "}
                  <em className="text-[#6b6860]">Start designing with clarity.</em>
                </h2>
                <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.7] mb-6">
                  Whether you gravitate toward clean minimalism or layered
                  warmth, the quiz maps your instincts to a concrete style
                  profile. You'll get a downloadable guide with your color
                  palette, material preferences, and layout direction — ready
                  to share with any design professional.
                </p>
                <Link to="/style-quiz/start">
                  <button className="border border-[#0f0f0d] rounded-[100px] px-6 py-2.5 font-['DM_Sans',sans-serif] font-medium text-[13px] text-[#0f0f0d] hover:bg-[#0f0f0d] hover:text-[#fafaf8] transition-all duration-150 cursor-pointer">
                    Take the quiz
                  </button>
                </Link>
              </div>
              {/* Right — Image */}
              <div className="h-[280px] md:h-auto">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
                  alt="Interior design inspiration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-[80px] md:py-[100px]">
        <Container>
          <div className="max-w-[700px] mx-auto">
            <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] text-center mb-10">
              Common Questions
            </h2>
            <div>
              {faqItems.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-[60px] md:py-[80px] bg-[#e8e4db]">
        <Container>
          <div className="text-center max-w-[560px] mx-auto">
            <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] mb-3">
              Know your style before you spend a dollar.
            </h2>
            <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.7] mb-8">
              Two minutes now saves weeks of miscommunication later. Take the
              quiz and get a style profile you can share with any designer or
              contractor.
            </p>
            <div className="flex justify-center">
              <Link to="/style-quiz/start">
                <PillButton size="lg">Start the quiz</PillButton>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* SEO CONTENT */}
      <section className="py-[60px] md:py-[80px] border-t border-[#d8d3c8]">
        <Container>
          <div className="max-w-[760px] mx-auto space-y-8">
            <div>
              <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] text-[#0f0f0d] mb-2">
                Why a Style Profile Matters Before You Renovate
              </h3>
              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860] leading-[1.7]">
                One of the biggest sources of friction in any renovation is
                misaligned expectations between the homeowner and the design
                team. When you can articulate whether you lean toward warm
                minimalism, textured Japandi, or bold industrial — and back that
                up with specific color, material, and layout preferences — every
                conversation moves faster. The Network Style Quiz distills those
                instincts into a shareable document so nothing gets lost in
                translation.
              </p>
            </div>
            <div>
              <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] text-[#0f0f0d] mb-2">
                How Network Uses Your Design DNA
              </h3>
              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860] leading-[1.7]">
                Your Design DNA is more than a personality label. It captures
                six dimensions of taste — room aesthetic, color temperature,
                furniture silhouette, spatial layout, surface texture, and
                lighting mood — and ranks them against our database of vetted
                renovation firms. The result is a shortlist of teams whose
                completed projects genuinely reflect the style you're after,
                not just firms that happen to be available.
              </p>
            </div>
            <div>
              <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] text-[#0f0f0d] mb-2">
                From Quiz to Renovation — the Next Steps
              </h3>
              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860] leading-[1.7]">
                After completing the quiz you can download your style guide,
                build a mood board with our curation tool, or jump into an AI
                scoping conversation that turns your preferences into a
                structured project brief. When you're ready, request
                introductions to matched firms — each one pre-qualified with
                verified credentials and real homeowner reviews.
              </p>
            </div>
          </div>
        </Container>
      </section>
      <SiteFooter
        ctaLabel="Discover your style"
        ctaHeadline="Know your style before you spend a dollar."
        ctaDescription="Two minutes now saves weeks of miscommunication later. Take the quiz and get a style profile you can share with any designer."
        ctaButtonLabel="Start the Quiz"
        ctaHref="/style-quiz/start"
      />
    </div>
  )
}
