import { cn } from "@/utils/cn";

interface LiveBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LiveBadge({ className, size = "md" }: LiveBadgeProps) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[9px] gap-1",
    md: "px-2 py-1 text-[10px] gap-1.5",
    lg: "px-3 py-1.5 text-xs gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-wider rounded-full",
        "bg-red-500 text-white border border-red-400",
        sizeClasses[size],
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      LIVE
    </span>
  );
}

interface ViewerCountProps {
  count: number;
  className?: string;
}

export function ViewerCount({ count, className }: ViewerCountProps) {
  const formatted =
    count >= 1_000_000
      ? `${(count / 1_000_000).toFixed(1)}M`
      : count >= 1_000
        ? `${(count / 1_000).toFixed(1)}K`
        : String(count);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "bg-black/50 text-white text-xs font-semibold backdrop-blur-sm",
        className,
      )}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {formatted}
    </span>
  );
}

interface StreamInfoProps {
  title: string;
  stylistName: string;
  stylistAvatar?: string;
  category?: string;
  className?: string;
}

export function StreamInfo({
  title,
  stylistName,
  stylistAvatar,
  category,
  className,
}: StreamInfoProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
        {stylistAvatar ? (
          <img
            src={stylistAvatar}
            alt={stylistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
            {stylistName[0]}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-white truncate">{title}</h2>
        <p className="text-xs text-white/60 truncate">{stylistName}</p>
        {category && (
          <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {category}
          </span>
        )}
      </div>
    </div>
  );
}
