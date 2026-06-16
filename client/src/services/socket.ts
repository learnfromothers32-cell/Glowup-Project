import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api/axios";

export function getSocketUrl(namespace: string) {
  const raw = import.meta.env.VITE_SOCKET_URL?.trim() || "";
  return raw ? `${raw.replace(/\/$/, "")}/${namespace}` : `/${namespace}`;
}

let queueSocket: Socket | null = null;

export function getQueueSocket(): Socket {
  if (!queueSocket) {
    queueSocket = io(getSocketUrl("queue"), {
      auth: { token: getAccessToken() },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    queueSocket.on("connect", () => {
      const token = getAccessToken();
      if (token && queueSocket?.auth?.token !== token) {
        queueSocket.auth = { token };
      }
    });
  }
  return queueSocket;
}

export function connectQueue() {
  const s = getQueueSocket();
  if (!s.connected) {
    s.auth = { token: getAccessToken() };
    s.connect();
  }
}

export function disconnectQueue() {
  if (queueSocket?.connected) {
    queueSocket.disconnect();
  }
}

export function joinQueue(stylistId: string, bookingId?: string) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.emit("queue:join", { stylistId, bookingId });
}

export function leaveQueue(stylistId: string) {
  const s = getQueueSocket();
  if (s.connected) {
    s.emit("queue:leave", { stylistId });
  }
}

export function subscribeToQueue(stylistId: string) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.emit("queue:subscribe", { stylistId });
}

export function unsubscribeFromQueue(stylistId: string) {
  const s = getQueueSocket();
  if (s.connected) {
    s.emit("queue:unsubscribe", { stylistId });
  }
}

export function getMyQueueStatus(stylistId: string) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.emit("queue:status", { stylistId });
}

// ── Notification events (realtime push) ──

export function onNewNotification(
  callback: (data: { _id: string; type: string; title: string; message: string; link: string; read: boolean; createdAt: string }) => void,
) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.on("notification:new", callback);
}

export function offNewNotification(
  callback: (data: { _id: string; type: string; title: string; message: string; link: string; read: boolean; createdAt: string }) => void,
) {
  const s = getQueueSocket();
  s.off("notification:new", callback);
}

// ── Booking status events (realtime from stylist actions) ──

export function onBookingStatusChanged(
  callback: (data: { bookingId: string; status: string; stylistId: string; clientId: string }) => void,
) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.on("booking:status-changed", callback);
}

export function offBookingStatusChanged(
  callback: (data: { bookingId: string; status: string; stylistId: string; clientId: string }) => void,
) {
  const s = getQueueSocket();
  s.off("booking:status-changed", callback);
}
