import { useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { X, Eye, EyeOff, ChevronDown } from "lucide-react"
import { useAuth } from "@/app/hooks/useAuth"

const KEY_PERIODS = [
  "Keys Collected",
  "Within 3 months",
  "3–6 months",
  "6–12 months",
  "More than 12 months",
]

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const { signup, login, loading } = useAuth()
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    password: "",
    keyCollectionPeriod: "",
    wantIdShortlist: true,
  })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")

  const upd = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  const handleSignup = useCallback(async () => {
    if (!form.name || !form.email || !form.password || !form.contactNumber || !form.keyCollectionPeriod) {
      setError("All fields are required")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setError("")
    const result = await signup(form)
    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
      onClose()
    }
  }, [form, signup, onClose, onSuccess])

  const handleLogin = useCallback(async () => {
    if (!form.email || !form.password) {
      setError("Email and password are required")
      return
    }
    setError("")
    const result = await login(form.email, form.password)
    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
      onClose()
    }
  }, [form, login, onClose, onSuccess])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      mode === "signup" ? handleSignup() : handleLogin()
    }
  }

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(15,15,13,0.4)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[480px] max-h-[90vh] overflow-auto"
            style={{ background: "#fafaf8", borderRadius: "12px", border: "1px solid #d8d3c8" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="font-['EB_Garamond',Georgia,serif] text-[24px] font-normal text-[#0f0f0d] leading-[1.2]">
                  {mode === "signup" ? "Create Your Account" : "Welcome Back"}
                </h2>
                <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#9a9790] mt-1">
                  {mode === "signup" ? (
                    <>
                      Have an account?{" "}
                      <button
                        onClick={() => { setMode("login"); setError("") }}
                        className="font-semibold underline cursor-pointer text-[#0f0f0d]"
                      >
                        Login
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => { setMode("signup"); setError("") }}
                        className="font-semibold underline cursor-pointer text-[#0f0f0d]"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-60 cursor-pointer transition-all duration-150"
              >
                <X className="w-[18px] h-[18px] text-[#9a9790]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Error */}
              {error && (
                <div className="p-3 font-['DM_Sans',sans-serif] text-[13px] text-[#dc2626] bg-[#fdf2f2] border border-[#fecaca] rounded-[10px]">
                  {error}
                </div>
              )}

              {/* Name (signup only) */}
              {mode === "signup" && (
                <div>
                  <label className="block mb-2 font-['DM_Sans',sans-serif] text-[11px] font-semibold tracking-[0.12em] uppercase text-[#9a9790]">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={e => upd("name", e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Your full name"
                    className="w-full h-[48px] px-4 text-[14px] font-normal bg-[#f0ede6] border border-[#d8d3c8] rounded-[10px] text-[#0f0f0d] placeholder:text-[#9a9790] font-['DM_Sans',sans-serif] outline-none focus:border-[#0f0f0d] transition-colors"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block mb-2 font-['DM_Sans',sans-serif] text-[11px] font-semibold tracking-[0.12em] uppercase text-[#9a9790]">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => upd("email", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className="w-full h-[48px] px-4 text-[14px] font-normal bg-[#f0ede6] border border-[#d8d3c8] rounded-[10px] text-[#0f0f0d] placeholder:text-[#9a9790] font-['DM_Sans',sans-serif] outline-none focus:border-[#0f0f0d] transition-colors"
                />
              </div>

              {/* Contact Number (signup only) */}
              {mode === "signup" && (
                <div>
                  <label className="block mb-2 font-['DM_Sans',sans-serif] text-[11px] font-semibold tracking-[0.12em] uppercase text-[#9a9790]">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={form.contactNumber}
                    onChange={e => upd("contactNumber", e.target.value.replace(/\D/g, "").slice(0, 8))}
                    onKeyDown={handleKeyDown}
                    placeholder="91234567"
                    className="w-full h-[48px] px-4 text-[14px] font-normal bg-[#f0ede6] border border-[#d8d3c8] rounded-[10px] text-[#0f0f0d] placeholder:text-[#9a9790] font-['DM_Sans',sans-serif] outline-none focus:border-[#0f0f0d] transition-colors"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block mb-2 font-['DM_Sans',sans-serif] text-[11px] font-semibold tracking-[0.12em] uppercase text-[#9a9790]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={e => upd("password", e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Min 6 characters"
                    className="w-full h-[48px] px-4 pr-12 text-[14px] font-normal bg-[#f0ede6] border border-[#d8d3c8] rounded-[10px] text-[#0f0f0d] placeholder:text-[#9a9790] font-['DM_Sans',sans-serif] outline-none focus:border-[#0f0f0d] transition-colors"
                  />
                  <button
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPw
                      ? <EyeOff className="w-[18px] h-[18px] text-[#9a9790]" />
                      : <Eye className="w-[18px] h-[18px] text-[#9a9790]" />
                    }
                  </button>
                </div>
              </div>

              {/* Key Collection Period (signup only) */}
              {mode === "signup" && (
                <>
                  <div>
                    <label className="block mb-2 font-['DM_Sans',sans-serif] text-[11px] font-semibold tracking-[0.12em] uppercase text-[#9a9790]">
                      Key Collection Period
                    </label>
                    <div className="relative">
                      <select
                        value={form.keyCollectionPeriod}
                        onChange={e => upd("keyCollectionPeriod", e.target.value)}
                        className="w-full h-[48px] px-4 pr-10 text-[14px] font-normal bg-[#f0ede6] border border-[#d8d3c8] rounded-[10px] text-[#0f0f0d] font-['DM_Sans',sans-serif] outline-none focus:border-[#0f0f0d] transition-colors appearance-none"
                      >
                        <option value="">Select period</option>
                        {KEY_PERIODS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9790] pointer-events-none" />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={form.wantIdShortlist}
                      onChange={e => upd("wantIdShortlist", e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#0f0f0d] shrink-0"
                    />
                    <span className="font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d]">
                      Get a shortlist of Interior Designers{" "}
                      <span className="bg-[#fdf8e8] border border-[#ffeab1] rounded-[100px] px-2 py-0.5 text-[12px] font-bold ml-1">
                        FREE
                      </span>
                    </span>
                  </label>
                </>
              )}

              {/* Submit Button */}
              <button
                onClick={mode === "signup" ? handleSignup : handleLogin}
                disabled={loading}
                className="w-full h-[60px] mt-2 bg-[#0f0f0d] text-[#fafaf8] rounded-[12px] font-['DM_Sans',sans-serif] text-[16px] font-normal tracking-[0.01em] hover:opacity-85 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 transition-all duration-150"
              >
                {loading && (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {mode === "signup" ? "Create Account" : "Log In"}
              </button>

              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#9a9790] text-center mt-1">
                By continuing, you agree to our{" "}
                <span className="underline">Terms of Service</span> and{" "}
                <span className="underline">Privacy Policy</span>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
