import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import { Palette, Eye, Share2, Sparkles, FolderOpen, ImagePlus } from "lucide-react"
import { Container } from "@/app/components/shared/Container"
import { SectionLabel } from "@/app/components/shared/SectionLabel"
import { PillButton } from "@/app/components/shared/PillButton"
import { AuthModal } from "@/app/components/shared/AuthModal"
import { useAuth } from "@/app/hooks/useAuth"
import { SiteNav } from "@/app/components/SiteNav"
import { SiteFooter } from "@/app/components/shared/SiteFooter"
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png"

/* -- FAQ data -- */
const faqItems = [
  {
    q: "What is a renovation mood board?",
    a: "A mood board is a visual collage of images, colours, textures, and notes that captures the look and feel you want for your home. It acts as a shared reference point between you and your designer so everyone is working toward the same vision from day one.",
  },
  {
    q: "Where can I get images for my board?",
    a: "You can upload photos directly from your device or paste any image URL — from Pinterest, Instagram, design blogs, or anywhere you find inspiration. The tool handles the rest, including automatic colour extraction.",
  },
  {
    q: "How does automatic colour extraction work?",
    a: "When you add an image, our algorithm samples the pixels and groups them using a median-cut technique to surface the five most dominant colours. These are displayed on each pin and rolled up into a combined palette across your entire board.",
  },
  {
    q: "Can I rearrange or annotate my pins?",
    a: "Yes. Drag any pin to reorder it, double-click a note card to edit its text, and add labels beneath images. The board auto-saves to your browser so nothing is lost between sessions.",
  },
  {
    q: "Do I need an account to use this?",
    a: "No. The mood board runs entirely in your browser with no sign-up required. Your board is saved locally and you can export it as a file at any time.",
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

export function MoodBoardLanding() {
  const [showAuth, setShowAuth] = useState(false)
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate("/mood-board/create")
    } else {
      setShowAuth(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0ede6]">
      <SiteNav logoImg={imgRectangle1} onLogoClick={() => navigate("/")} />
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => navigate("/mood-board/create")}
      />
      {/* HERO */}
      <section className="pt-[60px] md:pt-[80px] pb-0 overflow-hidden">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-[600px] mx-auto mb-12"
          >
            <SectionLabel className="mb-5 justify-center">
              <span className="inline-block w-8 h-px bg-[#d8d3c8] mr-3" />
              Mood Board
              <span className="inline-block w-8 h-px bg-[#d8d3c8] ml-3" />
            </SectionLabel>
            <h1 className="font-['EB_Garamond',Georgia,serif] font-normal text-[36px] md:text-[52px] text-[#0f0f0d] leading-[1.12] mb-5">
              Collect every idea.{" "}
              <em className="text-[#6b6860]">See what they have in common.</em>
            </h1>
            <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.7] max-w-[460px] mx-auto mb-8">
              Upload your scattered inspiration, and the tool will pull out a
              shared colour palette automatically — turning a messy camera roll
              into a design brief your contractor can work from.
            </p>
            <div className="flex justify-center">
              <PillButton size="lg" onClick={handleCTA}>Create your board</PillButton>
            </div>
          </motion.div>
        </Container>

        {/* Full-bleed image banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="rounded-t-[12px] overflow-hidden border border-b-0 border-[#d8d3c8]">
              <div className="bg-[#fafaf8] p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-3 rounded-full bg-[#d8d3c8]" />
                  <div className="h-3 w-3 rounded-full bg-[#d8d3c8]" />
                  <div className="h-3 w-3 rounded-full bg-[#d8d3c8]" />
                  <div className="flex-1" />
                  <div className="h-6 w-20 rounded-[100px] bg-[#e8e4db]" />
                  <div className="h-6 w-16 rounded-[100px] bg-[#e8e4db]" />
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-[6px]">
                  {[
                    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&q=80",
                    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300&q=80",
                    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=300&q=80",
                    "https://images.unsplash.com/photo-1617104678098-de229db51175?w=300&q=80",
                    "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=300&q=80",
                  ].map((url, i) => (
                    <div key={i} className="aspect-[4/3] rounded-[8px] overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="font-['DM_Sans',sans-serif] font-semibold text-[10px] text-[#9a9790] uppercase tracking-[0.12em]">Palette</span>
                  {["#8B7355", "#C4A882", "#E8DDD3", "#5C6B5A", "#D4956B"].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-[#d8d3c8]" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* HORIZONTAL FEATURE STRIP */}
      <section className="py-[60px] md:py-[80px] bg-[#0f0f0d]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-[#2a2a28]">
            {[
              { icon: Eye, stat: "Clearer", label: "Communication with your ID" },
              { icon: Palette, stat: "Fewer", label: "Revision rounds needed" },
              { icon: Share2, stat: "Faster", label: "Quotes from contractors" },
              { icon: ImagePlus, stat: "Free", label: "To use, always" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="text-center md:px-6"
              >
                <item.icon className="w-5 h-5 text-[#6b6860] mx-auto mb-3" />
                <span className="font-['EB_Garamond',Georgia,serif] text-[32px] md:text-[40px] text-[#fafaf8] leading-none block mb-1">
                  {item.stat}
                </span>
                <span className="font-['DM_Sans',sans-serif] text-[11px] text-[#6b6860] uppercase tracking-[0.12em]">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* VERTICAL TIMELINE */}
      <section className="py-[80px] md:py-[100px]">
        <Container>
          <div className="text-center mb-14">
            <SectionLabel className="mb-4 justify-center">
              <span className="inline-block w-8 h-px bg-[#d8d3c8] mr-3" />
              How It Works
              <span className="inline-block w-8 h-px bg-[#d8d3c8] ml-3" />
            </SectionLabel>
            <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[40px] text-[#0f0f0d] leading-[1.2]">
              Inspiration to brief in <em className="text-[#6b6860]">minutes</em>
            </h2>
          </div>

          <div className="max-w-[520px] mx-auto">
            {[
              {
                icon: FolderOpen,
                title: "Drop in your inspiration",
                desc: "Upload from your camera roll or paste URLs from Pinterest, Instagram, or any design site. Drag to rearrange anytime.",
              },
              {
                icon: Sparkles,
                title: "Watch the palette emerge",
                desc: "Each image is scanned for its dominant colours. They roll up into a combined palette at the top of your board — updated live as you add more.",
              },
              {
                icon: Share2,
                title: "Get matched with designers",
                desc: "Submit your board to the Network team. We'll review your inspiration and match you with vetted interior designers whose style fits your vision.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="relative pl-12 pb-12 last:pb-0"
              >
                {i < 2 && (
                  <div className="absolute left-[15px] top-10 bottom-0 w-px bg-[#d8d3c8]" />
                )}
                <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#e8e4db] border border-[#d8d3c8] flex items-center justify-center">
                  <step.icon className="w-3.5 h-3.5 text-[#6b6860]" />
                </div>
                <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[22px] text-[#0f0f0d] leading-[1.3] mb-1">
                  {step.title}
                </h3>
                <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.7]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* SPLIT FEATURE */}
      <section className="py-0">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-[#fafaf8] rounded-[12px] border border-[#d8d3c8] overflow-hidden">
            <div className="h-[300px] md:h-[440px]">
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80"
                alt="Curated interior"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <SectionLabel className="mb-4">
                <span className="inline-block w-8 h-px bg-[#d8d3c8] mr-3" />
                Colour Intelligence
              </SectionLabel>
              <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[26px] md:text-[34px] text-[#0f0f0d] leading-[1.2] mb-4">
                Your palette writes itself as you pin.
              </h2>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.7] mb-4">
                Every image you add is sampled for its five strongest colours.
                By the time your board is full you've got a complete colour
                story — no Pantone books, no guesswork. Hand it to any
                designer and they'll know exactly where to start.
              </p>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.7] mb-6">
                Works with uploads from your device and pasted URLs. If the
                image loads, we can extract its palette.
              </p>
              <button onClick={handleCTA} className="border border-[#0f0f0d] rounded-[100px] px-6 py-2.5 font-['DM_Sans',sans-serif] font-medium text-[13px] text-[#0f0f0d] hover:bg-[#0f0f0d] hover:text-[#fafaf8] transition-all duration-150 cursor-pointer">
                Try it now
              </button>
            </div>
          </div>
        </div>
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

      <SiteFooter
        ctaLabel="Get started"
        ctaHeadline="A clear picture beats a thousand words."
        ctaDescription="Pull your scattered inspiration into one board, let the tool build your palette, and hand your designer something they can actually work from."
        ctaButtonLabel="Create Your Board"
        ctaHref="/mood-board/create"
      />
    </div>
  )
}
