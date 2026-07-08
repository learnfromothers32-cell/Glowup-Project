import { motion } from "framer-motion";
import { Loader2, Clock } from "lucide-react";
import Section from "./Section";

interface SlotInfo {
  time: string;
  available: boolean;
}

function fmtTimeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getPeriod(time: string): "morning" | "afternoon" | "evening" {
  const h = parseInt(time.split(":")[0], 10);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const PERIOD_META = {
  morning: { label: "Morning", icon: "🌅", range: "Before 12PM" },
  afternoon: { label: "Afternoon", icon: "☀️", range: "12PM - 5PM" },
  evening: { label: "Evening", icon: "🌙", range: "After 5PM" },
} as const;

interface TimeStepProps {
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  loading: boolean;
  slots: SlotInfo[];
  active: boolean;
  completed: boolean;
  disabled: boolean;
}

export default function TimeStep({
  selectedDate,
  selectedTime,
  onSelect,
  loading,
  slots,
  active,
  completed,
  disabled,
}: TimeStepProps) {
  const morning = slots.filter((s) => getPeriod(s.time) === "morning");
  const afternoon = slots.filter((s) => getPeriod(s.time) === "afternoon");
  const evening = slots.filter((s) => getPeriod(s.time) === "evening");

  return (
    <Section
      id="section-time"
      number={3}
      title="Choose a Time"
      subtitle={selectedDate ? formatShortDate(selectedDate) : "Select a date first"}
      completed={completed}
      active={active}
      disabled={disabled}
      summary={selectedTime ? fmtTimeLabel(selectedTime) : undefined}
    >
      <div className="mt-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-muted dark:text-text-dark-muted gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-gray-100 dark:border-gray-700" />
              <Loader2 className="absolute inset-0 animate-spin h-full w-full text-brand-500" strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">Checking availability</p>
              <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">Loading available time slots…</p>
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
              {selectedDate ? "No available slots" : "Select a date first"}
            </p>
            <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
              {selectedDate
                ? "All time slots for this date are booked"
                : "Pick a date above to see available times"}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {([["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]] as const).map(
              ([key, label]) => {
                const periodSlots =
                  key === "morning" ? morning : key === "afternoon" ? afternoon : evening;
                if (periodSlots.length === 0) return null;
                const meta = PERIOD_META[key];
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-sm">{meta.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider">
                          {label}
                        </p>
                        <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{meta.range}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {periodSlots.map(({ time, available }, idx) => {
                        const isSelected = selectedTime === time;
                        return (
                          <motion.button
                            key={time}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02, duration: 0.15 }}
                            onClick={() => available && onSelect(time)}
                            disabled={!available}
                            className={`relative py-3 px-2 rounded-2xl border-2 text-center text-xs font-semibold transition-all duration-200 ${
                              !available
                                ? "border-gray-50 dark:border-gray-700/20 bg-gray-50/80 dark:bg-surface-dark-tertiary/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                : isSelected
                                  ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                                  : "border-gray-100 dark:border-gray-700/30 bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
                            }`}
                          >
                            <span className="block">{fmtTimeLabel(time)}</span>
                            {!available && (
                              <span className="block text-[8px] text-gray-300 dark:text-gray-600 mt-0.5 font-medium uppercase tracking-wider">
                                Booked
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              },
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
