import { ReactNode } from "react";
import { C, sans, serif } from "../homepage/v8/primitives";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

export function OnboardingNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: C.cream, borderBottom: `1px solid ${C.creamBorder}` }}
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
        <a
          href="/"
          className="cursor-pointer shrink-0 block"
          style={{
            width: "110px",
            height: "23px",
            background: C.black,
            maskImage: `url('${logoImg}')`,
            maskSize: "111.804px 22.909px",
            maskRepeat: "no-repeat",
            maskPosition: "0px 0px",
            WebkitMaskImage: `url('${logoImg}')`,
            WebkitMaskSize: "111.804px 22.909px",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "0px 0px",
          }}
        />
        <span
          className="hidden sm:inline text-[11px]"
          style={{
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.grayLight,
            fontFamily: sans,
          }}
        >
          Firm onboarding · Private link
        </span>
      </div>
    </nav>
  );
}

export function StepPills({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <div className="flex items-center gap-2 mb-7 flex-wrap">
      {steps.map((label, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <div
            key={label}
            className="flex items-center gap-2 px-3.5 py-1.5"
            style={{
              background: active ? C.black : done ? C.creamDark : C.cream,
              color: active ? C.white : done ? C.black : C.gray,
              border: `1px solid ${active || done ? C.black : C.creamBorder}`,
              borderRadius: 999,
            }}
          >
            <span
              className="text-[10px] font-semibold"
              style={{ fontFamily: sans, letterSpacing: "0.08em" }}
            >
              {i + 1}
            </span>
            <span
              className="text-[11px]"
              style={{
                fontFamily: sans,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function OnboardingShell({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ background: C.cream, fontFamily: sans, color: C.black }}
    >
      <OnboardingNav />
      <main className="pt-[72px] md:pt-[88px] pb-[80px] px-5 md:px-8">
        <div className="max-w-[720px] mx-auto">
          {eyebrow && (
            <p
              className="mb-3"
              style={{
                fontFamily: sans,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.grayLight,
              }}
            >
              {eyebrow}
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export function OnboardingCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="p-6 md:p-8"
      style={{
        background: C.white,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: "16px",
      }}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  label,
  onClick,
  disabled,
  type = "button",
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-[48px] px-7 cursor-pointer hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      style={{
        background: C.black,
        color: C.white,
        border: "none",
        borderRadius: 999,
        fontFamily: serif,
        fontSize: "16px",
        letterSpacing: "-0.005em",
      }}
    >
      {label}
    </button>
  );
}

export function SecondaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[48px] px-4 cursor-pointer hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      style={{
        background: "transparent",
        color: C.gray,
        border: "none",
        fontFamily: sans,
        fontSize: "14px",
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}
