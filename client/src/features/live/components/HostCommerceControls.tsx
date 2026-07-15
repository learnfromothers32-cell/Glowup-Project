import { useState } from "react";
import {
  Pin,
  PinOff,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { LiveService, LiveAvailability } from "@/domain/live/stores/commerceStore";

interface HostCommerceControlsProps {
  services: LiveService[];
  pinnedServiceId: string | null;
  shelfVisible: boolean;
  availability: LiveAvailability;
  onPinService: (serviceId: string) => void;
  onUnpinService: () => void;
  onToggleShelf: (visible: boolean) => void;
  onUpdateAvailability: (availability: LiveAvailability) => void;
  className?: string;
}

export function HostCommerceControls({
  services,
  pinnedServiceId,
  shelfVisible,
  availability,
  onPinService,
  onUnpinService,
  onToggleShelf,
  onUpdateAvailability,
  className,
}: HostCommerceControlsProps) {
  const [showServices, setShowServices] = useState(false);

  const pinnedService = pinnedServiceId
    ? services.find((s) => s._id === pinnedServiceId)
    : null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Pinned service display */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {pinnedService
            ? `Featured: ${pinnedService.name}`
            : "No featured service"}
        </span>
        {pinnedServiceId ? (
          <button
            onClick={onUnpinService}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Unpin service"
          >
            <PinOff size={14} />
          </button>
        ) : (
          <button
            onClick={() => setShowServices(!showServices)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
            title="Pin a service"
          >
            <Pin size={14} />
          </button>
        )}
      </div>

      {/* Service picker dropdown */}
      {showServices && !pinnedServiceId && (
        <div className="p-2 rounded-xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary max-h-[200px] overflow-y-auto">
          {services.map((service) => (
            <button
              key={service._id}
              onClick={() => {
                onPinService(service._id);
                setShowServices(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex justify-between"
            >
              <span className="text-gray-900 dark:text-gray-100 font-medium">{service.name}</span>
              <span className="text-gray-400">${service.price}</span>
            </button>
          ))}
        </div>
      )}

      {/* Shelf toggle + Availability */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleShelf(!shelfVisible)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            shelfVisible
              ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
          )}
        >
          <ShoppingBag size={12} />
          Shelf {shelfVisible ? "On" : "Off"}
        </button>

        <select
          value={availability}
          onChange={(e) => onUpdateAvailability(e.target.value as LiveAvailability)}
          className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-brand-500/40"
        >
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="fully-booked">Fully Booked</option>
          <option value="on-break">On Break</option>
          <option value="queue-only">Queue Only</option>
        </select>
      </div>
    </div>
  );
}
