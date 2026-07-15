import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api/axios";
import { getSocketUrl } from "./socket";
import type {
  PresenceEntry,
  ChatMessage,
  ChatHistoryResponse,
  ChatAckResponse,
  ReactionType,
  ReactionReceived,
  ModerationNotification,
  GuestRequest,
  HostAnalytics,
} from "../domain/live/live.types";

let liveSocket: Socket | null = null;

export function getLiveSocket(): Socket {
  if (!liveSocket) {
    liveSocket = io(getSocketUrl("live"), {
      auth: { token: getAccessToken() },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    liveSocket.on("connect", () => {
      const token = getAccessToken();
      if (token && liveSocket?.auth?.token !== token) {
        liveSocket!.auth = { token };
      }
    });
  }
  return liveSocket;
}

export function connectLive() {
  const s = getLiveSocket();
  if (!s.connected) {
    s.auth = { token: getAccessToken() };
    s.connect();
  }
}

export function disconnectLive() {
  if (liveSocket?.connected) {
    liveSocket.disconnect();
  }
}

export function joinRoom(
  sessionId: string,
  role: string,
  displayName?: string,
) {
  const s = getLiveSocket();
  if (!s.connected) connectLive();
  s.emit("live:join", { sessionId, role, displayName });
}

export function leaveRoom(sessionId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:leave", { sessionId });
  }
}

export function sendHeartbeat(sessionId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:heartbeat", { sessionId });
  }
}

export function sendChatMessage(
  sessionId: string,
  content: string,
  messageId: string,
  replyTo?: string,
) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:chat:send", { sessionId, content, messageId, replyTo });
  }
}

export function requestChatHistory(
  sessionId: string,
  cursor?: string,
  limit?: number,
) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:chat:history", { sessionId, cursor, limit });
  }
}

export function deleteChatMessage(messageId: string, sessionId: string, reason?: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:chat:delete", { messageId, sessionId, reason });
  }
}

export function pinChatMessage(messageId: string, sessionId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:chat:pin", { messageId, sessionId });
  }
}

export function onJoined(
  cb: (data: {
    sessionId: string;
    presence: PresenceEntry[];
    viewerCount: number;
  }) => void,
) {
  getLiveSocket().on("live:joined", cb);
}

export function offJoined(
  cb: (data: {
    sessionId: string;
    presence: PresenceEntry[];
    viewerCount: number;
  }) => void,
) {
  getLiveSocket().off("live:joined", cb);
}

export function onPresence(
  cb: (data: {
    sessionId: string;
    action: "join" | "leave";
    user: PresenceEntry;
  }) => void,
) {
  getLiveSocket().on("live:presence", cb);
}

export function offPresence(
  cb: (data: {
    sessionId: string;
    action: "join" | "leave";
    user: PresenceEntry;
  }) => void,
) {
  getLiveSocket().off("live:presence", cb);
}

export function onViewerCount(
  cb: (data: { sessionId: string; count: number }) => void,
) {
  getLiveSocket().on("live:viewer-count", cb);
}

export function offViewerCount(
  cb: (data: { sessionId: string; count: number }) => void,
) {
  getLiveSocket().off("live:viewer-count", cb);
}

export function onStatus(
  cb: (data: { sessionId: string; status: string }) => void,
) {
  getLiveSocket().on("live:status", cb);
}

export function offStatus(
  cb: (data: { sessionId: string; status: string }) => void,
) {
  getLiveSocket().off("live:status", cb);
}

export function onPong(
  cb: (data: { sessionId: string; timestamp: number }) => void,
) {
  getLiveSocket().on("live:pong", cb);
}

export function offPong(
  cb: (data: { sessionId: string; timestamp: number }) => void,
) {
  getLiveSocket().off("live:pong", cb);
}

export function onHostOnline(cb: (data: { sessionId: string }) => void) {
  getLiveSocket().on("live:host-online", cb);
}

export function offHostOnline(cb: (data: { sessionId: string }) => void) {
  getLiveSocket().off("live:host-online", cb);
}

export function onHostOffline(cb: (data: { sessionId: string }) => void) {
  getLiveSocket().on("live:host-offline", cb);
}

export function offHostOffline(cb: (data: { sessionId: string }) => void) {
  getLiveSocket().off("live:host-offline", cb);
}

export function onChatMessage(cb: (msg: ChatMessage) => void) {
  getLiveSocket().on("live:chat:message", cb);
}

export function offChatMessage(cb: (msg: ChatMessage) => void) {
  getLiveSocket().off("live:chat:message", cb);
}

export function onChatAck(cb: (ack: ChatAckResponse) => void) {
  getLiveSocket().on("live:chat:ack", cb);
}

export function offChatAck(cb: (ack: ChatAckResponse) => void) {
  getLiveSocket().off("live:chat:ack", cb);
}

export function onChatHistory(
  cb: (data: ChatHistoryResponse) => void,
) {
  getLiveSocket().on("live:chat:history", cb);
}

export function offChatHistory(
  cb: (data: ChatHistoryResponse) => void,
) {
  getLiveSocket().off("live:chat:history", cb);
}

export function onChatDeleted(
  cb: (data: { success: boolean; messageId: string }) => void,
) {
  getLiveSocket().on("live:chat:deleted", cb);
}

export function offChatDeleted(
  cb: (data: { success: boolean; messageId: string }) => void,
) {
  getLiveSocket().off("live:chat:deleted", cb);
}

export function onChatPinned(
  cb: (data: { success: boolean; messageId: string }) => void,
) {
  getLiveSocket().on("live:chat:pinned", cb);
}

export function offChatPinned(
  cb: (data: { success: boolean; messageId: string }) => void,
) {
  getLiveSocket().off("live:chat:pinned", cb);
}

export function onChatError(
  cb: (data: { code: string; message: string }) => void,
) {
  getLiveSocket().on("live:chat:error", cb);
}

export function offChatError(
  cb: (data: { code: string; message: string }) => void,
) {
  getLiveSocket().off("live:chat:error", cb);
}

export function onLiveError(
  cb: (data: { code: string; message: string }) => void,
) {
  getLiveSocket().on("live:error", cb);
}

export function offLiveError(
  cb: (data: { code: string; message: string }) => void,
) {
  getLiveSocket().off("live:error", cb);
}

// ── Commerce Events ──

export function pinService(sessionId: string, serviceId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:service:pin", { sessionId, serviceId });
  }
}

export function unpinService(sessionId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:service:unpin", { sessionId });
  }
}

export function updateAvailability(sessionId: string, availability: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:availability:update", {
      sessionId,
      availability: availability as any,
    });
  }
}

export function toggleShelf(sessionId: string, visible: boolean) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:shelf:toggle", { sessionId, visible });
  }
}

export function onServicePinned(
  cb: (data: { sessionId: string; serviceId: string; service: any }) => void,
) {
  getLiveSocket().on("live:service:pinned", cb);
}

export function offServicePinned(
  cb: (data: { sessionId: string; serviceId: string; service: any }) => void,
) {
  getLiveSocket().off("live:service:pinned", cb);
}

export function onServiceUnpinned(cb: (data: { sessionId: string }) => void) {
  getLiveSocket().on("live:service:unpinned", cb);
}

export function offServiceUnpinned(cb: (data: { sessionId: string }) => void) {
  getLiveSocket().off("live:service:unpinned", cb);
}

export function onAvailabilityUpdated(
  cb: (data: { sessionId: string; availability: string }) => void,
) {
  getLiveSocket().on("live:availability:updated", cb);
}

export function offAvailabilityUpdated(
  cb: (data: { sessionId: string; availability: string }) => void,
) {
  getLiveSocket().off("live:availability:updated", cb);
}

export function onShelfUpdated(
  cb: (data: { sessionId: string; visible: boolean }) => void,
) {
  getLiveSocket().on("live:shelf:updated", cb);
}

export function offShelfUpdated(
  cb: (data: { sessionId: string; visible: boolean }) => void,
) {
  getLiveSocket().off("live:shelf:updated", cb);
}

// ── Moderation Events ──

export function muteUser(sessionId: string, userId: string, reason?: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:mod:mute", { sessionId, userId, reason });
  }
}

export function unmuteUser(sessionId: string, userId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:mod:unmute", { sessionId, userId });
  }
}

export function banUser(sessionId: string, userId: string, reason?: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:mod:ban", { sessionId, userId, reason });
  }
}

export function unbanUser(sessionId: string, userId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:mod:unban", { sessionId, userId });
  }
}

export function deleteMessage(sessionId: string, messageId: string, reason?: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:mod:delete", { sessionId, messageId, reason });
  }
}

export function reportMessage(sessionId: string, messageId: string, reason?: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:mod:report-message", { sessionId, messageId, reason });
  }
}

export function reportUser(sessionId: string, userId: string, reason?: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:mod:report-user", { sessionId, userId, reason });
  }
}

export function onUserMuted(
  cb: (data: { sessionId: string; userId: string; mutedBy: string }) => void,
) {
  getLiveSocket().on("live:mod:user-muted", cb);
}

export function offUserMuted(
  cb: (data: { sessionId: string; userId: string; mutedBy: string }) => void,
) {
  getLiveSocket().off("live:mod:user-muted", cb);
}

export function onUserUnmuted(
  cb: (data: { sessionId: string; userId: string }) => void,
) {
  getLiveSocket().on("live:mod:user-unmuted", cb);
}

export function offUserUnmuted(
  cb: (data: { sessionId: string; userId: string }) => void,
) {
  getLiveSocket().off("live:mod:user-unmuted", cb);
}

export function onUserBanned(
  cb: (data: { sessionId: string; userId: string; reason?: string }) => void,
) {
  getLiveSocket().on("live:mod:user-banned", cb);
}

export function offUserBanned(
  cb: (data: { sessionId: string; userId: string; reason?: string }) => void,
) {
  getLiveSocket().off("live:mod:user-banned", cb);
}

export function onUserUnbanned(
  cb: (data: { sessionId: string; userId: string }) => void,
) {
  getLiveSocket().on("live:mod:user-unbanned", cb);
}

export function offUserUnbanned(
  cb: (data: { sessionId: string; userId: string }) => void,
) {
  getLiveSocket().off("live:mod:user-unbanned", cb);
}

export function onMessageDeleted(
  cb: (data: { sessionId: string; messageId: string }) => void,
) {
  getLiveSocket().on("live:mod:message-deleted", cb);
}

export function offMessageDeleted(
  cb: (data: { sessionId: string; messageId: string }) => void,
) {
  getLiveSocket().off("live:mod:message-deleted", cb);
}

export function onReportSubmitted(
  cb: (data: { sessionId: string; reportId: string }) => void,
) {
  getLiveSocket().on("live:mod:report-submitted", cb);
}

export function offReportSubmitted(
  cb: (data: { sessionId: string; reportId: string }) => void,
) {
  getLiveSocket().off("live:mod:report-submitted", cb);
}

export function onModerationNotification(cb: (data: ModerationNotification) => void) {
  getLiveSocket().on("live:mod:notification", cb);
}

export function offModerationNotification(cb: (data: ModerationNotification) => void) {
  getLiveSocket().off("live:mod:notification", cb);
}

// ── Reaction Events ──

export function sendReaction(sessionId: string, type: ReactionType) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:reaction:send", { sessionId, type });
  }
}

export function onReactionReceived(cb: (data: ReactionReceived) => void) {
  getLiveSocket().on("live:reaction:received", cb);
}

export function offReactionReceived(cb: (data: ReactionReceived) => void) {
  getLiveSocket().off("live:reaction:received", cb);
}

// ── Guest Request Events ──

export function requestGuest(sessionId: string, reason?: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:guest:request", { sessionId, reason });
  }
}

export function cancelGuestRequest(sessionId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:guest:cancel", { sessionId });
  }
}

export function acceptGuest(sessionId: string, requestId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:guest:accept", { sessionId, requestId });
  }
}

export function rejectGuest(sessionId: string, requestId: string) {
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("live:guest:reject", { sessionId, requestId });
  }
}

export function onGuestRequestReceived(
  cb: (data: { sessionId: string; requestId: string; displayName: string; reason?: string }) => void,
) {
  getLiveSocket().on("live:guest:request-received", cb);
}

export function offGuestRequestReceived(
  cb: (data: { sessionId: string; requestId: string; displayName: string; reason?: string }) => void,
) {
  getLiveSocket().off("live:guest:request-received", cb);
}

export function onGuestRequestCancelled(
  cb: (data: { sessionId: string; requestId: string }) => void,
) {
  getLiveSocket().on("live:guest:request-cancelled", cb);
}

export function offGuestRequestCancelled(
  cb: (data: { sessionId: string; requestId: string }) => void,
) {
  getLiveSocket().off("live:guest:request-cancelled", cb);
}

export function onGuestRequestAccepted(
  cb: (data: { sessionId: string; requestId: string }) => void,
) {
  getLiveSocket().on("live:guest:request-accepted", cb);
}

export function offGuestRequestAccepted(
  cb: (data: { sessionId: string; requestId: string }) => void,
) {
  getLiveSocket().off("live:guest:request-accepted", cb);
}

export function onGuestRequestRejected(
  cb: (data: { sessionId: string; requestId: string }) => void,
) {
  getLiveSocket().on("live:guest:request-rejected", cb);
}

export function offGuestRequestRejected(
  cb: (data: { sessionId: string; requestId: string }) => void,
) {
  getLiveSocket().off("live:guest:request-rejected", cb);
}

export function onGuestRequestStatus(
  cb: (data: { sessionId: string; status: string }) => void,
) {
  getLiveSocket().on("live:guest:request-status", cb);
}

export function offGuestRequestStatus(
  cb: (data: { sessionId: string; status: string }) => void,
) {
  getLiveSocket().off("live:guest:request-status", cb);
}

// ── Host Analytics ──

export function onHostAnalytics(cb: (data: HostAnalytics) => void) {
  getLiveSocket().on("live:analytics:update", cb);
}

export function offHostAnalytics(cb: (data: HostAnalytics) => void) {
  getLiveSocket().off("live:analytics:update", cb);
}
