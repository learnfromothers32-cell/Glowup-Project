import { motion } from "framer-motion";
import { Check, Clock, Sparkles } from "lucide-react";
import Section from "./Section";
import type { ServiceObject } from "./BookingModal";

interface ServiceStepProps {
  services: any[] | undefined;
  selectedService: ServiceObject | null;
  onSelect: (svc: ServiceObject) => void;
  active: boolean;
  completed: boolean;
}

export default function ServiceStep({ services, selectedService, onSelect, active, completed }: ServiceStepProps) {
  return (
    <Section
      id="section-service"
      number={1}
      title="Select a Service"
      subtitle="What would you like to book?"
      completed={completed}
      active={active}
      disabled={false}
      summary={selectedService?.name}
    >
      <div className="space-y-2.5 mt-1">
        {services
          ?.filter((s): s is ServiceObject => typeof s !== "string")
          .map((svc, i) => {
            const isSelected = selectedService?.name === svc.name;
            return (
              <motion.button
                key={svc.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                onClick={() => onSelect(svc)}
                className={`group w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-brand-500 bg-brand-50/80 dark:bg-brand-950/20 shadow-md shadow-brand-500/10"
                    : "border-gray-100 dark:border-gray-700/30 bg-white dark:bg-surface-dark-secondary hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isSelected
                      ? "border-brand-500 bg-brand-500 scale-110"
                      : "border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                  }`}
                >
                  {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
                    {svc.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-muted dark:text-text-dark-muted flex items-center gap-1">
                      <Clock size={10} className="opacity-60" />
                      {svc.duration}
                    </span>
                    {svc.popular && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                        <Sparkles size={9} />
                        Popular
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{svc.price}</p>
                </div>
              </motion.button>
            );
          })}
        {(!services || services.filter((s) => typeof s !== "string").length === 0) && (
          <div className="py-8 text-center">
            <p className="text-sm text-text-muted dark:text-text-dark-muted">No services available</p>
          </div>
        )}
      </div>
    </Section>
  );
}
