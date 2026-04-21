import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LogOut, User, Menu, X, ArrowRight } from "lucide-react";
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import svgPaths from "../../imports/svg-joburr35cn";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

export function Navbar() {
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Homeowner auth state — instant from cache, then validate in background
  const [homeowner, setHomeowner] = useState<{ name: string; email: string; avatar?: string } | null>(() => {
    try {
      const cached = localStorage.getItem("homeowner-profile-cache");
      const token = localStorage.getItem("homeowner-token");
      if (cached && token) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state when profile cache changes (login/logout from same tab)
  useEffect(() => {
    function syncFromCache() {
      const token = localStorage.getItem("homeowner-token");
      const cached = localStorage.getItem("homeowner-profile-cache");
      if (token && cached) {
        try { setHomeowner(JSON.parse(cached)); } catch { setHomeowner(null); }
      } else {
        setHomeowner(null);
      }
    }
    // Listen for custom event (same-tab updates)
    window.addEventListener("homeowner-auth-changed", syncFromCache);
    // Listen for storage event (cross-tab updates)
    window.addEventListener("storage", syncFromCache);
    return () => {
      window.removeEventListener("homeowner-auth-changed", syncFromCache);
      window.removeEventListener("storage", syncFromCache);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("homeowner-token");
    if (!token) { setHomeowner(null); return; }
    // Validate session and refresh profile in background
    fetch(`${API}/homeowner-session`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}`, "X-Homeowner-Token": token },
    })
      .then(r => r.json())
      .then(json => {
        if (json.valid) {
          fetch(`${API}/homeowner-profile`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}`, "X-Homeowner-Token": token },
          })
            .then(r => r.json())
            .then(pJson => {
              if (pJson.data) {
                const profile = { name: pJson.data.name || "", email: pJson.data.email || "", avatar: pJson.data.avatar || "" };
                setHomeowner(profile);
                localStorage.setItem("homeowner-profile-cache", JSON.stringify(profile));
              }
            })
            .catch(() => {});
        } else {
          // Session invalid — clear everything
          localStorage.removeItem("homeowner-token");
          localStorage.removeItem("homeowner-userId");
          localStorage.removeItem("homeowner-profile-cache");
          localStorage.removeItem("homeowner-full-cache");
          setHomeowner(null);
          window.dispatchEvent(new Event("homeowner-auth-changed"));
        }
      })
      .catch(() => {});
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("homeowner-token");
    if (token) {
      fetch(`${API}/homeowner-logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}`, "X-Homeowner-Token": token },
      }).catch(() => {});
    }
    localStorage.removeItem("homeowner-token");
    localStorage.removeItem("homeowner-userId");
    localStorage.removeItem("homeowner-profile-cache");
    localStorage.removeItem("homeowner-full-cache");
    setHomeowner(null);
    setProfileOpen(false);
    window.dispatchEvent(new Event("homeowner-auth-changed"));
    navigate("/");
  };

  const initials = homeowner?.name
    ? homeowner.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToolsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setToolsOpen(false), 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <nav className="fixed top-6 md:top-12 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[1293px]">
      <div className="backdrop-blur-[16.75px] bg-[rgba(255,255,255,0.76)] rounded-[100px] shadow-[0px_11px_34.4px_-5px_rgba(0,0,0,0.1)] flex items-center justify-between pl-5 md:pl-10 pr-[7px] h-[73px] w-full max-w-[1230px] mx-auto">
        {/* Logo + Nav Links */}
        <div className="flex items-center gap-6 md:gap-8">
          {/* Logo */}
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

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/explore"
              className="font-['Inter',sans-serif] text-[14px] text-black hover:text-[#71717a] transition-colors"
            >
              Explore
            </Link>
            <Link
              to="/designers"
              className="font-['Inter',sans-serif] text-[14px] text-black hover:text-[#71717a] transition-colors"
            >
              Designers
            </Link>
            <Link
              to="/floorplan3d"
              className="font-['Inter',sans-serif] text-[14px] text-black hover:text-[#71717a] transition-colors"
            >
              Layout Planner
            </Link>
            <div
              ref={triggerRef}
              className="relative flex items-center gap-1 cursor-pointer"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span className="font-['Inter',sans-serif] text-[14px] text-black">Design Tools</span>
              <svg
                className={`size-[18px] transition-transform duration-200 ${toolsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 18 18"
              >
                <path d={svgPaths.p2339ac00} fill="#676767" />
              </svg>

              {/* Dropdown mega menu */}
              <AnimatePresence>
              {toolsOpen && (
                <motion.div
                  ref={dropdownRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="fixed top-[75px] left-1/2 -translate-x-1/2 pt-2 z-50 w-[965px]"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                >
                  <motion.div
                    className="bg-white rounded-[20px] shadow-[0px_20px_60px_-10px_rgba(0,0,0,0.15)] border border-[#f0f0f0] px-4 py-4 flex gap-5 items-stretch w-[965px] h-[256px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    {/* Left text */}
                    <div className="flex flex-col justify-center min-w-[200px] max-w-[220px] shrink-0 pl-4">
                      <h3 className="font-['Inter',sans-serif] font-bold text-[22px] text-[#09090b] leading-[1.25] tracking-[-0.5px] mb-2">
                        Plan before you commit.
                      </h3>
                      <p className="font-['Inter',sans-serif] text-[13px] text-[#a1a1aa] leading-[1.55]">
                        Free tools to visualize your space and budget.
                      </p>
                    </div>

                    {/* Cards */}
                    <div className="flex gap-4 flex-1 h-full">
                      {/* Room Designer */}
                      <a
                        href="/render-tool"
                        className="group relative flex-1 rounded-[14px] overflow-hidden h-full block"
                      >
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1745429523617-0d837856ca35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwbGl2aW5nJTIwcm9vbSUyMGludGVyaW9yJTIwM0QlMjByZW5kZXJ8ZW58MXx8fHwxNzczMjI5MTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                          alt="Room Designer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5">
                          <h4 className="font-['Inter',sans-serif] font-semibold text-[14px] text-white leading-[1.3] mb-1">
                            Room Designer
                          </h4>
                          <p className="font-['Inter',sans-serif] text-[12px] text-white/75 leading-[1.45]">
                            Test different styles before committing to any designer.
                          </p>
                        </div>
                      </a>

                      {/* Renovation Cost Guide */}
                      <Link
                        to="/cost-guide"
                        className="group relative flex-1 rounded-[14px] overflow-hidden h-full block"
                      >
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1660594161043-28b49b363632?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW5vdmF0aW9uJTIwYnVkZ2V0JTIwY29zdCUyMGRvY3VtZW50cyUyMGRlc2t8ZW58MXx8fHwxNzczMjI5MTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                          alt="Renovation Cost Guide"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5">
                          <h4 className="font-['Inter',sans-serif] font-semibold text-[14px] text-white leading-[1.3] mb-1">
                            Renovation Cost Guide
                          </h4>
                          <p className="font-['Inter',sans-serif] text-[12px] text-white/75 leading-[1.45]">
                            Get an instant breakdown of what your budget
                          </p>
                        </div>
                      </Link>

                    </div>
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2 mr-[3px]">
          {/* Get Matched — hidden on mobile */}
          <div className="hidden md:block bg-[#f6f6f6] border border-white rounded-[100px] p-[7px]">
            <button
              onClick={() => navigate("/get-matched")}
              className="bg-[#09090b] text-white rounded-[100px] px-8 py-2 font-['Inter',sans-serif] font-medium text-[14px] tracking-[-0.7px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
            >
              Get Matched
            </button>
          </div>
          {/* Profile photo / Sign In */}
          {homeowner ? (
            <div ref={profileRef} className="relative hidden md:block">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-[40px] h-[40px] rounded-full overflow-hidden border-2 border-[#e5e7eb] hover:border-[#09090b] transition-colors cursor-pointer bg-[#09090b] flex items-center justify-center"
              >
                {homeowner.avatar ? (
                  <img src={homeowner.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-['Inter',sans-serif] font-bold text-[14px]">{initials}</span>
                )}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[52px] w-[220px] bg-white rounded-[14px] shadow-[0px_12px_40px_-8px_rgba(0,0,0,0.15)] border border-[#f0f0f0] overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[#f3f4f6]">
                      <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#09090b] truncate">{homeowner.name || "Homeowner"}</p>
                      <p className="font-['Inter',sans-serif] text-[12px] text-[#6A7282] truncate">{homeowner.email}</p>
                    </div>
                    <div className="py-1.5">
                      <button
                        onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left font-['Inter',sans-serif] text-[14px] text-[#09090b] hover:bg-[#f9fafb] transition-colors cursor-pointer"
                      >
                        <User size={16} className="text-[#6A7282]" /> My Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left font-['Inter',sans-serif] text-[14px] text-[#dc2626] hover:bg-[#fef2f2] transition-colors cursor-pointer"
                      >
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => navigate("/profile")}
              className="hidden md:block bg-[#f6f6f6] border border-[#e5e7eb] hover:bg-[#edeef0] text-[#09090b] rounded-[100px] px-6 py-2 font-['Inter',sans-serif] font-semibold text-[14px] tracking-[-0.5px] transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Mobile: profile photo (if signed in) + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {homeowner && (
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}
                className="w-[36px] h-[36px] rounded-full overflow-hidden border-2 border-[#e5e7eb] cursor-pointer bg-[#09090b] flex items-center justify-center"
              >
                {homeowner.avatar ? (
                  <img src={homeowner.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-['Inter',sans-serif] font-bold text-[12px]">{initials}</span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-[40px] h-[40px] rounded-full bg-[#f6f6f6] flex items-center justify-center cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} className="text-[#09090b]" /> : <Menu size={18} className="text-[#09090b]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden mt-2 mx-auto w-full bg-white rounded-[20px] shadow-[0px_20px_60px_-10px_rgba(0,0,0,0.15)] border border-[#f0f0f0] overflow-hidden"
          >
            {/* User info (if signed in) */}
            {homeowner && (
              <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden bg-[#09090b] flex items-center justify-center shrink-0">
                  {homeowner.avatar ? (
                    <img src={homeowner.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-['Inter',sans-serif] font-bold text-[12px]">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#09090b] truncate">{homeowner.name || "Homeowner"}</p>
                  <p className="font-['Inter',sans-serif] text-[12px] text-[#6A7282] truncate">{homeowner.email}</p>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <div className="py-2">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/explore"); }}
                className="w-full flex items-center justify-between px-5 py-3.5 font-['Inter',sans-serif] text-[15px] text-[#09090b] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                Explore <ArrowRight size={16} className="text-[#9ca3af]" />
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/designers"); }}
                className="w-full flex items-center justify-between px-5 py-3.5 font-['Inter',sans-serif] text-[15px] text-[#09090b] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                Designers <ArrowRight size={16} className="text-[#9ca3af]" />
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/floorplan3d"); }}
                className="w-full flex items-center justify-between px-5 py-3.5 font-['Inter',sans-serif] text-[15px] text-[#09090b] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                Layout Planner <ArrowRight size={16} className="text-[#9ca3af]" />
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/render-tool"); }}
                className="w-full flex items-center justify-between px-5 py-3.5 font-['Inter',sans-serif] text-[15px] text-[#09090b] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                Room Designer <ArrowRight size={16} className="text-[#9ca3af]" />
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/cost-guide"); }}
                className="w-full flex items-center justify-between px-5 py-3.5 font-['Inter',sans-serif] text-[15px] text-[#09090b] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                Renovation Cost Guide <ArrowRight size={16} className="text-[#9ca3af]" />
              </button>
            </div>

            {/* Bottom actions */}
            <div className="px-5 py-4 border-t border-[#f3f4f6] flex flex-col gap-2.5">
              {/* Get Matched CTA */}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/get-matched"); }}
                className="w-full bg-[#09090b] text-white rounded-[100px] py-3 font-['Inter',sans-serif] font-medium text-[14px] tracking-[-0.5px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] cursor-pointer"
              >
                Get Matched
              </button>
              {homeowner ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}
                    className="flex-1 bg-[#f6f6f6] text-[#09090b] rounded-[100px] py-3 font-['Inter',sans-serif] font-medium text-[14px] tracking-[-0.5px] cursor-pointer"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="bg-[#fef2f2] text-[#dc2626] rounded-[100px] px-5 py-3 font-['Inter',sans-serif] font-medium text-[14px] tracking-[-0.5px] cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}
                  className="w-full bg-[#f6f6f6] border border-[#e5e7eb] text-[#09090b] rounded-[100px] py-3 font-['Inter',sans-serif] font-semibold text-[14px] tracking-[-0.5px] cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}