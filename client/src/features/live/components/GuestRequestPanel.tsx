import { useState } from "react";
import { UserPlus, Check, X, Clock } from "lucide-react";
import { cn } from "@/utils/cn";
import { useGuestRequestStore } from "@/domain/live/stores/guestRequestStore";
import type { GuestRequest } from "@/domain/live/stores/guestRequestStore";
import { acceptGuest, rejectGuest, requestGuest, cancelGuestRequest } from "@/services/liveSocket";

interface GuestRequestPanelProps {
  sessionId: string;
  isHost: boolean;
  className?: string;
}

export function GuestRequestPanel({ sessionId, isHost, className }: GuestRequestPanelProps) {
  const { pendingRequests } = useGuestRequestStore();
  const [expanded, setExpanded] = useState(false);

  if (!isHost) return null;

  return (
    <div
      className={cn("rounded-xl bg-white/5 border border-white/10 overflow-hidden", className)}
      role="region"
      aria-label="Guest requests"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium",
          "hover:bg-white/5 transition-colors"
        )}
        aria-expanded={expanded}
      >
        <UserPlus className="w-4 h-4 text-blue-400" />
        <span>Guest Requests</span>
        {pendingRequests.length > 0 && (
          <span className="ml-auto px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
            {pendingRequests.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          {pendingRequests.length === 0 ? (
            <div className="text-sm text-white/40 text-center py-2">
              No pending requests
            </div>
          ) : (
            pendingRequests.map((req) => (
              <GuestRequestItem
                key={req.id}
                request={req}
                sessionId={sessionId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function GuestRequestItem({
  request,
  sessionId,
}: {
  request: GuestRequest;
  sessionId: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 text-sm">
      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="truncate text-white/80">{request.displayName}</div>
        {request.reason && (
          <div className="truncate text-xs text-white/40">{request.reason}</div>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => acceptGuest(sessionId, request.id)}
          className="p-1 rounded hover:bg-green-500/20 text-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={`Accept guest ${request.displayName}`}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => rejectGuest(sessionId, request.id)}
          className="p-1 rounded hover:bg-red-500/20 text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={`Reject guest ${request.displayName}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ViewerGuestRequestButtonProps {
  sessionId: string;
  className?: string;
}

export function ViewerGuestRequestButton({ sessionId, className }: ViewerGuestRequestButtonProps) {
  const { myRequestStatus, setMyRequestStatus } = useGuestRequestStore();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");

  const handleRequest = () => {
    requestGuest(sessionId, reason || undefined);
    setMyRequestStatus("pending");
    setShowDialog(false);
    setReason("");
  };

  const handleCancel = () => {
    cancelGuestRequest(sessionId);
    setMyRequestStatus(null);
  };

  if (myRequestStatus === "pending") {
    return (
      <button
        onClick={handleCancel}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors",
          className
        )}
        aria-label="Cancel guest request"
      >
        Request Pending — Cancel
      </button>
    );
  }

  if (myRequestStatus === "accepted") {
    return (
      <div
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium text-center",
          "bg-green-500/20 text-green-400",
          className
        )}
        role="status"
      >
        Guest request accepted!
      </div>
    );
  }

  if (myRequestStatus === "rejected") {
    return (
      <div
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium text-center",
          "bg-red-500/20 text-red-400",
          className
        )}
        role="status"
      >
        Guest request was not accepted
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          "bg-purple-600 text-white hover:bg-purple-700 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900",
          className
        )}
        aria-label="Request to join as guest"
      >
        Request to Join
      </button>

      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Guest request"
        >
          <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Request to Join</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want to join? (optional)"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={500}
              aria-label="Reason for joining"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
