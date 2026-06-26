import { Heart, Star } from "lucide-react";
import { IMAGES } from "../../config/images";

const TRANSFORMATIONS = [
  { image: IMAGES.portfolio[0], likes: 342, service: "Box Braids", rating: 4.9, stylist: "Ama K." },
  { image: IMAGES.portfolio[1], likes: 567, service: "Cornrows", rating: 5.0, stylist: "Esi M." },
  { image: IMAGES.portfolio[2], likes: 218, service: "Bridal Glam", rating: 4.8, stylist: "Naa A." },
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
              Stylists display their best work. Browse real transformations, see service details, and discover your next look.
            </p>
            <div className="mt-6 space-y-3">
              {["Browse stylist portfolios", "See likes and ratings", "Service details on each look", "Get inspired by real results"].map((b) => (
                <div key={b} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                  </div>
                  <span className="text-sm text-text-secondary dark:text-text-dark-secondary">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Minimalist cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TRANSFORMATIONS.map((t) => (
              <div
                key={t.service}
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={t.image}
                    alt={t.service}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[11px] font-medium text-white/70 tracking-wide">{t.stylist}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{t.service}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={10} fill="#d4a76a" className="text-gold-400" />
                      <span className="text-[11px] font-semibold text-white">{t.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={10} className="text-white/80" fill="#f43f5e" />
                      <span className="text-[11px] font-medium text-white/80">{t.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
