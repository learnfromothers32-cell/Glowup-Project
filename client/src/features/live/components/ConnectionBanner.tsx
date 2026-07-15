import { AlertTriangle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { useConnectionStore } from "@/domain/live/stores/connectionStore";

interface ConnectionBannerProps {
  className?: string;
  onRetry?: () => void;
}

export function ConnectionBanner({ className, onRetry }: ConnectionBannerProps) {
  const status = useConnectionStore((s) => s.status);
  const error = useConnectionStore((s) => s.error);

  if (status === "connected") return null;

  const config: Record<string, {
    bg: string;
    border: string;
    text: string;
    icon: React.ReactNode;
    message: string;
    showRetry: boolean;
  }> = {
    connecting: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800/30",
      text: "text-blue-700 dark:text-blue-300",
      icon: <Wifi size={14} className="animate-pulse" aria-hidden="true" />,
      message: "Connecting to live stream...",
      showRetry: false,
    },
    reconnecting: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800/30",
      text: "text-amber-700 dark:text-amber-300",
      icon: <RefreshCw size={14} className="animate-spin" aria-hidden="true" />,
      message: "Reconnecting...",
      showRetry: true,
    },
    disconnected: {
      bg: "bg-gray-50 dark:bg-gray-900/20",
      border: "border-gray-200 dark:border-gray-700",
      text: "text-gray-600 dark:text-gray-400",
      icon: <WifiOff size={14} aria-hidden="true" />,
      message: "Disconnected from stream",
      showRetry: true,
    },
    failed: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800/30",
      text: "text-red-700 dark:text-red-300",
      icon: <AlertTriangle size={14} aria-hidden="true" />,
      message: error || "Connection failed",
      showRetry: true,
    },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium",
        c.bg,
        c.border,
        c.text,
        className,
      )}
    >
      {c.icon}
      <span className="flex-1">{c.message}</span>
      {c.showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
          aria-label="Retry connection"
        >
          <RefreshCw size={10} aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
