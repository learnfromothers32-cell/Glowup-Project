import { Star, MapPin, Sparkles, Calendar, Clock, CheckCircle2 } from "lucide-react";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";
import type { ServiceObject } from "./BookingModal";

interface BookingState {
  selectedService: ServiceObject | null;
  selectedDate: string | null;
  selectedTime: string | null;
}

function fmtTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SelectionRow({
  icon: Icon,
  label,
  value,
  selected,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string | null;
  selected: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
          selected ? "bg-brand-500 text-white shadow-sm shadow-brand-200 dark:shadow-brand-900/40" : "bg-gray-100 dark:bg-gray-800/60 text-text-muted dark:text-text-dark-muted"
        }`}
      >
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
          {label}
        </p>
        {value ? (
          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary mt-px truncate">{value}</p>
        ) : (
          <p className="text-xs text-text-muted dark:text-text-dark-muted mt-px">—</p>
        )}
      </div>
    </div>
  );
}

export default function LiveSummary({
  stylist,
  state,
}: {
  stylist: Stylist;
  state: BookingState;
}) {
  const selections = [
    { icon: Sparkles, label: "Service", value: state.selectedService?.name ?? null, selected: !!state.selectedService },
    { icon: Calendar, label: "Date", value: state.selectedDate ? formatShortDate(state.selectedDate) : null, selected: !!state.selectedDate },
    { icon: Clock, label: "Time", value: state.selectedTime ? fmtTime(state.selectedTime) : null, selected: !!state.selectedTime },
  ];

  const allSelected = selections.every((s) => s.selected);
  const count = selections.filter((s) => s.selected).length;

  return (
    <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/30 overflow-hidden shadow-sm">
      {/* Stylist card */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700/20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 ring-2 ring-white dark:ring-gray-800 shrink-0 shadow-sm">
            {stylist.image ? (
              <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm">✂️</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary truncate">{stylist.name}</p>
            <div className="flex items-center gap-1 text-[11px] text-text-muted dark:text-text-dark-muted mt-0.5">
              {stylist.rating && (
                <span className="flex items-center gap-0.5">
                  <Star size={9} fill="#d4a76a" stroke="#d4a76a" />
                  <span className="font-medium text-amber-600 dark:text-amber-400">{stylist.rating}</span>
                </span>
              )}
              {stylist.location && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin size={8} />
                    {getLocationString(stylist.location)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selections */}
      <div className="p-4 space-y-3">
        {selections.map((sel) => (
          <SelectionRow key={sel.label} {...sel} />
        ))}
      </div>

      {/* Progress + Total */}
      <div className="px-4 py-3.5 bg-gradient-to-b from-gray-50/50 to-gray-50/80 dark:from-surface-dark-tertiary/30 dark:to-surface-dark-tertiary/50 border-t border-gray-100 dark:border-gray-700/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider">
            Progress
          </span>
          <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">{count}/3</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700/50 mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${(count / 3) * 100}%` }}
          />
        </div>

        {allSelected && state.selectedService ? (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary">Total</span>
            </div>
            <span className="text-base font-extrabold text-text-primary dark:text-text-dark-primary">{state.selectedService.price}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-muted dark:text-text-dark-muted">Complete all steps</span>
            <span className="text-[10px] text-text-muted dark:text-text-dark-muted">to see total</span>
          </div>
        )}
      </div>
    </div>
  );
}
