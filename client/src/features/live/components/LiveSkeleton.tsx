import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/Skeleton";

export function DiscoverSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", className)}
      role="status"
      aria-label="Loading live streams"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40"
        >
          <Skeleton className="aspect-[9/16] sm:aspect-video w-full rounded-none" aria-hidden="true" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" aria-hidden="true" />
            <Skeleton className="h-3 w-1/2" aria-hidden="true" />
            <Skeleton className="h-5 w-16 rounded-full" aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoomSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex h-full", className)}
      role="status"
      aria-label="Loading live room"
    >
      <div className="flex-1 bg-gray-900 flex items-center justify-center">
        <Skeleton className="w-16 h-16 rounded-full bg-gray-800" aria-hidden="true" />
      </div>
      <div className="w-80 border-l border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-4 space-y-3 hidden sm:flex flex-col">
        <Skeleton className="h-6 w-24" aria-hidden="true" />
        <div className="flex-1 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" aria-hidden="true" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-16" aria-hidden="true" />
                <Skeleton className="h-3 w-full" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" aria-hidden="true" />
      </div>
    </div>
  );
}
