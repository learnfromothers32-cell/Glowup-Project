import { cn } from "@/utils/cn";
import type { LiveAvailability } from "@/domain/live/stores/commerceStore";

const config: Record<
  LiveAvailability,
  { label: string; bg: string; dot: string }
> = {
  available: { label: "Available", bg: "bg-emerald-50 dark:bg-emerald-900/20", dot: "bg-emerald-500" },
  busy: { label: "Busy", bg: "bg-amber-50 dark:bg-amber-900/20", dot: "bg-amber-500" },
  "fully-booked": { label: "Fully Booked", bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500" },
  "on-break": { label: "On Break", bg: "bg-gray-100 dark:bg-gray-800", dot: "bg-gray-400" },
  "queue-only": { label: "Queue Only", bg: "bg-blue-50 dark:bg-blue-900/20", dot: "bg-blue-500" },
};

interface LiveAvailabilityProps {
  availability: LiveAvailability;
  className?: string;
}

export function LiveAvailability({ availability, className }: LiveAvailabilityProps) {
  const c = config[availability];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
        c.bg,
        className,
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

interface ProductShelfProps {
  className?: string;
}

export function ProductShelf({ className }: ProductShelfProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-4",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Products
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-center"
          >
            <div className="w-full aspect-square rounded-md bg-gray-200 dark:bg-gray-700 mb-2" />
            <p className="text-[10px] text-gray-400 font-medium">Coming Soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
