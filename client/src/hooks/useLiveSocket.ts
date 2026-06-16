import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api/axios";
import { getSocketUrl } from "../services/socket";

export function useLiveSocket(stylistId?: string) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());

  useEffect(() => {
    if (!stylistId) return;

    const token = getAccessToken() || undefined;
    const socket = io(getSocketUrl("live"), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Re-attach listeners BEFORE joining the room,
      // so WebRTC handlers are registered before the stylist sends an offer
      listenersRef.current.forEach((handler, event) => {
        socket.off(event);
        socket.on(event, handler);
      });
      socket.emit("live:join-room", { stylistId });
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Re-attach any listeners that were registered before connection
    listenersRef.current.forEach((handler, event) => {
      socket.off(event);
      socket.on(event, handler);
    });

    return () => {
      socket.emit("live:leave-room");
      socket.removeAllListeners();
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [stylistId]);

  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      listenersRef.current.set(event, handler);
      const socket = socketRef.current;
      // Use socket.connected as a fallback in case the React state
      // hasn't updated yet but the socket is already connected
      if (socket && (connected || socket.connected)) {
        socket.off(event);
        socket.on(event, handler);
      }
    },
    [connected],
  );

  const off = useCallback((event: string) => {
    listenersRef.current.delete(event);
    socketRef.current?.off(event);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const sendMessage = useCallback(
    (message: string, parentId?: string) => {
      if (!stylistId) return;
      socketRef.current?.emit("live:send-message", { stylistId, message, parentId });
    },
    [stylistId],
  );

  const sendLike = useCallback(() => {
    if (!stylistId) return;
    socketRef.current?.emit("live:like", { stylistId });
  }, [stylistId]);

  return { connected, on, off, emit, sendMessage, sendLike };
}
