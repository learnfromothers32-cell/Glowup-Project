import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Shield, Sparkles, Smartphone } from "lucide-react";
import { IMAGES } from "../../config/images";

export default function Hero() {
  const navigate = useNavigate();
  const [showInstall, setShowInstall] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white dark:from-surface-dark dark:via-surface-dark dark:to-surface-dark">
      {/* Background gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-100/30 dark:bg-brand-950/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-brand-50/50 dark:bg-brand-950/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-gold-100/20 dark:bg-gold-900/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_540px] lg:items-center lg:gap-16">
          {/* Left — Copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-4 py-1.5 dark:border-brand-800/40 dark:bg-brand-950/20 mb-6 backdrop-blur-sm">
              <Sparkles size={14} className="text-brand-500 animate-pulse-soft" />
              <span className="text-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400">
                AI beauty matching is now live
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-text-primary dark:text-text-dark-primary">
              Where beauty meets{" "}
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 bg-clip-text text-transparent">
                intelligence.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-text-secondary dark:text-text-dark-secondary leading-relaxed">
              Discover verified stylists, get AI-powered matches, and earn rewards — the premium platform for modern beauty.
            </p>

            {/* Buttons: mobile stacked, desktop row */}
            <div className="mt-8 flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-1 sm:gap-3">
                <button
                  onClick={() => navigate("/signup")}
                  className="inline-flex h-12 sm:h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 text-sm font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 sm:flex-1"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => setShowInstall((v) => !v)}
                  className="inline-flex h-12 sm:h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 sm:flex-1"
                >
                  <Smartphone size={16} />
                  Download App
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex h-12 sm:h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary px-5 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 sm:flex-1"
                >
                  Sign In
                </button>
              </div>
            </div>
            {/* Instructions panel - full width below buttons */}
            {showInstall && (
              <div className="mt-3 text-left w-full">
                <div className="rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700 px-4 py-3.5 shadow-sm">
                  <p className="text-[11px] font-bold text-gray-700 dark:text-white/90 uppercase tracking-wider text-center sm:text-left">How to install</p>
                  <ol className="mt-2 space-y-1.5 text-[12px] text-gray-600 dark:text-white/80">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold shrink-0">1.</span>
                      <span>Open glowup.app in your browser (Chrome, Safari, or Edge)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold shrink-0">2.</span>
                      <span>
                        Tap the browser menu <span className="text-gray-500 font-bold text-sm leading-none">&#8942;</span> or look for the install icon in the address bar
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold shrink-0">3.</span>
                      <span>
                        Select <span className="font-semibold text-gray-800 dark:text-white">&ldquo;Install&rdquo;</span> or <span className="font-semibold text-gray-800 dark:text-white">&ldquo;Add to Home Screen&rdquo;</span>
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {IMAGES.heroUsers.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`User ${i + 1}`}
                    className="h-8 w-8 rounded-full border-2 border-white dark:border-surface-dark object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#f43f5e" className="text-brand-500" />
                  ))}
                </div>
                <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
                  Loved by 10K+ clients
                </p>
              </div>
            </div>
          </div>

          {/* Right — Hero image */}
          <div className="relative lg:ml-auto w-full max-w-lg">
            <div className="relative rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
              <img
                src={IMAGES.hero}
                alt="Beauty salon styling session"
                className="w-full h-auto aspect-[5/6] sm:aspect-[4/5] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 shadow-lg px-3 py-2 flex items-center gap-2 animate-float">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield size={14} className="text-success" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-primary dark:text-text-dark-primary">Verified</p>
                <p className="text-[9px] text-text-muted">All stylists</p>
              </div>
            </div>

            <div className="absolute -bottom-3 -left-3 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 shadow-lg px-3 py-2 flex items-center gap-2 animate-float-delay">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                <Star size={14} className="text-brand-500" fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-primary dark:text-text-dark-primary">4.9 Rating</p>
                <p className="text-[9px] text-text-muted">10K+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
