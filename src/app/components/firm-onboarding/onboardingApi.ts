import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

const COMPRESS_MAX_DIMENSION = 2000;
const COMPRESS_QUALITY = 0.82;

async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });
    const { width: w, height: h } = img;
    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY)
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file;
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export async function uploadOnboardingImage(file: File): Promise<string> {
  const optimized = await compressImageFile(file);
  const formData = new FormData();
  formData.append("file", optimized);
  const res = await fetch(`${API}/designer-upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Onboarding-Token": "public" },
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const json = await res.json();
  return json.url as string;
}

export interface StudioInfo {
  logoImage: string;
  firmName: string;
  tagline: string;
  bio: string;
  googleMapsUrl: string;
  contactEmail: string;
  acraUen: string;
  yearsExperience: string;
  licenses: string[];
  licensesOther: string;
  officeAddress: string;
  serviceArea: string[];
  serviceProvided: string[];
  projectTypes: string[];
  landedEligibility: string;
  designStyles: string[];
  specialisation: string[];
  budgetRange: string[];
  financing: string;
  portfolioUrl: string;
  airtableRecordId: string;
}

export interface ProjectSubmission {
  title: string;
  location: string;
  cost: string;
  size: string;
  year: string;
  propertyType: string;
  propertySubType: string;
  style: string;
  worksIncluded: string[];
  driveUrl: string;
}

export interface OnboardingPayload {
  variant: "full" | "project-only";
  studio?: StudioInfo;
  project: ProjectSubmission;
  contactEmail?: string;
}

export async function listAirtableFirms(): Promise<{ id: string; firmName: string }[]> {
  const res = await fetch(`${API}/firm-onboarding/airtable-firms`, {
    headers: { Authorization: `Bearer ${publicAnonKey}` },
  });
  if (!res.ok) throw new Error(`Failed to load firms (${res.status})`);
  const json = await res.json();
  return Array.isArray(json.firms) ? json.firms : [];
}

export type LookupResult =
  | { ok: true; firmName: string; prefill: Partial<StudioInfo> }
  | { ok: false; message: string };

export type ProjectEmailCheck =
  | { ok: true; firmName: string; slug: string }
  | { ok: false; message: string };

export async function checkProjectEmail(email: string): Promise<ProjectEmailCheck> {
  const res = await fetch(`${API}/firm-onboarding/project-email-check`, {
    method: "POST",
    headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json().catch(() => null);
  if (res.ok && json?.ok) return { ok: true, firmName: json.firmName, slug: json.slug };
  return { ok: false, message: (json && json.message) || `Lookup failed (${res.status})` };
}

export async function lookupAirtableFirm(recordId: string, identifier: string): Promise<LookupResult> {
  const res = await fetch(`${API}/firm-onboarding/airtable-lookup`, {
    method: "POST",
    headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recordId, identifier }),
  });
  const json = await res.json().catch(() => null);
  if (res.ok && json?.ok) return { ok: true, firmName: json.firmName, prefill: json.prefill || {} };
  return { ok: false, message: (json && json.message) || `Lookup failed (${res.status})` };
}

export async function submitOnboarding(payload: OnboardingPayload): Promise<{ ok: true; id: string }> {
  const res = await fetch(`${API}/firm-onboarding-submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Submit failed (${res.status})`);
  }
  return res.json();
}
