import { Check, Star, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IMAGES } from "../../config/images";

const SERVICES = [
  { name: "Box Braids", duration: "3 hrs", price: 250, rating: 4.9, category: "Braids", popular: true, image: IMAGES.pricing[0] },
  { name: "Fade Cut", duration: "45 min", price: 80, rating: 4.8, category: "Barber", popular: false, image: IMAGES.pricing[1] },
  { name: "Bridal Makeup", duration: "2 hrs", price: 800, rating: 5.0, category: "Makeup", popular: true, image: IMAGES.pricing[2] },
  { name: "Gel Nails", duration: "1 hr", price: 150, rating: 4.7, category: "Nails", popular: false, image: IMAGES.pricing[3] },
  { name: "Facial Treatment", duration: "1.5 hrs", price: 300, rating: 4.9, category: "Skincare", popular: false, image: IMAGES.pricing[4] },
  { name: "Cornrows", duration: "2 hrs", price: 200, rating: 4.8, category: "Braids", popular: false, image: IMAGES.pricing[5] },
];

const FEATURES = ["Transparent pricing", "No hidden fees", "Pay in GHS", "Instant booking"];

export default function PricingFeature() {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-label mb-3" style={{ color: "#d4a76a" }}>Services & Pricing</span>
          <h2 className="section-heading">
            Browse services,{" "}
            <span style={{ color: "#d4a76a" }}>compare prices</span>
          </h2>
          <p className="mt-4 section-subheading mx-auto">
            See all available services with transparent pricing. No surprises, no hidden fees.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.name}
              className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-gray-200 dark:hover:border-gray-700"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="h-10 w-10 rounded-xl object-cover"
                      loading="lazy"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600">{s.category}</span>
                      <h3 className="text-base font-bold text-text-primary dark:text-text-dark-primary">{s.name}</h3>
                    </div>
                  </div>
                  {s.popular && (
                    <div className="flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-950/30 px-2 py-1">
                      <Zap size={9} fill="#f43f5e" className="text-brand-500" />
                      <span className="text-[8px] font-bold text-brand-500">Popular</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-text-muted dark:text-text-dark-muted" />
                    <span className="text-[11px] text-text-secondary dark:text-text-dark-secondary">{s.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={11} fill="#d4a76a" className="text-gold-500" />
                    <span className="text-[11px] font-bold text-text-secondary dark:text-text-dark-secondary">{s.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-gold-600">GH₵{s.price}</span>
                  <button
                    onClick={() => navigate("/signup")}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-[11px] font-bold text-white hover:bg-brand-600 hover:shadow-glow-sm transition-all duration-200"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-sm text-text-secondary dark:text-text-dark-secondary">
              <Check size={14} className="text-success" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
