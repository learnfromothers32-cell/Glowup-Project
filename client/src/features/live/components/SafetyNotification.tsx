import { useEffect, useState } from "react";
import { AlertCircle, Shield, MessageSquareOff, CheckCircle, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { onModerationNotification, offModerationNotification } from "@/services/liveSocket";
import type { ModerationNotification } from "@/domain/live/live.types";

const NOTIFICATION_STYLES = {
  muted: {
    icon: AlertCircle,
    bg: "bg-yellow-500/20 border-yellow-500/30",
    text: "text-yellow-400",
  },
  banned: {
    icon: Shield,
    bg: "bg-red-500/20 border-red-500/30",
    text: "text-red-400",
  },
  "message-removed": {
    icon: MessageSquareOff,
    bg: "bg-orange-500/20 border-orange-500/30",
    text: "text-orange-400",
  },
  "report-confirmed": {
    icon: CheckCircle,
    bg: "bg-green-500/20 border-green-500/30",
    text: "text-green-400",
  },
};

export function SafetyNotification() {
  const [notification, setNotification] = useState<ModerationNotification | null>(null);

  useEffect(() => {
    const handleNotification = (data: ModerationNotification) => {
      setNotification(data);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    };

    onModerationNotification(handleNotification);
    return () => offModerationNotification(handleNotification);
  }, []);

  if (!notification) return null;

  const style = NOTIFICATION_STYLES[notification.type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl",
        "animate-slide-down motion-reduce:animate-none",
        style.bg
      )}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={cn("w-5 h-5 shrink-0", style.text)} />
      <span className={cn("text-sm font-medium", style.text)}>
        {notification.message}
      </span>
      <button
        onClick={() => setNotification(null)}
        className="ml-2 p-0.5 rounded hover:bg-white/10 focus:outline-none"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-white/50" />
      </button>
    </div>
  );
}
