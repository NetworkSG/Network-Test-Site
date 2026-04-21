import { motion } from "motion/react"
import { Link } from "react-router"
import { CheckCircle } from "lucide-react"
import type { DesignDNA } from "@/app/utils/quiz-types"

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const serif = "'EB Garamond', Georgia, serif"

const recommendedTools = [
  {
    title: "3D Preview Tool",
    description: "Upload a photo of your space and see it transformed with AI in minutes. Test different styles before committing to any designer.",
    cta: "Create My Render",
    href: "/render-tool",
    image: "/inter2.webp",
  },
  {
    title: "Renovation Cost Guide",
    description: "Get an instant breakdown of what your budget can realistically achieve based on your home type, scope, and finishes.",
    cta: "Calculate My Budget",
    href: "/cost-guide",
    image: "/new interor 2.webp",
  },
]

function ArrowIcon() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 9">
      <path d="M0 4.36h16.18l-3.54-3.54L13.36 0 18 4.36 13.36 8.72l-.72-.82 3.54-3.54H0z" fill="black" />
    </svg>
  )
}

interface Props {
  dna: DesignDNA
  leadName?: string
  onRestart: () => void
}

export function StyleQuizResults({ dna, leadName, onRestart }: Props) {
  const firstName = leadName?.split(" ")[0] || "there"

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 md:py-16">
      {/* Thank You Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12 md:mb-16"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-[#e8e4db] flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-8 h-8 text-[#4a8e6e]" />
        </motion.div>

        <h1
          className="font-normal text-[32px] md:text-[44px] text-[#0f0f0d] leading-[1.15] mb-4"
          style={{ fontFamily: serif }}
        >
          Thank you, {firstName}.
        </h1>
        <p
          className="text-[15px] md:text-[16px] text-[#6b6860] leading-[1.7] max-w-[480px] mx-auto mb-3"
          style={{ fontFamily: sans }}
        >
          We've received your style preferences. Our team will review your Design DNA profile and reach out to you shortly with personalized recommendations.
        </p>
        <p
          className="text-[13px] text-[#9a9790] leading-[1.6] max-w-[400px] mx-auto"
          style={{ fontFamily: sans }}
        >
          Expect to hear from us within 1-2 business days via email or WhatsApp.
        </p>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="border-t border-[#d8d3c8] mb-12 md:mb-14"
      />

      {/* Recommended Tools Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="text-center mb-8"
      >
        <span
          className="font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em] block mb-3"
          style={{ fontFamily: sans }}
        >
          While you wait
        </span>
        <h2
          className="font-normal text-[26px] md:text-[34px] text-[#0f0f0d] leading-[1.2]"
          style={{ fontFamily: serif }}
        >
          Explore our <span className="text-[#6b6860]">free tools</span>
        </h2>
      </motion.div>

      {/* Tool Cards — Homepage FreeTools style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {recommendedTools.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
          >
            <div className="relative group cursor-pointer isolate" style={{ minHeight: 420 }}>
              {/* Ambient glow on hover */}
              <div className="absolute -inset-[30px] z-0 opacity-0 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none hidden md:block">
                <img src={tool.image} alt="" className="size-full object-cover blur-[50px] scale-110 saturate-150 brightness-110" loading="lazy" />
              </div>

              <div className="relative z-10 size-full bg-[#09090b] overflow-hidden" style={{ borderRadius: 16 }}>
                {/* Background image */}
                <div className="absolute inset-0">
                  <img
                    alt=""
                    className="size-full object-cover scale-125 opacity-65 transition-transform duration-700 group-hover:scale-[1.35]"
                    src={tool.image}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-opacity duration-500" />
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative p-6 md:p-8 flex flex-col h-full justify-between" style={{ minHeight: 420 }}>
                  <div>
                    <h3
                      className="text-[22px] md:text-[26px] font-semibold text-white tracking-[-0.5px] max-w-[300px] mb-3"
                      style={{ fontFamily: serif }}
                    >
                      {tool.title}
                    </h3>
                    <p className="text-[13px] md:text-[14px] text-white/90 leading-relaxed mb-4 max-w-[340px]" style={{ fontFamily: sans }}>
                      {tool.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col md:flex-row items-center md:justify-between gap-3 mt-5">
                    <Link
                      to={tool.href}
                      className="h-[48px] px-7 text-[13px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 no-underline w-full md:w-auto"
                      style={{ background: "#fafaf8", color: "#0f0f0d", borderRadius: 12, fontFamily: sans, transition: "all 0.15s" }}
                    >
                      {tool.cta}
                      <ArrowIcon />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Retake Quiz link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={onRestart}
          className="font-['DM_Sans',sans-serif] text-[13px] text-[#9a9790] hover:text-[#6b6860] transition-colors duration-150 cursor-pointer"
        >
          Retake the quiz
        </button>
      </motion.div>
    </div>
  )
}
