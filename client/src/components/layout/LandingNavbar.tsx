import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how" },
  { label: "Live", id: "live" },
  { label: "Reviews", id: "reviews" },
  { label: "Pricing", id: "pricing" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToSection = (id: string) => {
    setOpen(false);
    const scroll = () => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); window.history.pushState(null, "", `/#${id}`); }
    };
    if (location.pathname !== "/") { navigate("/", { state: { scrollTo: id } }); setTimeout(scroll, 300); }
    else { setTimeout(scroll, 50); }
  };

  const handleLogoClick = () => {
    setOpen(false);
    if (location.pathname === "/") { window.scrollTo({ top: 0, behavior: "smooth" }); }
    else { navigate("/"); }
  };

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-lg shadow-gray-200/20 dark:bg-surface-dark/80 dark:border-gray-700/40"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button onClick={handleLogoClick} className="flex items-center gap-3 group focus:outline-none" aria-label="Go to homepage">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_6px_20px_rgba(244,63,94,0.25)] transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_10px_28px_rgba(244,63,94,0.35)]">
                <div className="absolute inset-0 rounded-xl bg-white/10 blur-[6px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles size={16} className="text-white relative z-10 transition-transform duration-300 group-hover:rotate-6" />
              </div>
              <div className="flex items-end gap-1">
                <span className="font-['Syne'] font-extrabold text-[20px] leading-none tracking-[-0.02em] text-gray-900 dark:text-white">
                  Glow<span className="text-brand-500">Up</span>
                </span>
                <span className="w-[5px] h-[5px] rounded-full bg-brand-500 mb-[4px] opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => goToSection(link.id)}
                  className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white group"
                >
                  {link.label}
                  <span className="absolute left-4 right-4 bottom-0 h-0.5 bg-brand-500 scale-x-0 origin-left transition-transform group-hover:scale-x-100" />
                </button>
              ))}
            </nav>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary">
                Log in
              </Link>
              <Link
                to="/stylist/signup"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-lg transition-all shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/30 active:scale-[0.98]"
              >
                Get started
                <ArrowUpRight size={14} />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40 md:hidden" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-16 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 dark:bg-surface-dark/95 dark:border-gray-700 shadow-2xl md:hidden overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {NAV_LINKS.map((link) => (
                  <button key={link.id} onClick={() => goToSection(link.id)} className="block w-full text-left text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 transition-colors">
                    {link.label}
                  </button>
                ))}
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="space-y-3 pt-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="block w-full text-center text-base font-medium text-gray-700 dark:text-gray-300 py-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors">
                    Log in
                  </Link>
                  <Link to="/stylist/signup" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 w-full text-base font-semibold text-white bg-brand-500 hover:bg-brand-600 py-3 rounded-lg shadow-md shadow-brand-500/25 transition-all">
                    Get started <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
