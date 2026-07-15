import { Star, BadgeCheck, Users } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import type { LiveStylistProfile, LiveAvailability } from "@/domain/live/stores/commerceStore";

interface StylistInfoPanelProps {
  profile: LiveStylistProfile;
  availability: LiveAvailability;
  onBook: () => void;
  onJoinQueue: () => void;
  onFollow: () => void;
  className?: string;
}

const availabilityConfig: Record<
  LiveAvailability,
  { label: string; color: string; dot: string }
> = {
  available: {
    label: "Available",
    color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50",
    dot: "bg-emerald-500",
  },
  busy: {
    label: "Busy",
    color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200/50",
    dot: "bg-amber-500",
  },
  "fully-booked": {
    label: "Fully Booked",
    color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200/50",
    dot: "bg-red-500",
  },
  "on-break": {
    label: "On Break",
    color: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200/50",
    dot: "bg-gray-400",
  },
  "queue-only": {
    label: "Queue Only",
    color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200/50",
    dot: "bg-blue-500",
  },
};

export function StylistInfoPanel({
  profile,
  availability,
  onBook,
  onJoinQueue,
  onFollow,
  className,
}: StylistInfoPanelProps) {
  const avail = availabilityConfig[availability];

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-4",
        className,
      )}
      role="region"
      aria-label={`Stylist: ${profile.name}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
          {profile.image ? (
            <img
              src={profile.image}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400" aria-hidden="true">
              {profile.name[0]}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {profile.name}
            </h3>
            {profile.isVerified && (
              <BadgeCheck size={14} className="text-brand-500 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              {profile.rating > 0 ? profile.rating.toFixed(1) : "New"}
            </span>
            {profile.reviewCount > 0 && (
              <span>({profile.reviewCount})</span>
            )}
            <span className="flex items-center gap-1">
              <Users size={11} />
              {profile.followerCount}
            </span>
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              avail.color,
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", avail.dot)} />
            {avail.label}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={onBook}
          disabled={availability === "on-break" || availability === "fully-booked"}
          aria-label={`Book appointment with ${profile.name}`}
        >
          Book
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={onJoinQueue}
          disabled={availability === "on-break"}
          aria-label={`Join queue for ${profile.name}`}
        >
          Join Queue
        </Button>
      </div>

      <button
        onClick={onFollow}
        aria-label={profile.isFollowing ? `Unfollow ${profile.name}` : `Follow ${profile.name}`}
        aria-pressed={profile.isFollowing}
        className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
      >
        {profile.isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}
