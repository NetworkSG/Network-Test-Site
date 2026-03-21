import { projectId, publicAnonKey } from "/utils/supabase/info";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import img3dRoom from "figma:asset/fbda29f80c81f0905b7b7c205cc78004d21fbe37.png";

const TOTAL_STEPS = 5;

// Step 1: Contact Details
function StepContact({
  data,
  onChange,
}: {
  data: { name: string; whatsapp: string; email: string };
  onChange: (field: string, value: string) => void;
}) {
  const [touched, setTouched] = useState<{ whatsapp: boolean; email: boolean }>({
    whatsapp: false,
    email: false,
  });

  const whatsappHasError = touched.whatsapp && data.whatsapp && data.whatsapp.length < 8;
  const emailHasError =
    touched.email &&
    data.email &&
    !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(data.email);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full">
      {/* Left side */}
      <div className="flex-1 w-full lg:max-w-[420px]">
        <h1 className="font-['Inter',sans-serif] font-bold text-[28px] md:text-[36px] text-[#09090b] tracking-[-1.5px] leading-[1.2] mb-4">
          Before we start, let's get to know you a little.
        </h1>
        <p className="font-['Inter',sans-serif] text-[13px] md:text-[14px] text-[#71717a] leading-[1.6] mb-8">
          We'll use your contact details to share your matched renovation teams
          and guide you through the next steps.
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full border border-[#e4e4e7] rounded-[10px] px-5 py-4 font-['Inter',sans-serif] text-[14px] text-[#09090b] placeholder-[#09090b] outline-none focus:border-[#09090b] transition-colors bg-white"
          />
          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="WhatsApp Number"
              value={data.whatsapp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                onChange("whatsapp", val);
              }}
              onFocus={() => setTouched((t) => ({ ...t, whatsapp: false }))}
              onBlur={() => setTouched((t) => ({ ...t, whatsapp: true }))}
              className={`w-full border rounded-[10px] px-5 py-4 font-['Inter',sans-serif] text-[14px] text-[#09090b] placeholder-[#09090b] outline-none transition-colors bg-white ${
                whatsappHasError
                  ? "border-red-400"
                  : "border-[#e4e4e7] focus:border-[#09090b]"
              }`}
            />
            {whatsappHasError && (
              <p className="mt-1.5 ml-1 font-['Inter',sans-serif] text-[12px] text-red-500">
                Please enter a valid 8-digit number
              </p>
            )}
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
              onFocus={() => setTouched((t) => ({ ...t, email: false }))}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
              className={`w-full border rounded-[10px] px-5 py-4 font-['Inter',sans-serif] text-[14px] text-[#09090b] placeholder-[#09090b] outline-none transition-colors bg-white ${
                emailHasError
                  ? "border-red-400"
                  : "border-[#e4e4e7] focus:border-[#09090b]"
              }`}
            />
            {emailHasError && (
              <p className="mt-1.5 ml-1 font-['Inter',sans-serif] text-[12px] text-red-500">
                {!data.email.includes("@")
                  ? "Please include an '@' in the email address"
                  : !data.email.split("@")[1]?.includes(".")
                  ? "Please enter a complete email domain (e.g. gmail.com)"
                  : "Please enter a valid email address"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - 3D room image */}
      <div className="hidden lg:flex flex-1 items-center justify-end">
        <div className="relative w-full max-w-[520px]">
          <video
            src="https://noddhgtqaktrjtmwmxct.supabase.co/storage/v1/object/public/Videos/freepik__a-smooth-3d-popup-animation-of-a-minimalist-living__13533.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-contain"
            style={{
              maskImage: "radial-gradient(ellipse 58% 58% at center, black 40%, transparent 85%)",
              WebkitMaskImage: "radial-gradient(ellipse 58% 58% at center, black 40%, transparent 85%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Step 2: Property Type
function StepPropertyType({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options = [
    {
      label: "HDB",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
          <path d="M10 9h4" />
          <path d="M10 13h4" />
        </svg>
      ),
    },
    {
      label: "Condo",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      ),
    },
    {
      label: "Landed",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V10l7-7 7 7v11" />
          <path d="M9 21v-6h6v6" />
          <rect x="9" y="10" width="6" height="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-['Inter',sans-serif] font-semibold text-[28px] md:text-[40px] text-[#09090b] tracking-[-1.5px] leading-[1.2] mb-4">
        What type of property are you renovating?
      </h1>
      <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#71717a] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        This helps us match you with firms experienced in your type of home –
        every property has different rules, materials, and renovation needs.
      </p>

      <div className="flex flex-col gap-4 max-w-[480px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.label)}
            className={`flex items-center justify-between px-6 py-5 rounded-[14px] border transition-all duration-200 bg-white ${
              selected === opt.label
                ? "border-[#09090b] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#e4e4e7] hover:border-[#a1a1aa]"
            }`}
          >
            <span className="font-['Inter',sans-serif] font-medium text-[15px] text-[#09090b]">
              {opt.label}
            </span>
            <span className="opacity-60">{opt.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 3: Renovation Timeline
function StepTimeline({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options = [
    "I've already collected my keys / ready to start",
    "In 1–3 months",
    "In 3–6 months",
    "In 6 months or later",
  ];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-['Inter',sans-serif] font-semibold text-[28px] md:text-[40px] text-[#09090b] tracking-[-1.5px] leading-[1.2] mb-4">
        When are you planning to start your renovation?
      </h1>
      <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#71717a] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        Knowing your timeline helps us match you with firms that can start when
        you're ready — whether that's soon or a few months from now.
      </p>

      <div className="flex flex-col gap-4 max-w-[520px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex items-center px-6 py-5 rounded-[14px] border transition-all duration-200 bg-white text-left ${
              selected === opt
                ? "border-[#09090b] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#e4e4e7] hover:border-[#a1a1aa]"
            }`}
          >
            <span className="font-['Inter',sans-serif] font-medium text-[15px] text-[#09090b]">
              {opt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 4: Budget
function StepBudget({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options = [
    "$30K – $50K",
    "$50K – $80K",
    "$80K – $100K",
    "$100K – $200K",
    "$200K – $400K",
    "$400K & Above",
  ];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-['Inter',sans-serif] font-semibold text-[28px] md:text-[40px] text-[#09090b] tracking-[-1.5px] leading-[1.2] mb-4">
        What's your estimated renovation budget?
      </h1>
      <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#71717a] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        Your budget helps us connect you with firms that align with your project
        scale — ensuring realistic plans, accurate quotes, and the right
        expertise for your investment.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-[520px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex items-center px-6 py-5 rounded-[14px] border transition-all duration-200 bg-white text-left ${
              selected === opt
                ? "border-[#09090b] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#e4e4e7] hover:border-[#a1a1aa]"
            }`}
          >
            <span className="font-['Inter',sans-serif] font-medium text-[15px] text-[#09090b]">
              {opt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 5: Thank You
function StepThankYou() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[520px] mx-auto text-center py-10 md:py-20">
      <div className="rounded-[30px] px-8 md:px-12 py-12 md:py-16 bg-[#ffffff]">
        <h1 className="font-['Inter',sans-serif] font-bold text-[36px] md:text-[48px] text-[#09090b] tracking-[-2px] leading-[1.1] mb-1">
          Thank You!
        </h1>
        <h2 className="font-['Inter',sans-serif] font-bold text-[36px] md:text-[48px] tracking-[-2px] leading-[1.1] mb-8 bg-gradient-to-r from-[#f59e0b] to-[#eab308] bg-clip-text text-transparent">
          You're All Set.
        </h2>

        <p className="font-['Inter',sans-serif] text-[15px] md:text-[16px] text-[#52525b] leading-[1.7] mb-6">
          We've received your details.
          <br />
          Our team will contact you on WhatsApp to connect
          <br className="hidden md:block" /> you with 3–5 trusted interior
          designers.
        </p>

        <p className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-[#09090b] leading-[1.7]">
          We'll take a few minutes to understand your
          <br className="hidden md:block" /> renovation goals so we can match
          you with the
          <br className="hidden md:block" /> best-fit designers for your
          project.
        </p>
      </div>

      <button
        onClick={() => navigate("/")}
        className="mt-10 bg-[#09090b] text-white font-['Inter',sans-serif] font-medium text-[15px] rounded-[100px] px-8 py-4 hover:bg-[#27272a] transition-colors"
      >
        Back to Home
      </button>
    </div>
  );
}

// Progress bar
function ProgressBar({ step }: { step: number }) {
  const progress = (step / TOTAL_STEPS) * 100;
  return (
    <div className="w-full h-[3px] bg-[#e4e4e7] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[#09090b] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </div>
  );
}

export function GetMatchedForm() {
  const navigate = useNavigate();
  const inquiry = new URLSearchParams(window.location.search).get("inquiry") || "";
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [contact, setContact] = useState({
    name: "",
    whatsapp: "",
    email: "",
  });
  const [propertyType, setPropertyType] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");

  const canGoNext = () => {
    if (submitting) return false;
    switch (step) {
      case 1:
        return (
          contact.name.trim() !== "" &&
          contact.whatsapp.trim().length === 8 &&
          /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(contact.email)
        );
      case 2:
        return propertyType !== "";
      case 3:
        return timeline !== "";
      case 4:
        return budget !== "";
      default:
        return true;
    }
  };

  const submitQuoteRequest = async () => {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e/quote-request`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        name: contact.name,
        whatsapp: contact.whatsapp,
        email: contact.email,
        property_type: propertyType,
        timeline,
        budget,
        inquiry: inquiry,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Quote request submission failed:", data);
      throw new Error(data.error || "Submission failed");
    }
    console.log("Quote request submitted:", data);
    return data;
  };

  const handleNext = async () => {
    if (step === 4) {
      // Submit to Supabase before going to thank you
      setSubmitting(true);
      try {
        await submitQuoteRequest();
        setStep(5);
      } catch (err) {
        console.error("Failed to submit quote request:", err);
        alert("Something went wrong submitting your request. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="bg-white min-h-screen font-['Inter',sans-serif] flex flex-col overflow-x-hidden">
      {/* Header with logo */}
      <header className="px-6 md:px-12 pt-8 md:pt-10 pb-4">
        <div className="max-w-[1293px] mx-auto">
          <div
            className="w-[110px] h-[23px] bg-[#2b2b2b] shrink-0 cursor-pointer"
            onClick={() => navigate("/")}
            style={{
              maskImage: `url('${imgRectangle1}')`,
              maskSize: "111.804px 22.909px",
              maskRepeat: "no-repeat",
              maskPosition: "0px 0px",
              WebkitMaskImage: `url('${imgRectangle1}')`,
              WebkitMaskSize: "111.804px 22.909px",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "0px 0px",
            }}
          />
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex items-center px-6 md:px-12">
        <div className="max-w-[1293px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 1 && (
                <StepContact
                  data={contact}
                  onChange={(field, value) =>
                    setContact((prev) => ({ ...prev, [field]: value }))
                  }
                />
              )}
              {step === 2 && (
                <StepPropertyType
                  selected={propertyType}
                  onSelect={setPropertyType}
                />
              )}
              {step === 3 && (
                <StepTimeline selected={timeline} onSelect={setTimeline} />
              )}
              {step === 4 && (
                <StepBudget selected={budget} onSelect={setBudget} />
              )}
              {step === 5 && <StepThankYou />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom navigation */}
      {step < 5 && (
        <footer className="px-6 md:px-12 pb-8 md:pb-10">
          <div className="max-w-[1293px] mx-auto">
            {/* Progress bar */}
            <div className="mb-6">
              <ProgressBar step={step} />
            </div>

            <div className="flex items-center justify-between">
              {/* Back button - only shown after step 1 */}
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] bg-white border border-[#e4e4e7] rounded-[10px] px-8 py-3 hover:bg-[#f4f4f5] transition-colors shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {/* Next button */}
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className={`font-['Inter',sans-serif] font-medium text-[14px] text-white rounded-[10px] px-8 py-3 transition-all duration-200 ${
                  canGoNext()
                    ? "bg-[#09090b] hover:bg-[#27272a] shadow-[0px_4px_12px_rgba(0,0,0,0.15)]"
                    : "bg-[#d4d4d8] cursor-not-allowed"
                }`}
              >
                {submitting ? "Submitting..." : "Next"}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}