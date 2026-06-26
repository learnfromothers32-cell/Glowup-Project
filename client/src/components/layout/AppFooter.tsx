import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Heart, Mail, ArrowUpRight } from "lucide-react";
import InstallInstructions from "../InstallInstructions";

const COMPANY_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Careers", to: "/careers" },
  { label: "Press", to: "/press-kit" },
  { label: "Blog", to: "/blog" },
];

const FEATURE_LINKS = [
  { label: "Queue Management", to: "/#queue" },
  { label: "Smart Booking", to: "/#booking" },
  { label: "Stylist Portfolio", to: "/#portfolio" },
  { label: "Live Streaming", to: "/#live" },
  { label: "Trending Feed", to: "/#trending" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", to: "/help" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact Us", to: "/contact" },
  { label: "Report an Issue", to: "/report" },
];

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SOCIAL_ICONS = [
  { name: "Instagram", icon: InstagramIcon, href: "#" },
  { name: "Facebook", icon: FacebookIcon, href: "#" },
  { name: "X", icon: XIcon, href: "#" },
  { name: "LinkedIn", icon: LinkedInIcon, href: "#" },
];

interface AppFooterProps {
  variant?: "landing" | "consumer";
}

export default function AppFooter({ variant = "landing" }: AppFooterProps) {
  const navigate = useNavigate();

  if (variant === "consumer") {
    return (
      <footer className="bg-surface-dark border-t border-gray-800/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="text-sm font-extrabold text-gray-200">GlowUp</span>
              </Link>
            </div>
            <p className="text-xs text-gray-500">&#169; {new Date().getFullYear()} GlowUp Technologies Ltd.</p>
          </div>
        </div>
      </footer>
    );
  }

  const handleHashNav = (to: string) => {
    if (to.startsWith("/#")) {
      const id = to.slice(2);
      if (window.location.pathname !== "/") {
        navigate("/", { state: { scrollTo: id } });
      } else {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      navigate(to);
    }
  };

  return (
    <footer className="bg-[#0a0a0d] border-t border-white/[0.04] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-brand-500/[0.02] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gold-500/[0.015] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 pt-16 pb-14 sm:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand + Newsletter (span 4) */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-xl font-extrabold text-brand-500">GlowUp</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">
              AI-Powered Beauty Platform — Connect with top stylists, book services, transform your look.
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              {SOCIAL_ICONS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-gray-500 hover:bg-brand-500 hover:text-white hover:scale-110 transition-all duration-200"
                >
                  <social.icon />
                </a>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-400 mb-2.5 tracking-wide">Stay updated</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-gray-300 placeholder:text-gray-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/10 focus:outline-none transition-all"
                />
                <button className="h-9 w-9 flex items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 hover:shadow-glow-sm transition-all duration-200">
                  <Mail size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Company (span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-gray-200 mb-5 tracking-widest uppercase">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleHashNav(link.to)}
                    className="text-sm text-gray-500 hover:text-brand-400 hover:translate-x-0.5 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Features (span 3) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold text-gray-200 mb-5 tracking-widest uppercase">Features</h4>
            <ul className="space-y-3">
              {FEATURE_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleHashNav(link.to)}
                    className="text-sm text-gray-500 hover:text-brand-400 hover:translate-x-0.5 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support + Download (span 3) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold text-gray-200 mb-5 tracking-widest uppercase">Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 hover:text-brand-400 hover:translate-x-0.5 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <InstallInstructions
              buttonClassName="mt-6 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-brand-500 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 hover:shadow-glow-sm active:scale-[0.98] transition-all duration-200"
            />

            <div className="mt-4 flex gap-2">
              <button className="flex-1 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1.5 hover:bg-white/[0.06] transition-all duration-200 group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-white transition-colors">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.98-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.14 4.48-3.74 4.25z" />
                </svg>
                <div className="text-left">
                  <p className="text-[7px] text-gray-600 group-hover:text-gray-400 leading-none transition-colors">Download on the</p>
                  <p className="text-[10px] font-semibold text-gray-300 group-hover:text-white leading-tight transition-colors">App Store</p>
                </div>
              </button>
              <button className="flex-1 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1.5 hover:bg-white/[0.06] transition-all duration-200 group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-white transition-colors">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.147 1.24a1 1 0 010 1.74l-2.147 1.24-2.53-2.53 2.53-2.69zM5.864 3.458L16.8 9.79l-2.302 2.302-8.634-8.634z" />
                </svg>
                <div className="text-left">
                  <p className="text-[7px] text-gray-600 group-hover:text-gray-400 leading-none transition-colors">Get it on</p>
                  <p className="text-[10px] font-semibold text-gray-300 group-hover:text-white leading-tight transition-colors">Google Play</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="pb-6 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &#169; {new Date().getFullYear()} GlowUp. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="text-xs text-gray-600 hover:text-brand-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-gray-600 hover:text-brand-400 transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="text-xs text-gray-600 hover:text-brand-400 transition-colors">Cookies</Link>
            <Link to="/refunds" className="text-xs text-gray-600 hover:text-brand-400 transition-colors">Refunds</Link>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            Made with <Heart size={10} className="text-brand-500" fill="#f43f5e" /> in Accra
          </div>
        </div>
      </div>
    </footer>
  );
}
