import { useRef, useState } from "react";
import { C, serif, sans } from "../homepage/v8/primitives";
import { Camera, Loader2, Check } from "lucide-react";
import { uploadOnboardingImage, StudioInfo } from "./onboardingApi";

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: C.grayLight,
  fontFamily: sans,
  display: "block",
  marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "44px",
  padding: "0 14px",
  background: C.white,
  border: `1px solid ${C.creamBorder}`,
  borderRadius: "10px",
  color: C.black,
  fontFamily: sans,
  fontSize: "14px",
  outline: "none",
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: "auto",
  minHeight: "112px",
  padding: "12px 14px",
  resize: "vertical",
  lineHeight: 1.55,
};
const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: serif,
  color: C.black,
  fontSize: "18px",
  letterSpacing: "-0.01em",
  marginBottom: "4px",
};
const helperStyle: React.CSSProperties = {
  fontSize: "12px",
  color: C.grayLight,
  fontFamily: sans,
  lineHeight: 1.5,
};

const LICENSE_OPTIONS = ["HDB License", "BCA", "ISO", "SIDAC", "BizSafe"];
const SERVICE_AREA_OPTIONS = ["West", "East", "North", "North-East", "Central"];
const SERVICE_PROVIDED_OPTIONS = ["Design and Build", "Design Only Service", "Project Management"];
const PROJECT_TYPE_OPTIONS = [
  "HDB (BTO, Resale, Maisonette)",
  "Executive Condominium (EC)",
  "Condominium (New Launch, Resale)",
  "Landed Homes",
];
const LANDED_OPTIONS = ["Landed Homes", "Selected Landed Homes", "Not Suitable for Landed Projects"];
const DESIGN_STYLE_OPTIONS = [
  "Modern", "Contemporary", "Scandinavian", "Japandi", "Industrial", "Mid-Century",
  "Minimalist", "Luxury/High-End", "Classic/Traditional", "Eclectic", "Muji-style", "Resort-style",
];
const SPECIALISATION_OPTIONS = [
  "Design & Build", "Commercial", "Complimentary (Below 30K budget)", "Carpentry-Focused",
  "Full Home Renovation", "Partial Renovation", "Premium / High-End Works",
];
const BUDGET_OPTIONS = [
  "Under $30K — Partial Renovation",
  "$30K–$50K — Essential Renovation",
  "$50K–$80K — Full Renovation",
  "$80K–$120K — Upgraded Renovation",
  "$120K+ — High-End Renovation",
];
const FINANCING_OPTIONS = ["Renovation Loan Available", "Flexible Payment Staging", "No Financing Available"];

function isValidGoogleMaps(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!/^https:\/\//i.test(trimmed)) return false;
  return /(maps\.|goo\.gl\/maps|maps\.app\.goo\.gl|google\.[a-z.]+\/maps)/i.test(trimmed);
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStudio(s: StudioInfo): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!s.firmName.trim()) errors.firmName = "Firm name is required";
  if (!s.tagline.trim()) errors.tagline = "Tagline is required";
  if (!s.bio.trim()) errors.bio = "About / bio is required";
  if (!s.logoImage) errors.logoImage = "Upload your firm logo";
  if (!emailRe.test(s.contactEmail.trim())) errors.contactEmail = "Enter your firm's contact email";
  if (!isValidGoogleMaps(s.googleMapsUrl)) errors.googleMapsUrl = "Paste a valid Google Maps URL";
  if (!s.acraUen.trim()) errors.acraUen = "ACRA/UEN is required";
  if (!s.yearsExperience.trim()) errors.yearsExperience = "Years of experience is required";
  if (!s.officeAddress.trim()) errors.officeAddress = "Office address is required";
  if (!s.serviceArea.length) errors.serviceArea = "Select at least one service area";
  if (!s.serviceProvided.length) errors.serviceProvided = "Select at least one service";
  if (!s.projectTypes.length) errors.projectTypes = "Select at least one project type";
  if (!s.designStyles.length) errors.designStyles = "Select at least one design style";
  if (!s.specialisation.length) errors.specialisation = "Select at least one specialisation";
  if (!s.budgetRange.length) errors.budgetRange = "Select at least one budget range";
  if (!s.financing.trim()) errors.financing = "Select a financing option";
  return errors;
}

function CheckboxGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  columns?: 1 | 2;
}) {
  const safe = Array.isArray(value) ? value : [];
  const toggle = (opt: string) => {
    if (safe.includes(opt)) onChange(safe.filter((v) => v !== opt));
    else onChange([...safe, opt]);
  };
  return (
    <div
      className={columns === 2 ? "grid grid-cols-1 sm:grid-cols-2" : "grid grid-cols-1"}
      style={{ border: `1px solid ${C.creamBorder}`, borderRadius: "10px", overflow: "hidden" }}
    >
      {options.map((opt, i) => {
        const active = safe.includes(opt);
        const topBorder = columns === 2 ? i < 2 : i === 0;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
            style={{
              background: active ? C.cream : C.white,
              borderTop: topBorder ? "none" : `1px solid ${C.creamBorder}`,
              borderLeft: columns === 2 && i % 2 === 1 ? `1px solid ${C.creamBorder}` : "none",
              transition: "background 120ms",
            }}
          >
            <span
              className="inline-flex items-center justify-center shrink-0"
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `1.5px solid ${active ? C.black : C.creamBorder}`,
                background: active ? C.black : C.white,
              }}
            >
              {active && <Check size={11} strokeWidth={3} style={{ color: C.white }} />}
            </span>
            <span className="text-[13px]" style={{ color: C.black, fontFamily: sans }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div style={{ border: `1px solid ${C.creamBorder}`, borderRadius: "10px", overflow: "hidden" }}>
      {options.map((opt, i) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
            style={{
              background: active ? C.cream : C.white,
              borderTop: i === 0 ? "none" : `1px solid ${C.creamBorder}`,
              transition: "background 120ms",
            }}
          >
            <span
              className="inline-flex items-center justify-center shrink-0"
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                border: `1.5px solid ${active ? C.black : C.creamBorder}`,
                background: C.white,
              }}
            >
              {active && <span style={{ width: 8, height: 8, borderRadius: 999, background: C.black }} />}
            </span>
            <span className="text-[13px]" style={{ color: C.black, fontFamily: sans }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{msg}</p>;
}

function Divider() {
  return <div className="h-px my-1" style={{ background: C.creamBorder }} />;
}

export function StudioInfoStep({
  value,
  onChange,
  submitAttempted,
}: {
  value: StudioInfo;
  onChange: (v: StudioInfo) => void;
  submitAttempted: boolean;
}) {
  const logoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const errors = submitAttempted ? validateStudio(value) : {};

  const patch = (p: Partial<StudioInfo>) => onChange({ ...value, ...p });

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5MB"); return; }
    setUploading(true);
    try {
      const url = await uploadOnboardingImage(file);
      patch({ logoImage: url });
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    }
    setUploading(false);
    if (logoRef.current) logoRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2
          className="font-normal leading-[1.15] mb-2"
          style={{ fontFamily: serif, color: C.black, fontSize: "clamp(24px, 3vw, 32px)", letterSpacing: "-0.01em" }}
        >
          Tell us about your studio
        </h2>
        <p className="text-[14px] leading-[1.6]" style={{ color: C.gray, fontFamily: sans }}>
          This becomes the public-facing profile for your firm on Network. Fields marked <span style={{ color: "#c14" }}>*</span> are required.
        </p>
      </div>

      {/* ── Identity ─────────────────────────────── */}
      <div>
        <label style={labelStyle}>Firm Logo <span style={{ color: "#c14" }}>*</span></label>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        <button
          type="button"
          onClick={() => !uploading && logoRef.current?.click()}
          disabled={uploading}
          className="relative w-[132px] h-[132px] overflow-hidden cursor-pointer group"
          style={{ background: C.cream, border: `2px dashed ${C.creamBorder}`, borderRadius: "16px" }}
          aria-label="Upload firm logo"
        >
          {value.logoImage ? (
            <>
              <img src={value.logoImage} alt="Firm logo" className="w-full h-full object-contain p-3" />
              <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/0 group-hover:bg-black/30">
                <Camera size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.white }} />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              {uploading ? (
                <Loader2 size={22} className="animate-spin" style={{ color: C.gray }} />
              ) : (
                <>
                  <Camera size={22} style={{ color: C.grayLight }} />
                  <span className="text-[11px]" style={{ color: C.gray, fontFamily: sans }}>Upload logo</span>
                </>
              )}
            </div>
          )}
        </button>
        <FieldError msg={uploadError || errors.logoImage} />
      </div>

      <div>
        <label style={labelStyle}>Firm Name <span style={{ color: "#c14" }}>*</span></label>
        <input
          type="text" value={value.firmName} placeholder="e.g. Aldrich Studio" maxLength={80}
          onChange={(e) => patch({ firmName: e.target.value })} style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <FieldError msg={errors.firmName} />
      </div>

      <div>
        <label style={labelStyle}>Tagline <span style={{ color: "#c14" }}>*</span></label>
        <input
          type="text" value={value.tagline} placeholder="e.g. Considered interiors for modern homes" maxLength={60}
          onChange={(e) => patch({ tagline: e.target.value })} style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <p className="mt-1 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>{value.tagline.length}/60</p>
        <FieldError msg={errors.tagline} />
      </div>

      <div>
        <label style={labelStyle}>About / Bio <span style={{ color: "#c14" }}>*</span></label>
        <textarea
          value={value.bio} placeholder="Who you are, what you care about, what makes your studio different." maxLength={600}
          onChange={(e) => patch({ bio: e.target.value })} style={textareaStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <p className="mt-1 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>{value.bio.length}/600</p>
        <FieldError msg={errors.bio} />
      </div>

      <Divider />

      {/* ── Contact & registration ───────────────── */}
      <div>
        <h3 style={sectionHeadingStyle}>Contact & registration</h3>
        <p style={helperStyle}>So we can match new project submissions to your profile and verify your firm.</p>
      </div>

      <div>
        <label style={labelStyle}>Contact Email <span style={{ color: "#c14" }}>*</span></label>
        <input
          type="email" value={value.contactEmail} placeholder="hello@yourfirm.com"
          onChange={(e) => patch({ contactEmail: e.target.value })} style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <p className="mt-1 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>
          Use this same email later when adding new projects to your profile.
        </p>
        <FieldError msg={errors.contactEmail} />
      </div>

      <div>
        <label style={labelStyle}>ACRA / UEN <span style={{ color: "#c14" }}>*</span></label>
        <input
          type="text" value={value.acraUen} placeholder="e.g. 201912345A" maxLength={40}
          onChange={(e) => patch({ acraUen: e.target.value })} style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <FieldError msg={errors.acraUen} />
      </div>

      <div>
        <label style={labelStyle}>Years of Experience <span style={{ color: "#c14" }}>*</span></label>
        <input
          type="text" inputMode="numeric" value={value.yearsExperience} placeholder="e.g. 8" maxLength={3}
          onChange={(e) => patch({ yearsExperience: e.target.value.replace(/[^0-9]/g, "") })} style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <FieldError msg={errors.yearsExperience} />
      </div>

      <div>
        <label style={labelStyle}>Office Address <span style={{ color: "#c14" }}>*</span></label>
        <input
          type="text" value={value.officeAddress} placeholder="Unit + street + postal code"
          onChange={(e) => patch({ officeAddress: e.target.value })} style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <FieldError msg={errors.officeAddress} />
      </div>

      <div>
        <label style={labelStyle}>Google Maps Link <span style={{ color: "#c14" }}>*</span></label>
        <input
          type="url" value={value.googleMapsUrl} placeholder="https://maps.app.goo.gl/…"
          onChange={(e) => patch({ googleMapsUrl: e.target.value })} style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <p className="mt-1 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>
          We use this to pull your Google reviews into your profile.
        </p>
        <FieldError msg={errors.googleMapsUrl} />
      </div>

      <div>
        <label style={labelStyle}>Licenses</label>
        <CheckboxGroup
          options={LICENSE_OPTIONS}
          value={value.licenses}
          onChange={(next) => patch({ licenses: next })}
        />
        <input
          type="text" value={value.licensesOther} placeholder="Other licenses (optional)"
          onChange={(e) => patch({ licensesOther: e.target.value })}
          style={{ ...inputStyle, marginTop: "8px" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
      </div>

      <Divider />

      {/* ── Service coverage ─────────────────────── */}
      <div>
        <h3 style={sectionHeadingStyle}>Service coverage</h3>
        <p style={helperStyle}>Where you work and the services you offer.</p>
      </div>

      <div>
        <label style={labelStyle}>Service Area <span style={{ color: "#c14" }}>*</span></label>
        <CheckboxGroup options={SERVICE_AREA_OPTIONS} value={value.serviceArea} onChange={(next) => patch({ serviceArea: next })} />
        <FieldError msg={errors.serviceArea} />
      </div>

      <div>
        <label style={labelStyle}>Service Provided <span style={{ color: "#c14" }}>*</span></label>
        <CheckboxGroup columns={1} options={SERVICE_PROVIDED_OPTIONS} value={value.serviceProvided} onChange={(next) => patch({ serviceProvided: next })} />
        <FieldError msg={errors.serviceProvided} />
      </div>

      <div>
        <label style={labelStyle}>Typical Project Type <span style={{ color: "#c14" }}>*</span></label>
        <CheckboxGroup columns={1} options={PROJECT_TYPE_OPTIONS} value={value.projectTypes} onChange={(next) => patch({ projectTypes: next })} />
        <FieldError msg={errors.projectTypes} />
      </div>

      <div>
        <label style={labelStyle}>Landed Projects Eligibility</label>
        <RadioGroup options={LANDED_OPTIONS} value={value.landedEligibility} onChange={(next) => patch({ landedEligibility: next })} />
      </div>

      <Divider />

      {/* ── Style & specialisation ───────────────── */}
      <div>
        <h3 style={sectionHeadingStyle}>Style & specialisation</h3>
        <p style={helperStyle}>Used to match you to homeowners looking for the right fit.</p>
      </div>

      <div>
        <label style={labelStyle}>Design Styles <span style={{ color: "#c14" }}>*</span></label>
        <CheckboxGroup options={DESIGN_STYLE_OPTIONS} value={value.designStyles} onChange={(next) => patch({ designStyles: next })} />
        <FieldError msg={errors.designStyles} />
      </div>

      <div>
        <label style={labelStyle}>Specialisation <span style={{ color: "#c14" }}>*</span></label>
        <CheckboxGroup columns={1} options={SPECIALISATION_OPTIONS} value={value.specialisation} onChange={(next) => patch({ specialisation: next })} />
        <FieldError msg={errors.specialisation} />
      </div>

      <Divider />

      {/* ── Budget & financing ───────────────────── */}
      <div>
        <h3 style={sectionHeadingStyle}>Budget & financing</h3>
        <p style={helperStyle}>Helps us route homeowners whose budgets align with your work.</p>
      </div>

      <div>
        <label style={labelStyle}>Budget Range <span style={{ color: "#c14" }}>*</span></label>
        <CheckboxGroup columns={1} options={BUDGET_OPTIONS} value={value.budgetRange} onChange={(next) => patch({ budgetRange: next })} />
        <FieldError msg={errors.budgetRange} />
      </div>

      <div>
        <label style={labelStyle}>Renovation Financing <span style={{ color: "#c14" }}>*</span></label>
        <RadioGroup options={FINANCING_OPTIONS} value={value.financing} onChange={(next) => patch({ financing: next })} />
        <FieldError msg={errors.financing} />
      </div>

    </div>
  );
}
