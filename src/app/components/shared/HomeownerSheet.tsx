import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronRight, MessageSquare, Star, Home as HomeIcon, LogOut } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const serif = "'EB Garamond', Georgia, serif";

const C = {
  cream: "#f0ede6",
  creamDark: "#e8e4db",
  creamBorder: "#d8d3c8",
  black: "#0f0f0d",
  white: "#fafaf8",
  gray: "#5a574f",
  grayLight: "#6b6860",
  green: "#16a34a",
};

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

type Profile = {
  name?: string;
  email?: string;
  avatar?: string;
  status?: string;
  house?: { propertyType?: string; propertyStatus?: string; budget?: string };
  inquiries?: any[];
  savedDesigners?: any[];
};

function readCache(): Profile {
  try {
    const full = localStorage.getItem("homeowner-full-cache");
    if (full) return JSON.parse(full) as Profile;
  } catch {}
  try {
    const lite = localStorage.getItem("homeowner-profile-cache");
    if (lite) return JSON.parse(lite) as Profile;
  } catch {}
  return {};
}

function initialsFor(name?: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "·";
}

function statusFor(p: Profile): { label: string; tone: "active" | "neutral" } {
  if (p.status) return { label: p.status, tone: "active" };
  const ps = p.house?.propertyStatus;
  if (ps) return { label: `Property: ${ps}`, tone: "neutral" };
  return { label: "Just exploring", tone: "neutral" };
}

export function HomeownerSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<Profile>(() => readCache());

  // Refresh from server when the sheet opens — keeps the snapshot live
  // without blocking the open animation.
  useEffect(() => {
    if (!open) return;
    setProfile(readCache());
    const token = localStorage.getItem("homeowner-token") || "";
    if (!token) return;
    fetch(`${API}/homeowner-profile`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
        "X-Homeowner-Token": token,
      },
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.data) {
          setProfile(j.data);
          try { localStorage.setItem("homeowner-full-cache", JSON.stringify(j.data)); } catch {}
        }
      })
      .catch(() => {});
  }, [open]);

  // Esc to close + lock body scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const status = useMemo(() => statusFor(profile), [profile]);
  const recentInquiries = (profile.inquiries || []).slice(0, 2);
  const savedDesigners = (profile.savedDesigners || []).slice(0, 3);

  const signOut = async () => {
    const token = localStorage.getItem("homeowner-token") || "";
    try {
      await fetch(`${API}/homeowner-logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Homeowner-Token": token,
        },
      });
    } catch {}
    for (const k of [
      "homeowner-token",
      "homeowner-userId",
      "homeowner-full-cache",
      "homeowner-profile-cache",
    ]) {
      try { localStorage.removeItem(k); } catch {}
    }
    window.dispatchEvent(new Event("homeowner-auth-changed"));
    onClose();
    // Force a fresh render of any pages that read auth state.
    window.location.href = "/";
  };

  // Portal to body so ancestor transforms (sticky nav, motion wrappers) can't
  // turn the fixed-positioned aside into an absolutely-positioned one.
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[80]"
            style={{ background: "rgba(15,15,13,0.45)", backdropFilter: "blur(2px)" }}
          />

          {/* Sheet */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed right-0 top-0 bottom-0 z-[81] flex flex-col"
            style={{
              width: "min(420px, 100vw)",
              background: C.white,
              borderLeft: `1px solid ${C.creamBorder}`,
              fontFamily: sans,
            }}
            role="dialog"
            aria-label="Account menu"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <span
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: C.grayLight,
                }}
              >
                Your Network
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="size-[34px] rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: C.cream, border: `1px solid ${C.creamBorder}` }}
              >
                <X size={16} style={{ color: C.gray }} />
              </button>
            </div>

            <div className="px-5 pb-6 flex-1 overflow-y-auto">
              {/* Identity card */}
              <div
                className="flex items-center gap-4 p-4 rounded-[14px]"
                style={{ background: C.cream, border: `1px solid ${C.creamBorder}` }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name || "You"}
                    className="size-[56px] rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="size-[56px] rounded-full flex items-center justify-center shrink-0"
                    style={{ background: C.black, color: C.white, fontFamily: serif, fontSize: 22 }}
                  >
                    {initialsFor(profile.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-medium truncate" style={{ color: C.black }}>
                    {profile.name || "Welcome"}
                  </div>
                  <div className="text-[12px] truncate" style={{ color: C.grayLight }}>
                    {profile.email || ""}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full"
                    style={{
                      background: status.tone === "active" ? "#dcfce7" : C.creamDark,
                      border: `1px solid ${status.tone === "active" ? "#86efac" : C.creamBorder}`,
                    }}
                  >
                    <span
                      className="size-[6px] rounded-full"
                      style={{ background: status.tone === "active" ? C.green : C.gray }}
                    />
                    <span className="text-[11px] font-medium" style={{ color: C.black }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Saved designers preview */}
              <SectionHeader label="Saved designers" actionLabel="See all" actionHref="/profile?tab=saved&sub=designers" />
              {savedDesigners.length === 0 ? (
                <EmptyTile
                  text="Designers you save will appear here for quick access."
                  ctaLabel="Browse designers"
                  ctaHref="/interior-designers"
                />
              ) : (
                <div className="flex gap-3 mt-3">
                  {savedDesigners.map((d: any, i: number) => (
                    <a
                      key={d.slug || i}
                      href={`/designer/${d.slug || ""}`}
                      className="block flex-1 min-w-0 rounded-[12px] overflow-hidden"
                      style={{ border: `1px solid ${C.creamBorder}`, background: C.cream }}
                    >
                      {d.image ? (
                        <div className="aspect-[4/3] overflow-hidden">
                          <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] flex items-center justify-center" style={{ background: C.creamDark, color: C.gray, fontFamily: serif, fontSize: 24 }}>
                          {(d.name || "·").charAt(0)}
                        </div>
                      )}
                      <div className="p-2 text-[12px] font-medium truncate" style={{ color: C.black }}>
                        {d.name || "Saved designer"}
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Recent inquiries */}
              <SectionHeader label="Recent inquiries" actionLabel={recentInquiries.length ? "See all" : undefined} actionHref="/profile?tab=inquiries" />
              {recentInquiries.length === 0 ? (
                <EmptyTile
                  text="Reach out to a designer and we'll keep the conversation thread here."
                  ctaLabel="Get matched"
                  ctaHref="/get-matched"
                />
              ) : (
                <div className="flex flex-col gap-2 mt-3">
                  {recentInquiries.map((q: any, i: number) => (
                    <a
                      key={q.id || i}
                      href={`/profile?tab=inquiries`}
                      className="flex items-start gap-3 p-3 rounded-[12px] hover:bg-[#fafaf8] transition-colors"
                      style={{ border: `1px solid ${C.creamBorder}` }}
                    >
                      <div className="size-[34px] rounded-full flex items-center justify-center shrink-0" style={{ background: C.cream }}>
                        <MessageSquare size={15} style={{ color: C.gray }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate" style={{ color: C.black }}>
                          {q.designerName || q.subject || "Inquiry"}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: C.grayLight }}>
                          {q.status || q.preview || "Sent"}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: C.grayLight, marginTop: 8 }} />
                    </a>
                  ))}
                </div>
              )}

              {/* Quick navigation */}
              <SectionHeader label="Jump to" />
              <div className="flex flex-col gap-1 mt-2">
                <SheetLink href="/profile" icon={HomeIcon} label="Full dashboard" />
                <SheetLink href="/profile?tab=saved" icon={Star} label="Saved & inspiration" />
                <SheetLink href="/profile?tab=inquiries" icon={MessageSquare} label="Inquiries & matches" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
              <button
                onClick={signOut}
                className="w-full h-[44px] rounded-[10px] flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  background: "transparent", color: C.gray,
                  border: `1px solid ${C.creamBorder}`, fontFamily: sans,
                  fontSize: 13, fontWeight: 500,
                }}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SectionHeader({ label, actionLabel, actionHref }: { label: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-1">
      <span
        style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase", color: C.grayLight,
        }}
      >
        {label}
      </span>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="text-[12px] font-medium hover:opacity-70"
          style={{ color: C.black }}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

function EmptyTile({ text, ctaLabel, ctaHref }: { text: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div
      className="mt-3 p-4 rounded-[12px] flex flex-col gap-3"
      style={{ background: C.cream, border: `1px dashed ${C.creamBorder}` }}
    >
      <p className="text-[13px] leading-[1.5]" style={{ color: C.gray }}>{text}</p>
      <a
        href={ctaHref}
        className="self-start text-[12px] font-semibold inline-flex items-center gap-1 hover:opacity-70"
        style={{ color: C.black }}
      >
        {ctaLabel} <ChevronRight size={13} />
      </a>
    </div>
  );
}

function SheetLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-[#fafaf8] transition-colors"
    >
      <span className="size-[28px] rounded-full flex items-center justify-center" style={{ background: C.cream }}>
        <Icon size={14} style={{ color: C.gray }} />
      </span>
      <span className="text-[13px] font-medium flex-1" style={{ color: C.black }}>{label}</span>
      <ChevronRight size={13} style={{ color: C.grayLight }} />
    </a>
  );
}
