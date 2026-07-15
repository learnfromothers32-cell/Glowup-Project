import { cn } from "@/utils/cn";
import { Clock, Tag } from "lucide-react";
import type { LiveService } from "@/domain/live/stores/commerceStore";

interface ServiceCardProps {
  service: LiveService;
  onBook?: (service: LiveService) => void;
  isPinned?: boolean;
  compact?: boolean;
  className?: string;
}

export function ServiceCard({
  service,
  onBook,
  isPinned,
  compact,
  className,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all",
        isPinned
          ? "border-brand-200 dark:border-brand-800/40 bg-brand-50/30 dark:bg-brand-900/10 shadow-sm"
          : "border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      {isPinned && (
        <span className="absolute -top-2 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500 text-white">
          Featured
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              "font-semibold text-gray-900 dark:text-gray-100 truncate",
              compact ? "text-sm" : "text-base",
            )}
          >
            {service.name}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Tag size={11} />
              {service.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock size={11} />
              {service.duration}m
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${service.price}
          </p>
        </div>
      </div>

      {onBook && (
        <button
          onClick={() => onBook(service)}
          className={cn(
            "mt-3 w-full py-2 rounded-lg text-sm font-semibold transition-all",
            isPinned
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100",
          )}
        >
          Book Now
        </button>
      )}
    </div>
  );
}

interface ServiceShowcaseProps {
  services: LiveService[];
  pinnedServiceId?: string | null;
  onBookService?: (service: LiveService) => void;
  className?: string;
}

export function ServiceShowcase({
  services,
  pinnedServiceId,
  onBookService,
  className,
}: ServiceShowcaseProps) {
  if (services.length === 0) return null;

  const pinned = pinnedServiceId
    ? services.find((s) => s._id === pinnedServiceId)
    : null;
  const others = pinnedServiceId
    ? services.filter((s) => s._id !== pinnedServiceId)
    : services;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Services
      </h3>

      {pinned && (
        <ServiceCard
          service={pinned}
          onBook={onBookService}
          isPinned
        />
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {others.map((service) => (
          <ServiceCard
            key={service._id}
            service={service}
            onBook={onBookService}
            compact
          />
        ))}
      </div>
    </div>
  );
}
