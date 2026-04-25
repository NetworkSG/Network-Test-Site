import { useState } from "react"

interface Props {
  data: { name: string; phone: string; email: string }
  onChange: (field: string, value: string) => void
  emailLimitReached?: boolean
}

export function StepLeadCapture({ data, onChange, emailLimitReached }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const phoneError = touched.phone && data.phone.length > 0 && data.phone.length < 8
  const emailError =
    touched.email &&
    data.email.length > 0 &&
    !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(data.email)

  return (
    <div className="max-w-[420px]">
      <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] mb-2">
        Almost there — let's get to know you.
      </h2>
      <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-8">
        We'll use your details to share your matched designers and a free
        interior styling guidebook with your results.
      </p>

      {emailLimitReached && (
        <div className="p-4 mb-6 bg-[#fdf8e8] border border-[#ffeab1] rounded-[10px]">
          <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#0f0f0d] font-medium mb-1">
            You've used all your free attempts
          </p>
          <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860] leading-[1.5]">
            This email has already been used 3 times. Create an account or log in to continue taking the quiz with unlimited access.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em] block mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full rounded-[10px] h-[48px] bg-[#f0ede6] border border-[#d8d3c8] px-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder:text-[#9a9790] outline-none focus:border-[#0f0f0d] transition-colors"
          />
        </div>
        <div>
          <label className="font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em] block mb-1.5">
            WhatsApp / Phone
          </label>
          <div className="flex gap-2">
            <span className="flex items-center rounded-[10px] h-[48px] bg-[#e8e4db] border border-[#d8d3c8] px-3 font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860]">
              +65
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="8-digit number"
              value={data.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 8)
                onChange("phone", val)
              }}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              onFocus={() => setTouched((t) => ({ ...t, phone: false }))}
              className={`flex-1 rounded-[10px] h-[48px] px-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder:text-[#9a9790] outline-none transition-colors bg-[#f0ede6] border ${
                phoneError ? "border-red-400" : "border-[#d8d3c8] focus:border-[#0f0f0d]"
              }`}
            />
          </div>
          {phoneError && (
            <p className="mt-1 font-['DM_Sans',sans-serif] text-[11px] text-red-500">
              Please enter a valid 8-digit number
            </p>
          )}
        </div>
        <div>
          <label className="font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em] block mb-1.5">
            Email
          </label>
          <input
            type="email"
            placeholder="you@email.com"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            onFocus={() => setTouched((t) => ({ ...t, email: false }))}
            className={`w-full rounded-[10px] h-[48px] px-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder:text-[#9a9790] outline-none transition-colors bg-[#f0ede6] border ${
              emailError ? "border-red-400" : "border-[#d8d3c8] focus:border-[#0f0f0d]"
            }`}
          />
          {emailError && (
            <p className="mt-1 font-['DM_Sans',sans-serif] text-[11px] text-red-500">
              Please enter a valid email address
            </p>
          )}
        </div>
      </div>

      <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#9a9790] mt-5 leading-[1.5]">
        By continuing, you agree to receive your quiz results and relevant
        renovation recommendations. We respect your{" "}
        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">privacy</a>.
      </p>
    </div>
  )
}
