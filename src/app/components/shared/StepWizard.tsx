import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { Progress } from "@/app/components/shared/Progress"
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png"

interface StepWizardProps {
  totalSteps: number
  currentStep: number
  onNext: () => void
  onBack: () => void
  canProceed: boolean
  children: React.ReactNode
  showResults?: boolean
}

export function StepWizard({ totalSteps, currentStep, onNext, onBack, canProceed, children, showResults }: StepWizardProps) {
  const progressValue = showResults ? 100 : ((currentStep) / totalSteps) * 100

  return (
    <div className="min-h-screen flex flex-col bg-[#f0ede6]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 h-[56px] md:h-[64px] border-b border-[#d8d3c8]">
        <Link to="/" className="block shrink-0" style={{
          width: 110, height: 23, background: "#0f0f0d",
          maskImage: `url('${imgRectangle1}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
          WebkitMaskImage: `url('${imgRectangle1}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
        }} />
        {!showResults && (
          <span className="font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em]">
            Step {currentStep + 1} of {totalSteps}
          </span>
        )}
      </header>

      {/* Progress */}
      <Progress value={progressValue} className="rounded-none" />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-4 md:py-6 overflow-hidden">
        <div className="w-full max-w-[900px] max-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      {!showResults && (
        <div className="border-t border-[#d8d3c8] px-6 md:px-10 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] hover:opacity-60 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex items-center gap-2 bg-[#0f0f0d] text-[#fafaf8] rounded-[100px] px-6 py-2.5 font-['DM_Sans',sans-serif] font-medium text-[13px] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            {currentStep === totalSteps - 1 ? 'See Results' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
