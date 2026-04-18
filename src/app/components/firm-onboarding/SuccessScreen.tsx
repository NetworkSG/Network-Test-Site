import { C, serif, sans, FadeIn } from "../homepage/v8/primitives";
import { Check } from "lucide-react";

export function SuccessScreen({ firmName }: { firmName?: string }) {
  return (
    <FadeIn>
      <div
        className="w-full p-10 md:p-14 text-center flex flex-col items-center"
        style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "16px" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
          style={{ background: C.black }}
        >
          <Check size={24} color={C.cream} strokeWidth={2.4} />
        </div>
        <h1
          className="font-normal leading-[1.15] mb-3"
          style={{ fontFamily: serif, color: C.black, fontSize: "clamp(28px, 3.4vw, 40px)", letterSpacing: "-0.01em" }}
        >
          Thanks{firmName ? `, ${firmName}` : ""}.
        </h1>
        <p
          className="max-w-[460px] mx-auto text-[14px] md:text-[15px] leading-[1.7]"
          style={{ color: C.gray, fontFamily: sans }}
        >
          Your submission is in. A member of the Network team will review it and reach out within one business day to confirm details and help get your profile live.
        </p>
      </div>
    </FadeIn>
  );
}
