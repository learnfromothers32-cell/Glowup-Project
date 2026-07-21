import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  DataPacket_Kind,
} from 'livekit-client';

export interface Comment {
  id: string;
  type: 'comment' | 'system';
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
}

interface UseLiveSessionOptions {
  sessionId: string;
  isBroadcaster?: boolean;
  onStreamEnded?: () => void;
  initialLikeCount?: number;
}

const MAX_VISIBLE_COMMENTS = 50;
const COMMENT_COOLDOWN_MS = 3000;
const MAX_COMMENT_LENGTH = 200;

export function useLiveSession({
  sessionId: _sessionId,
  isBroadcaster = false,
  onStreamEnded,
  initialLikeCount = 0,
}: UseLiveSessionOptions) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const roomRef = useRef<Room | null>(null);
  const heartIdRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);
  const lastCommentTimeRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const addSystemComment = useCallback((text: string) => {
    setComments((prev) => [
      ...prev.slice(-(MAX_VISIBLE_COMMENTS - 1)),
      {
        id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'system',
        text,
        userId: '',
        userName: '',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const cleanup = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setComments([]);
    setHearts([]);
    reconnectAttemptsRef.current = 0;
    lastCommentTimeRef.current = 0;
  }, []);

  const connect = useCallback(async (wsUrl: string, token: string) => {
    if (!wsUrl || !token) {
      console.error('LiveKit connect failed: missing wsUrl or token', { wsUrl: !!wsUrl, token: !!token });
      throw new Error('Live streaming is not properly configured. Missing server URL or authentication token.');
    }

    const lkRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    lkRoom.on(RoomEvent.Connected, () => {
      setConnectionState(ConnectionState.Connected);
      reconnectAttemptsRef.current = 0;
    });

    lkRoom.on(RoomEvent.Disconnected, () => {
      setConnectionState(ConnectionState.Disconnected);
      if (!isBroadcaster) {
        onStreamEnded?.();
      }
    });

    lkRoom.on(RoomEvent.Reconnecting, () => {
      reconnectAttemptsRef.current++;
      if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
        cleanup();
        onStreamEnded?.();
        return;
      }
      setConnectionState(ConnectionState.Reconnecting);
    });

    lkRoom.on(RoomEvent.DataReceived, (payload, _participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));

        if (data.type === 'comment') {
          setComments((prev) => [
            ...prev.slice(-(MAX_VISIBLE_COMMENTS - 1)),
            {
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'comment',
              text: String(data.text).slice(0, MAX_COMMENT_LENGTH),
              userId: data.userId,
              userName: data.userName,
              userAvatar: data.userAvatar,
              timestamp: Date.now(),
            },
          ]);
        } else if (data.type === 'reaction') {
          const id = ++heartIdRef.current;
          const x = 75 + Math.random() * 18;
          setHearts((prev) => [...prev.slice(-15), { id, x }]);
          setTimeout(() => {
            setHearts((prev) => prev.filter((h) => h.id !== id));
          }, 2000);
        } else if (data.type === 'like-update') {
          setLikeCount(data.likeCount);
        }
      } catch (e) {
        console.warn('Failed to parse live data:', e);
      }
    });

    lkRoom.on(RoomEvent.ParticipantConnected, (participant) => {
      const name = participant.name || participant.identity?.slice(0, 12) || 'Someone';
      addSystemComment(`${name} joined`);

      if (!isBroadcaster) {
        setViewerCount(lkRoom.remoteParticipants.size + 1);
      }
    });

    lkRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
      const name = participant.name || participant.identity?.slice(0, 12) || 'Someone';
      addSystemComment(`${name} left`);

      if (!isBroadcaster) {
        setViewerCount(Math.max(0, lkRoom.remoteParticipants.size));
      }
    });

    lkRoom.on(RoomEvent.ActiveSpeakersChanged, () => {
      // future: highlight active speaker
    });

    await lkRoom.connect(wsUrl, token);

    if (isBroadcaster) {
      await lkRoom.localParticipant.setCameraEnabled(true);
      await lkRoom.localParticipant.setMicrophoneEnabled(true);
    }

    roomRef.current = lkRoom;
    setRoom(lkRoom);
    setConnectionState(lkRoom.state);
  }, [isBroadcaster, onStreamEnded, cleanup, addSystemComment]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const canSendComment = useCallback(() => {
    const now = Date.now();
    if (now - lastCommentTimeRef.current < COMMENT_COOLDOWN_MS) {
      return false;
    }
    return true;
  }, []);

  const getCooldownRemaining = useCallback(() => {
    const elapsed = Date.now() - lastCommentTimeRef.current;
    return Math.max(0, Math.ceil((COMMENT_COOLDOWN_MS - elapsed) / 1000));
  }, []);

  const sendComment = useCallback(
    (text: string, userId: string, userName: string, userAvatar?: string) => {
      if (!roomRef.current) return false;
      if (!canSendComment()) return false;

      const trimmed = text.trim().slice(0, MAX_COMMENT_LENGTH);
      if (!trimmed) return false;

      try {
        const data = new TextEncoder().encode(
          JSON.stringify({ type: 'comment', text: trimmed, userId, userName, userAvatar })
        );
        roomRef.current.localParticipant.publishData(data, { kind: DataPacket_Kind.RELIABLE });
        lastCommentTimeRef.current = Date.now();
        return true;
      } catch (e) {
        console.warn('Failed to send comment:', e);
        return false;
      }
    },
    [canSendComment]
  );

  const sendReaction = useCallback(() => {
    if (!roomRef.current) return;
    try {
      const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction' }));
      roomRef.current.localParticipant.publishData(data, { kind: DataPacket_Kind.RELIABLE });
    } catch (e) {
      console.warn('Failed to send reaction:', e);
    }
  }, []);

  const broadcastLikeUpdate = useCallback((newCount: number) => {
    if (!roomRef.current) return;
    try {
      const data = new TextEncoder().encode(
        JSON.stringify({ type: 'like-update', likeCount: newCount })
      );
      roomRef.current.localParticipant.publishData(data, { kind: DataPacket_Kind.RELIABLE });
    } catch (e) {
      console.warn('Failed to broadcast like update:', e);
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isCameraEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(!enabled);
  }, []);

  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isMicrophoneEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!enabled);
  }, []);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  return {
    room,
    connectionState,
    viewerCount,
    setViewerCount,
    comments,
    hearts,
    likeCount,
    setLikeCount,
    connect,
    disconnect,
    sendComment,
    sendReaction,
    broadcastLikeUpdate,
    toggleCamera,
    toggleMicrophone,
    canSendComment,
    getCooldownRemaining,
    COMMENT_COOLDOWN_MS,
    MAX_COMMENT_LENGTH,
  };
}
