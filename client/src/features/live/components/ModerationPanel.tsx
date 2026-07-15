import { useState } from "react";
import { Shield, VolumeX, Volume2, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";
import { useModerationStore } from "@/domain/live/stores/moderationStore";
import { muteUser, unmuteUser, banUser, unbanUser } from "@/services/liveSocket";

interface ModerationPanelProps {
  sessionId: string;
  isHost: boolean;
  className?: string;
}

export function ModerationPanel({ sessionId, isHost, className }: ModerationPanelProps) {
  const { mutedUsers, bannedUsers, pendingReports } = useModerationStore();
  const [expanded, setExpanded] = useState(false);

  if (!isHost) return null;

  return (
    <div
      className={cn("rounded-xl bg-white/5 border border-white/10 overflow-hidden", className)}
      role="region"
      aria-label="Moderation controls"
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
        <span>Moderation</span>
        {pendingReports > 0 && (
          <span className="ml-auto px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
            {pendingReports}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Reports */}
          {pendingReports > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{pendingReports} pending report{pendingReports > 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Muted Users */}
          {mutedUsers.size > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wide px-1">
                Muted ({mutedUsers.size})
              </div>
              {Array.from(mutedUsers).map((uid) => (
                <div key={uid} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 text-sm">
                  <VolumeX className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="flex-1 truncate text-white/70">{uid.slice(0, 8)}...</span>
                  <button
                    onClick={() => unmuteUser(sessionId, uid)}
                    className="text-xs text-green-400 hover:text-green-300"
                    aria-label={`Unmute user ${uid.slice(0, 8)}`}
                  >
                    Unmute
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Banned Users */}
          {bannedUsers.size > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wide px-1">
                Banned ({bannedUsers.size})
              </div>
              {Array.from(bannedUsers).map((uid) => (
                <div key={uid} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 text-sm">
                  <Ban className="w-3.5 h-3.5 text-red-400" />
                  <span className="flex-1 truncate text-white/70">{uid.slice(0, 8)}...</span>
                  <button
                    onClick={() => unbanUser(sessionId, uid)}
                    className="text-xs text-green-400 hover:text-green-300"
                    aria-label={`Unban user ${uid.slice(0, 8)}`}
                  >
                    Unban
                  </button>
                </div>
              ))}
            </div>
          )}

          {mutedUsers.size === 0 && bannedUsers.size === 0 && pendingReports === 0 && (
            <div className="text-sm text-white/40 text-center py-2">
              No moderation actions pending
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface UserModerationMenuProps {
  sessionId: string;
  targetUserId: string;
  isMuted: boolean;
  isBanned: boolean;
  className?: string;
}

export function UserModerationMenu({
  sessionId,
  targetUserId,
  isMuted,
  isBanned,
  className,
}: UserModerationMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="Moderation options"
        aria-haspopup="menu"
        aria-expanded={showMenu}
      >
        <Shield className="w-4 h-4 text-white/50" />
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]"
          role="menu"
        >
          {!isMuted && (
            <button
              onClick={() => { muteUser(sessionId, targetUserId); setShowMenu(false); }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 flex items-center gap-2"
              role="menuitem"
            >
              <VolumeX className="w-3.5 h-3.5 text-yellow-400" />
              Mute
            </button>
          )}
          {isMuted && (
            <button
              onClick={() => { unmuteUser(sessionId, targetUserId); setShowMenu(false); }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 flex items-center gap-2"
              role="menuitem"
            >
              <Volume2 className="w-3.5 h-3.5 text-green-400" />
              Unmute
            </button>
          )}
          {!isBanned && (
            <button
              onClick={() => { banUser(sessionId, targetUserId); setShowMenu(false); }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 flex items-center gap-2 text-red-400"
              role="menuitem"
            >
              <Ban className="w-3.5 h-3.5" />
              Ban
            </button>
          )}
          {isBanned && (
            <button
              onClick={() => { unbanUser(sessionId, targetUserId); setShowMenu(false); }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 flex items-center gap-2 text-green-400"
              role="menuitem"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Unban
            </button>
          )}
        </div>
      )}
    </div>
  );
}
