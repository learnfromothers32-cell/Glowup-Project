import { Loader2 } from "lucide-react";
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
      summary={
        selectedTime
          ? fmtTimeLabel(selectedTime)
          : undefined
      }
    >
      <div className="mt-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-text-muted dark:text-text-dark-muted">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            <span className="text-sm">Checking availability…</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              {selectedDate ? "No available slots for this date" : "Select a date to see available times"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {([["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]] as const).map(([key, label]) => {
              const periodSlots = key === "morning" ? morning : key === "afternoon" ? afternoon : evening;
              if (periodSlots.length === 0) return null;
              return (
                <div key={key}>
                  <p className="text-[11px] font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider mb-2">
                    {label}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {periodSlots.map(({ time, available }) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => available && onSelect(time)}
                          disabled={!available}
                          className={`py-2.5 px-2 rounded-xl border text-center text-xs font-medium transition-all duration-200 ${
                            !available
                              ? "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : isSelected
                                ? "border-brand-500 bg-brand-500 text-white shadow-md active:bg-brand-500 active:text-white"
                                : "border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary hover:border-gray-200 dark:hover:border-gray-600"
                          }`}
                        >
                          {fmtTimeLabel(time)}
                          {!available && (
                            <span className="block text-[9px] text-gray-300 dark:text-gray-600 mt-0.5">Booked</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
