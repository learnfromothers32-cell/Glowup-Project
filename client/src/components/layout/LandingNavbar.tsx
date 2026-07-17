import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", id: "features", primary: true },
  { label: "How It Works", id: "how", primary: true },
  { label: "Portfolio", id: "portfolio", primary: true },
  { label: "Queue", id: "queue", primary: true },
];

const MORE_LINKS = [
  { label: "Reviews", id: "testimonials" },
  { label: "Services", id: "services" },
  { label: "Booking", id: "booking" },
  { label: "Trending", id: "trending" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const ids = [...NAV_LINKS, ...MORE_LINKS];
      for (const link of ids) {
        const el = document.getElementById(link.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveId(link.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setOpen(false);
    setMoreOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [location, navigate]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 dark:bg-surface-dark/85 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.03)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-glow">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-[22px] font-extrabold tracking-tight text-brand-500 transition-colors group-hover:text-brand-600">
                GlowUp
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 group"
                >
                  <span className={`relative z-10 transition-colors duration-200 ${
                    activeId === link.id
                      ? "text-brand-500"
                      : "text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200"
                  }`}>
                    {link.label}
                  </span>
                  {activeId === link.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300" />
                  )}
                </button>
              ))}

              {/* More dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-0.5 group ${
                    MORE_LINKS.some((l) => l.id === activeId)
                      ? "text-brand-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span className="group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">More</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${
                      moreOpen ? "rotate-180" : ""
                    } group-hover:text-gray-800 dark:group-hover:text-gray-200`}
                  />
                  {MORE_LINKS.some((l) => l.id === activeId) && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
                  )}
                </button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-surface-dark-secondary rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1.5 z-50 animate-scale-in origin-top-right">
                      {MORE_LINKS.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => scrollTo(link.id)}
                          className={`w-full flex items-center px-4 py-2.5 text-sm text-left transition-all duration-150 ${
                            activeId === link.id
                              ? "text-brand-500 bg-brand-50/60 dark:bg-brand-950/20 font-medium"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Desktop CTA buttons */}
            <div className="hidden lg:flex items-center gap-2.5">
              <button
                onClick={() => navigate("/login")}
                className="h-9 px-4 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="h-9 px-4 rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? (
                <X size={22} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu size={22} className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/15 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-[80%] max-w-sm bg-white dark:bg-surface-dark shadow-2xl flex flex-col animate-slide-left">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <span className="font-display text-lg font-bold text-gray-800 dark:text-gray-200">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
              {[...NAV_LINKS, ...MORE_LINKS].map((link, i) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="w-full flex items-center gap-3 py-3 px-3.5 text-sm font-medium rounded-lg transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                >
                  <span className={`transition-colors ${
                    activeId === link.id
                      ? "text-brand-500 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:text-brand-500"
                  }`}>
                    {link.label}
                  </span>
                  {activeId === link.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-4 pb-6 pt-2 space-y-2 border-t border-gray-100 dark:border-gray-800/60">
              <button
                onClick={() => { setOpen(false); navigate("/login"); }}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: "300ms", animationFillMode: "both" }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/signup"); }}
                className="w-full h-10 rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: "350ms", animationFillMode: "both" }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-left {
          animation: slideLeft 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-in {
          animation: scaleIn 0.15s ease-out forwards;
        }
      `}</style>
    </>
  );
}
