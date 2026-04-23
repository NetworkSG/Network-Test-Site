import { useState } from "react";
import { C, sans, FadeIn } from "../homepage/v8/primitives";
import { OnboardingShell, OnboardingCard, PrimaryButton } from "./OnboardingShell";
import { ProjectStep, validateProject } from "./ProjectStep";
import { SuccessScreen } from "./SuccessScreen";
import { submitOnboarding, ProjectSubmission, previewDriveFolder, ingestDriveImage } from "./onboardingApi";
import { FirmCombobox } from "./FirmCombobox";

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

export function ProjectSubmissionPage() {
  const [firmRecordId, setFirmRecordId] = useState("");
  const [firmName, setFirmName] = useState("");
  const [firmEmail, setFirmEmail] = useState("");
  const [project, setProject] = useState<ProjectSubmission>(initialProject);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{ done: number; total: number } | null>(null);

  const firmError = submitAttempted && !firmRecordId ? "Pick your firm from the list" : "";

  const handleFirmSelect = (recordId: string, name: string, contactEmail?: string) => {
    setFirmRecordId(recordId);
    setFirmName(name);
    setFirmEmail((contactEmail || "").trim());
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setSubmitError("");
    const errors = validateProject(project);
    if (Object.keys(errors).length || !firmRecordId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      // Ingest each Drive image through the server one-by-one: fetch → compress
      // → upload to our storage. Running them per-request keeps each edge
      // function invocation well under Deno Deploy's WORKER_RESOURCE_LIMIT.
      let storedImageUrls: string[] = [];
      const preview = await previewDriveFolder(project.driveUrl.trim());
      if (!preview.ok) {
        setSubmitError(preview.message || "Couldn't read the Drive folder.");
        setSubmitting(false);
        return;
      }
      const fileIds = preview.images.map((im) => im.id);
      if (fileIds.length) {
        setIngestStatus({ done: 0, total: fileIds.length });
        const CONCURRENCY = 3;
        const results: (string | null)[] = new Array(fileIds.length);
        let cursor = 0;
        let completed = 0;
        const worker = async () => {
          while (true) {
            const i = cursor++;
            if (i >= fileIds.length) break;
            results[i] = await ingestDriveImage(fileIds[i]);
            completed++;
            setIngestStatus({ done: completed, total: fileIds.length });
          }
        };
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, fileIds.length) }, worker));
        storedImageUrls = results.filter((u): u is string => !!u);
        if (!storedImageUrls.length) {
          setSubmitError("Couldn't process any of the Drive images. Check folder sharing is 'Anyone with the link'.");
          setSubmitting(false);
          setIngestStatus(null);
          return;
        }
      }

      await submitOnboarding({
        variant: "project-only",
        project: { ...project, images: storedImageUrls },
        firmName,
        airtableRecordId: firmRecordId,
        ...(firmEmail ? { contactEmail: firmEmail } : {}),
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err?.message || "Submission failed. Please try again.");
    }
    setIngestStatus(null);
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
                Firm Name <span style={{ color: "#c14" }}>*</span>
              </label>
              <FirmCombobox
                value={firmName}
                recordId={firmRecordId}
                onSelect={handleFirmSelect}
              />
              <p className="mt-1 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>
                Pick your firm from the list to link this project to your existing profile.
              </p>
              {firmError && <p className="text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{firmError}</p>}
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
        {ingestStatus && (
          <span style={{ fontSize: 12, color: C.grayLight, fontFamily: sans }}>
            Uploading photos {ingestStatus.done}/{ingestStatus.total}…
          </span>
        )}
        <PrimaryButton
          label={
            ingestStatus
              ? `Uploading ${ingestStatus.done}/${ingestStatus.total}…`
              : submitting
                ? "Submitting…"
                : "Submit Project"
          }
          onClick={handleSubmit}
          disabled={submitting}
        />
      </div>
    </OnboardingShell>
  );
}

export default ProjectSubmissionPage;
