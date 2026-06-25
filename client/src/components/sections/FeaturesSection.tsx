import { Calendar, Brain, CreditCard, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Book Stylists",
    desc: "Find and book verified beauty professionals in your area. Real-time availability, instant confirmation.",
    color: "text-brand-500",
    bg: "bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/30 dark:to-brand-900/20",
    border: "group-hover:border-brand-200 dark:group-hover:border-brand-800/50",
  },
  {
    icon: Brain,
    title: "AI Recommendations",
    desc: "Our AI matches you with the perfect stylist based on your preferences, hair type, and budget.",
    color: "text-stylist-500",
    bg: "bg-gradient-to-br from-stylist-50 to-stylist-100/50 dark:from-stylist-950/30 dark:to-stylist-900/20",
    border: "group-hover:border-stylist-200 dark:group-hover:border-stylist-800/50",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Pay securely in-app. No cash needed. Automatic receipts and loyalty point tracking.",
    color: "text-gold-600",
    bg: "bg-gradient-to-br from-gold-50 to-gold-100/50 dark:from-gold-900/20 dark:to-gold-800/15",
    border: "group-hover:border-gold-200 dark:group-hover:border-gold-800/50",
  },
  {
    icon: Users,
    title: "Real-time Queue",
    desc: "See live wait times and queue positions. No more guessing when your appointment is up.",
    color: "text-success",
    bg: "bg-gradient-to-br from-success/5 to-success/10 dark:from-success/10 dark:to-success/5",
    border: "group-hover:border-success/30 dark:group-hover:border-success/20",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-label mb-3">Features</span>
          <h2 className="section-heading">
            Everything you need,{" "}
            <span className="text-brand-500">in one app</span>
          </h2>
          <p className="mt-4 section-subheading mx-auto">
            From booking to payment, GlowUp handles the entire beauty experience with smart technology.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-6 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 ${f.border}`}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} transition-transform duration-300 group-hover:scale-110`}>
                <f.icon size={22} className={f.color} />
              </div>
              <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
