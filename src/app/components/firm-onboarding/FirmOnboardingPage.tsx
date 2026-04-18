import { useState } from "react";
import { C, sans, FadeIn } from "../homepage/v8/primitives";
import { OnboardingShell, OnboardingCard, StepPills, PrimaryButton, SecondaryButton } from "./OnboardingShell";
import { StudioInfoStep, validateStudio } from "./StudioInfoStep";
import { ProjectStep, validateProject } from "./ProjectStep";
import { SuccessScreen } from "./SuccessScreen";
import { submitOnboarding, StudioInfo, ProjectSubmission } from "./onboardingApi";

const initialStudio: StudioInfo = {
  logoImage: "",
  firmName: "",
  tagline: "",
  bio: "",
  googleMapsUrl: "",
  contactEmail: "",
  acraUen: "",
  yearsExperience: "",
  licenses: [],
  licensesOther: "",
  officeAddress: "",
  serviceArea: [],
  serviceProvided: [],
  projectTypes: [],
  landedEligibility: "",
  designStyles: [],
  specialisation: [],
  budgetRange: [],
  financing: "",
  portfolioUrl: "",
};

const initialProject: ProjectSubmission = {
  title: "",
  location: "",
  cost: "",
  size: "",
  year: String(new Date().getFullYear()),
  propertyType: "",
  propertySubType: "",
  style: "",
  worksIncluded: [],
  driveUrl: "",
};

export function FirmOnboardingPage() {
  const [step, setStep] = useState<0 | 1>(0);
  const [studio, setStudio] = useState<StudioInfo>(initialStudio);
  const [project, setProject] = useState<ProjectSubmission>(initialProject);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const handleContinue = () => {
    setSubmitAttempted(true);
    const errors = validateStudio(studio);
    if (Object.keys(errors).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitAttempted(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setSubmitError("");
    const errors = validateProject(project);
    if (Object.keys(errors).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      await submitOnboarding({ variant: "full", studio, project });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err?.message || "Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <OnboardingShell>
        <SuccessScreen firmName={studio.firmName} />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell eyebrow="Firm Onboarding">
      <FadeIn>
        <StepPills steps={["Studio Info", "First Project"]} activeIndex={step} />
      </FadeIn>
      <FadeIn delay={0.05}>
        <OnboardingCard>
          {step === 0 ? (
            <StudioInfoStep value={studio} onChange={setStudio} submitAttempted={submitAttempted} />
          ) : (
            <ProjectStep value={project} onChange={setProject} submitAttempted={submitAttempted} />
          )}
        </OnboardingCard>
      </FadeIn>

      {submitError && (
        <p className="mt-4 text-[13px]" style={{ color: "#c14", fontFamily: sans }}>
          {submitError}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          {step === 1 && (
            <SecondaryButton label="← Back" onClick={() => setStep(0)} disabled={submitting} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px]"
            style={{ color: C.grayLight, fontFamily: sans, letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            Step {step + 1} of 2
          </span>
          {step === 0 ? (
            <PrimaryButton label="Continue" onClick={handleContinue} />
          ) : (
            <PrimaryButton
              label={submitting ? "Submitting…" : "Submit"}
              onClick={handleSubmit}
              disabled={submitting}
            />
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}

export default FirmOnboardingPage;
