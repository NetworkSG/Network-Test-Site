import { useState } from "react";
import { sans, FadeIn } from "../homepage/v8/primitives";
import { OnboardingShell, OnboardingCard, PrimaryButton } from "./OnboardingShell";
import { StudioInfoStep, validateStudio } from "./StudioInfoStep";
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
  airtableRecordId: "",
};

const emptyProject: ProjectSubmission = {
  title: "",
  location: "",
  cost: "",
  size: "",
  year: "",
  propertyType: "",
  propertySubType: "",
  style: "",
  worksIncluded: [],
  driveUrl: "",
};

export function FirmOnboardingPage() {
  const [studio, setStudio] = useState<StudioInfo>(initialStudio);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setSubmitError("");
    const errors = validateStudio(studio);
    if (Object.keys(errors).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      await submitOnboarding({ variant: "full", studio, project: emptyProject });
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
      <FadeIn delay={0.05}>
        <OnboardingCard>
          <StudioInfoStep value={studio} onChange={setStudio} submitAttempted={submitAttempted} />
        </OnboardingCard>
      </FadeIn>

      {submitError && (
        <p className="mt-4 text-[13px]" style={{ color: "#c14", fontFamily: sans }}>
          {submitError}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <PrimaryButton
          label={submitting ? "Submitting…" : "Submit"}
          onClick={handleSubmit}
          disabled={submitting}
        />
      </div>
    </OnboardingShell>
  );
}

export default FirmOnboardingPage;
