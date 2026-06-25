import { useEffect, useRef, useState } from "react";
import { Users, UserCheck, Sparkles, Heart } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const STATS = [
  { icon: Users, value: 500, suffix: "+", label: "Verified Stylists", color: "text-brand-500", bg: "bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/30 dark:to-brand-900/20" },
  { icon: UserCheck, value: 50, suffix: "K+", label: "Happy Clients", color: "text-stylist-500", bg: "bg-gradient-to-br from-stylist-50 to-stylist-100/50 dark:from-stylist-950/30 dark:to-stylist-900/20" },
  { icon: Sparkles, value: 120, suffix: "K+", label: "Transformations", color: "text-gold-600", bg: "bg-gradient-to-br from-gold-50 to-gold-100/50 dark:from-gold-900/20 dark:to-gold-800/15" },
  { icon: Heart, value: 250, suffix: "K+", label: "Total Likes", color: "text-error", bg: "bg-gradient-to-br from-error-light/50 to-error-light/30 dark:from-error/10 dark:to-error/5" },
];

export default function StatsSection() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-label mb-3">By The Numbers</span>
          <h2 className="section-heading">
            Trusted across{" "}
            <span className="text-brand-500">Ghana</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-6 text-center transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-gray-200 dark:hover:border-gray-700"
            >
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${s.bg} transition-transform duration-300 group-hover:scale-110`}>
                <s.icon size={22} className={s.color} />
              </div>
              <p className={`text-3xl sm:text-4xl font-extrabold ${s.color}`}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm font-medium text-text-secondary dark:text-text-dark-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
