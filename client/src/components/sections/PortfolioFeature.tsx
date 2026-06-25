import { Heart, Eye, ArrowLeftRight, Star } from "lucide-react";

const TRANSFORMATIONS = [
  { before: "https://picsum.photos/seed/before1/200/200", after: "https://picsum.photos/seed/after1/200/200", likes: 342, views: "2.1K", service: "Braids", rating: 4.9 },
  { before: "https://picsum.photos/seed/before2/200/200", after: "https://picsum.photos/seed/after2/200/200", likes: 218, views: "1.5K", service: "Cornrows", rating: 4.8 },
  { before: "https://picsum.photos/seed/before3/200/200", after: "https://picsum.photos/seed/after3/200/200", likes: 567, views: "4.2K", service: "Full Glam", rating: 5.0 },
];

export default function PortfolioFeature() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <span className="section-label mb-3" style={{ color: "#d4a76a" }}>Portfolio</span>
            <h2 className="section-heading leading-tight">
              Showcase your{" "}
              <span style={{ color: "#d4a76a" }}>transformations</span>
            </h2>
            <p className="mt-4 section-subheading">
              Stylists display their best before & after work. Swipe through transformations, see service details, and discover your next look.
            </p>
            <div className="mt-6 space-y-3">
              {["Swipeable before/after carousel", "See likes and view counts", "Service details on each transformation", "Get inspired by real results"].map((b) => (
                <div key={b} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                  </div>
                  <span className="text-sm text-text-secondary dark:text-text-dark-secondary">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup - Transformation Cards */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-gold-50 to-gold-100/50 dark:from-gold-950/30 dark:to-gold-900/20 p-8 shadow-[0_20px_60px_rgba(212,167,106,0.06)]">
              <div className="space-y-4">
                {TRANSFORMATIONS.map((t) => (
                  <div key={t.service} className="mx-auto max-w-sm rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-card-hover transition-shadow duration-300">
                    {/* Before / After */}
                    <div className="grid grid-cols-2 h-36 relative">
                      <div className="relative overflow-hidden">
                        <img src={t.before} alt="Before" className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/10" />
                        <span className="absolute top-2 left-2 text-[9px] font-bold text-white bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 uppercase tracking-wider">Before</span>
                      </div>
                      <div className="relative overflow-hidden">
                        <img src={t.after} alt="After" className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/10" />
                        <span className="absolute top-2 right-2 text-[9px] font-bold text-white bg-brand-500/80 backdrop-blur-sm rounded-full px-2 py-0.5 uppercase tracking-wider">After</span>
                      </div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700">
                        <ArrowLeftRight size={12} className="text-gold-500" />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{t.service}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={9} fill="#d4a76a" className="text-gold-500" />
                            <span className="text-[10px] font-semibold text-gold-600">{t.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart size={11} className="text-brand-500" fill="#f43f5e" />
                            <span className="text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary">{t.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={11} className="text-text-muted dark:text-text-dark-muted" />
                            <span className="text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary">{t.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
