import { useState, useEffect, useCallback } from "react";
import { Users, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { getQueueStatus } from "@/api/queue";
import { connectQueue, subscribeToQueue, getQueueSocket } from "@/services/socket";

interface QueueWidgetProps {
  stylistId: string;
  className?: string;
}

interface QueueData {
  currentPosition: number;
  predictedWaitMins: number;
  entries: { userId: string; position: number; status: string; estimatedWaitMins: number }[];
}

export function QueueWidget({ stylistId, className }: QueueWidgetProps) {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [myPosition, setMyPosition] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getQueueStatus(stylistId)
      .then((data) => {
        if (mounted) {
          setQueueData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
          setError("Could not load queue status");
        }
      });

    connectQueue();
    subscribeToQueue(stylistId);

    const handleUpdate = (data: any) => {
      if (data?.stylistId === stylistId) {
        setQueueData(data);
        setError(null);
      }
    };

    const sock = getQueueSocket();
    sock.on("queue:update", handleUpdate);

    return () => {
      mounted = false;
      sock.off("queue:update", handleUpdate);
    };
  }, [stylistId]);

  const handleJoinQueue = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const { joinQueue } = await import("@/services/socket");
      joinQueue(stylistId);
    } catch {
      setError("Failed to join queue. Please try again.");
    }
    setJoining(false);
  }, [stylistId]);

  const queueLength = queueData?.entries?.filter((e) => e.status === "waiting").length ?? 0;
  const predictedWait = queueData?.predictedWaitMins ?? 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-4",
        className,
      )}
      role="region"
      aria-label="Queue status"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Users size={14} aria-hidden="true" />
        Queue
      </h3>

      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs"
          role="alert"
        >
          <AlertCircle size={12} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4" role="status" aria-label="Loading queue">
          <Loader2 size={16} className="animate-spin text-gray-400" aria-hidden="true" />
          <span className="sr-only">Loading queue...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{queueLength}</p>
              <p className="text-[10px] text-gray-400 font-medium">In Queue</p>
            </div>
            <div className="flex-1 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {predictedWait < 60 ? `${predictedWait}m` : `${Math.floor(predictedWait / 60)}h`}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">Est. Wait</p>
            </div>
          </div>

          {myPosition !== null && (
            <div
              className="mb-3 p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-center"
              role="status"
              aria-label={`Your position in queue: ${myPosition}`}
            >
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                Your position: #{myPosition}
              </p>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            loading={joining}
            onClick={handleJoinQueue}
            aria-label="Join the queue"
          >
            Join Queue
          </Button>
        </>
      )}
    </div>
  );
}
