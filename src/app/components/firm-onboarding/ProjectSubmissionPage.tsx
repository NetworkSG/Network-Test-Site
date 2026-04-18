import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { C, sans, FadeIn } from "../homepage/v8/primitives";
import { OnboardingShell, OnboardingCard, PrimaryButton } from "./OnboardingShell";
import { ProjectStep, validateProject } from "./ProjectStep";
import { SuccessScreen } from "./SuccessScreen";
import { submitOnboarding, ProjectSubmission, checkProjectEmail } from "./onboardingApi";

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

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProjectSubmissionPage() {
  const [firmEmail, setFirmEmail] = useState("");
  const [project, setProject] = useState<ProjectSubmission>(initialProject);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "checking" | "matched" | "mismatch">("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [matchedFirm, setMatchedFirm] = useState("");

  useEffect(() => {
    const raw = firmEmail.trim();
    if (!emailRe.test(raw)) { setLookupStatus("idle"); setLookupMessage(""); setMatchedFirm(""); return; }
    setLookupStatus("checking");
    const t = setTimeout(async () => {
      const res = await checkProjectEmail(raw);
      if (res.ok) {
        setLookupStatus("matched");
        setLookupMessage(`Matched to ${res.firmName}`);
        setMatchedFirm(res.firmName);
      } else {
        setLookupStatus("mismatch");
        setLookupMessage(res.message);
        setMatchedFirm("");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [firmEmail]);

  const emailError = submitAttempted && !emailRe.test(firmEmail.trim()) ? "Enter your firm's contact email" : "";

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setSubmitError("");
    const errors = validateProject(project);
    if (Object.keys(errors).length || !emailRe.test(firmEmail.trim()) || lookupStatus !== "matched") {
      if (lookupStatus !== "matched" && !submitError) {
        setSubmitError(lookupStatus === "mismatch" ? lookupMessage : "Confirm your firm email matches a registered profile.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      await submitOnboarding({ variant: "project-only", project, contactEmail: firmEmail.trim() });
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
        <SuccessScreen />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell eyebrow="Add a Project">
      <FadeIn>
        <OnboardingCard>
          <div className="flex flex-col gap-5">
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.grayLight,
                  fontFamily: sans,
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Firm Contact Email <span style={{ color: "#c14" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={firmEmail}
                  onChange={(e) => setFirmEmail(e.target.value)}
                  placeholder="hello@yourfirm.com"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 40px 0 14px",
                    background: C.white,
                    border: `1px solid ${lookupStatus === "matched" ? "#1f7a3a" : lookupStatus === "mismatch" ? "#c14" : C.creamBorder}`,
                    borderRadius: "10px",
                    color: C.black,
                    fontFamily: sans,
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onFocus={(e) => { if (lookupStatus === "idle") e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => {
                    if (lookupStatus === "matched") e.currentTarget.style.borderColor = "#1f7a3a";
                    else if (lookupStatus === "mismatch") e.currentTarget.style.borderColor = "#c14";
                    else e.currentTarget.style.borderColor = C.creamBorder;
                  }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                  {lookupStatus === "checking" && <Loader2 size={16} className="animate-spin" style={{ color: C.grayLight }} />}
                  {lookupStatus === "matched" && <Check size={16} strokeWidth={3} style={{ color: "#1f7a3a" }} />}
                  {lookupStatus === "mismatch" && <span style={{ color: "#c14", fontSize: 18, lineHeight: 1, fontWeight: 600 }}>×</span>}
                </span>
              </div>
              {lookupStatus === "idle" && (
                <p className="mt-1 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>
                  Used to match this project to your existing firm profile.
                </p>
              )}
              {lookupStatus === "checking" && (
                <p className="mt-1.5 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>Checking firm registry…</p>
              )}
              {lookupStatus === "matched" && (
                <p className="mt-1.5 text-[11px] flex items-center gap-1.5" style={{ color: "#1f7a3a", fontFamily: sans }}>
                  <Check size={11} strokeWidth={3} /> {lookupMessage}
                </p>
              )}
              {lookupStatus === "mismatch" && (
                <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{lookupMessage}</p>
              )}
              {emailError && <p className="text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{emailError}</p>}
            </div>

            <div className="h-px" style={{ background: C.creamBorder }} />

            <ProjectStep value={project} onChange={setProject} submitAttempted={submitAttempted} />
          </div>
        </OnboardingCard>
      </FadeIn>

      {submitError && (
        <p className="mt-4 text-[13px]" style={{ color: "#c14", fontFamily: sans }}>
          {submitError}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <PrimaryButton
          label={submitting ? "Submitting…" : "Submit Project"}
          onClick={handleSubmit}
          disabled={submitting}
        />
      </div>
    </OnboardingShell>
  );
}

export default ProjectSubmissionPage;
