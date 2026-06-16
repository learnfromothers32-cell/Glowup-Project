import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
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
      <div className="space-y-2 mt-2">
        {services
          ?.filter((s): s is ServiceObject => typeof s !== "string")
          .map((svc, i) => {
            const isSelected = selectedService?.name === svc.name;
            return (
              <motion.button
                key={svc.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelect(svc)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  isSelected ? "border-gray-900 bg-gray-50 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-white"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                  {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {svc.duration}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0">{svc.price}</p>
              </motion.button>
            );
          })}
      </div>
    </Section>
  );
}
