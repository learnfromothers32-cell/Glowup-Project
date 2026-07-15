import { useState } from "react";
import { Shield, Users, Eye, MessageSquare, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";
import { useModerationStore } from "@/domain/live/stores/moderationStore";
import { useGuestRequestStore } from "@/domain/live/stores/guestRequestStore";
import { useReactionStore } from "@/domain/live/stores/reactionStore";
import { useViewerStore } from "@/domain/live/stores/viewerStore";
import { ModerationPanel } from "./ModerationPanel";
import { GuestRequestPanel } from "./GuestRequestPanel";

interface HostSafetyDashboardProps {
  sessionId: string;
  className?: string;
}

export function HostSafetyDashboard({ sessionId, className }: HostSafetyDashboardProps) {
  const [expanded, setExpanded] = useState(false);
  const { mutedUsers, bannedUsers, pendingReports } = useModerationStore();
  const { pendingRequests } = useGuestRequestStore();
  const counts = useReactionStore((s) => s.counts);
  const viewerCount = useViewerStore((s) => s.viewerCount);

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
  const hasAlerts = pendingReports > 0 || pendingRequests.length > 0;

  return (
    <div
      className={cn("rounded-xl bg-white/5 border border-white/10 overflow-hidden", className)}
      role="region"
      aria-label="Host safety dashboard"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium",
          "hover:bg-white/5 transition-colors"
        )}
        aria-expanded={expanded}
      >
        <Shield className="w-4 h-4 text-purple-400" />
        <span>Host Dashboard</span>
        {hasAlerts && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full animate-pulse">
            {pendingReports + pendingRequests.length}
          </span>
        )}
        <span className="ml-auto">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={Users} label="Viewers" value={viewerCount} />
            <StatCard icon={MessageSquare} label="Reactions" value={totalReactions} />
            <StatCard
              icon={AlertTriangle}
              label="Reports"
              value={pendingReports}
              alert={pendingReports > 0}
            />
            <StatCard
              icon={Eye}
              label="Guest Requests"
              value={pendingRequests.length}
              alert={pendingRequests.length > 0}
            />
          </div>

          {/* Reaction Breakdown */}
          <div className="flex gap-2 text-xs">
            {Object.entries(counts).map(([type, count]) => (
              <span key={type} className="px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                {type}: {count}
              </span>
            ))}
          </div>

          {/* Moderation & Guest Panels */}
          <ModerationPanel sessionId={sessionId} isHost={true} />
          <GuestRequestPanel sessionId={sessionId} isHost={true} />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: any;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm",
        alert ? "bg-red-500/10" : "bg-white/5"
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", alert ? "text-red-400" : "text-white/40")} />
      <span className="text-white/50">{label}</span>
      <span className={cn("ml-auto font-medium", alert ? "text-red-400" : "text-white/80")}>
        {value}
      </span>
    </div>
  );
}
