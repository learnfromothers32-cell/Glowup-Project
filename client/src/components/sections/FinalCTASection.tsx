import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Download } from "lucide-react";

interface FinalCTAProps {
  onOpenInstall?: () => void;
}

export default function FinalCTASection({ onOpenInstall }: FinalCTAProps) {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 mb-6">
          <Sparkles size={14} className="text-white" />
          <span className="text-xs font-semibold text-white/90">Join 10,000+ beauty lovers</span>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Ready to transform{" "}
          <br className="hidden sm:block" />
          your look?
        </h2>

        <p className="mt-5 text-lg text-white/80 max-w-lg mx-auto leading-relaxed">
          Join GlowUp today and connect with Ghana's top beauty professionals. Your perfect look is just a tap away.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/signup")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-brand-600 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Get Started Free
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate("/stylist/signup")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-8 text-sm font-semibold text-white hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Join as Stylist
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm text-white/60 mb-3">Or download the app for easier access</p>
          <button
            onClick={onOpenInstall}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-8 text-sm font-bold text-white hover:bg-white/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Download size={16} />
            Download App
          </button>
        </div>

        <p className="mt-6 text-xs text-white/50">
          No credit card required · Free forever on Starter · Cancel anytime
        </p>
      </div>
    </section>
  );
}
