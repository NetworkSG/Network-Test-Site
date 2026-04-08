import { useState } from "react"
import { StepWizard } from "@/app/components/shared/StepWizard"
import { StepRoomStyle } from "./steps/StepRoomStyle"
import { StepColorPalette } from "./steps/StepColorPalette"
import { StepFurnitureStyle } from "./steps/StepFurnitureStyle"
import { StepRoomLayout } from "./steps/StepRoomLayout"
import { StepMaterialTexture } from "./steps/StepMaterialTexture"
import { StepLightingMood } from "./steps/StepLightingMood"
import { StepLeadCapture } from "./steps/StepLeadCapture"
import { StyleQuizResults } from "./StyleQuizResults"
import { AuthModal } from "@/app/components/shared/AuthModal"
import { calculateDesignDNA } from "@/app/utils/quiz-data"
import { useQuizSession } from "@/app/hooks/useQuizSession"
import { useAuth } from "@/app/hooks/useAuth"
import type { QuizSelections } from "@/app/utils/quiz-types"

const TOTAL_STEPS = 7

const initialSelections: QuizSelections = {
  roomStyle: [],
  colorPalette: null,
  furnitureStyle: null,
  roomLayout: null,
  materialTexture: [],
  lightingMood: null,
}

const initialLead = { name: "", phone: "", email: "" }

export function StyleQuizPage() {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<QuizSelections>(initialSelections)
  const [lead, setLead] = useState(initialLead)
  const [showResults, setShowResults] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [emailLimitReached, setEmailLimitReached] = useState(false)
  const [saveError, setSaveError] = useState('')

  const { saveSession, linkSessionsToUser, loading: saving } = useQuizSession()
  const { user, isLoggedIn } = useAuth()

  const canProceed = (() => {
    if (saving) return false
    switch (step) {
      case 0: return selections.roomStyle.length > 0
      case 1: return selections.colorPalette !== null
      case 2: return selections.furnitureStyle !== null
      case 3: return selections.roomLayout !== null
      case 4: return selections.materialTexture.length > 0
      case 5: return selections.lightingMood !== null
      case 6: {
        if (emailLimitReached) return false
        const emailValid = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(lead.email)
        return lead.name.trim().length > 0 && emailValid
      }
      default: return false
    }
  })()

  const handleNext = async () => {
    if (step === TOTAL_STEPS - 1) {
      // Lead capture step -> save to Supabase
      const dna = calculateDesignDNA(selections)
      setSaveError('')

      // If logged in, skip the email limit check
      if (isLoggedIn) {
        const result = await saveSession({
          email: user?.email || lead.email,
          name: user?.name || lead.name,
          phone: user?.contactNumber || lead.phone,
          selections,
          designDna: dna,
        })
        if (result.success) {
          setShowResults(true)
        } else {
          setSaveError('Failed to save your results. Please try again.')
        }
        return
      }

      // Anonymous user -> check email limit
      const result = await saveSession({
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        selections,
        designDna: dna,
      })

      if (result.requiresAuth) {
        setEmailLimitReached(true)
        setShowAuth(true)
        return
      }

      if (result.success) {
        setShowResults(true)
      } else {
        setSaveError('Failed to save your results. Please try again.')
      }
    } else {
      setStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (showResults) {
      setShowResults(false)
    } else {
      setStep(s => Math.max(0, s - 1))
    }
  }

  const handleRestart = () => {
    setStep(0)
    setSelections(initialSelections)
    setLead(initialLead)
    setShowResults(false)
    setEmailLimitReached(false)
    setSaveError('')
  }

  const handleLeadChange = (field: string, value: string) => {
    setLead(l => ({ ...l, [field]: value }))
    // Reset limit flag when email changes
    if (field === 'email') {
      setEmailLimitReached(false)
    }
  }

  const handleAuthSuccess = async () => {
    setShowAuth(false)
    setEmailLimitReached(false)

    // Link previous anonymous sessions to this user
    if (user) {
      await linkSessionsToUser(user.email, lead.email || user.email)
    }

    // Now save as authenticated user (no limit)
    const dna = calculateDesignDNA(selections)
    const result = await saveSession({
      email: user?.email || lead.email,
      name: user?.name || lead.name,
      phone: user?.contactNumber || lead.phone,
      selections,
      designDna: dna,
    })

    if (result.success) {
      setShowResults(true)
    }
  }

  if (showResults) {
    const dna = calculateDesignDNA(selections)
    return (
      <StepWizard
        totalSteps={TOTAL_STEPS}
        currentStep={step}
        onNext={() => {}}
        onBack={handleBack}
        canProceed={false}
        showResults
      >
        <StyleQuizResults dna={dna} leadName={lead.name || user?.name} onRestart={handleRestart} />
      </StepWizard>
    )
  }

  return (
    <>
      <StepWizard
        totalSteps={TOTAL_STEPS}
        currentStep={step}
        onNext={handleNext}
        onBack={handleBack}
        canProceed={canProceed}
      >
        {step === 0 && (
          <StepRoomStyle
            selected={selections.roomStyle}
            onSelect={(ids) => setSelections(s => ({ ...s, roomStyle: ids }))}
          />
        )}
        {step === 1 && (
          <StepColorPalette
            selected={selections.colorPalette}
            onSelect={(id) => setSelections(s => ({ ...s, colorPalette: id }))}
          />
        )}
        {step === 2 && (
          <StepFurnitureStyle
            selected={selections.furnitureStyle}
            onSelect={(id) => setSelections(s => ({ ...s, furnitureStyle: id }))}
          />
        )}
        {step === 3 && (
          <StepRoomLayout
            selected={selections.roomLayout}
            onSelect={(id) => setSelections(s => ({ ...s, roomLayout: id }))}
          />
        )}
        {step === 4 && (
          <StepMaterialTexture
            selected={selections.materialTexture}
            onSelect={(ids) => setSelections(s => ({ ...s, materialTexture: ids }))}
          />
        )}
        {step === 5 && (
          <StepLightingMood
            selected={selections.lightingMood}
            onSelect={(id) => setSelections(s => ({ ...s, lightingMood: id }))}
          />
        )}
        {step === 6 && (
          <>
            <StepLeadCapture
              data={lead}
              onChange={handleLeadChange}
              emailLimitReached={emailLimitReached}
            />
            {saveError && (
              <p className="mt-4 font-['DM_Sans',sans-serif] text-[13px] text-red-500">{saveError}</p>
            )}
          </>
        )}
      </StepWizard>

      {/* Auth modal — shown when email limit reached */}
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
