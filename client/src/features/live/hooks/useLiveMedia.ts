import { useCallback, useRef, useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  ParticipantEvent,
  type Room as LiveKitRoom,
  type TrackPublication,
  type LocalAudioTrack,
  type LocalVideoTrack,
} from "livekit-client";
import { useMediaStore } from "@/domain/live/stores/mediaStore";
import { useConnectionStore } from "@/domain/live/stores/connectionStore";

const MAX_RECONNECT_ATTEMPTS = 5;

export function useLiveMedia() {
  const roomRef = useRef<LiveKitRoom | null>(null);
  const connectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const connectArgsRef = useRef<{ url: string; token: string } | null>(null);
  const [room, setRoom] = useState<LiveKitRoom | null>(null);
  const [localTracks, setLocalTracks] = useState<{
    video?: LocalVideoTrack;
    audio?: LocalAudioTrack;
  }>({});

  const cameraEnabled = useMediaStore((s) => s.cameraEnabled);
  const micEnabled = useMediaStore((s) => s.micEnabled);
  const setCameraEnabled = useMediaStore((s) => s.setCameraEnabled);
  const setMicEnabled = useMediaStore((s) => s.setMicEnabled);
  const setStatus = useConnectionStore((s) => s.setStatus);

  const connect = useCallback(
    async (url: string, token: string) => {
      if (connectingRef.current || roomRef.current) return roomRef.current;
      connectingRef.current = true;
      connectArgsRef.current = { url, token };

      try {
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
          videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 30 } },
        });

        room.on(RoomEvent.Connected, () => {
          setStatus("connected");
          reconnectAttemptsRef.current = 0;
        });

        room.on(RoomEvent.Disconnected, () => {
          setStatus("disconnected");
        });

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          if (state === ConnectionState.Connecting) setStatus("connecting");
          else if (state === ConnectionState.Connected) {
            setStatus("connected");
            reconnectAttemptsRef.current = 0;
          } else if (state === ConnectionState.Reconnecting) setStatus("reconnecting");
          else if (state === ConnectionState.Disconnected) {
            setStatus("disconnected");
            // Attempt fallback reconnection if SDK internal reconnect failed
            attemptReconnect();
          }
        });

        room.on(RoomEvent.TrackSubscribed, () => {});

        await room.connect(url, token);

        if (cameraEnabled) {
          const videoTrack = await room.localParticipant.createCameraTrack();
          await room.localParticipant.publishTrack(videoTrack);
          setLocalTracks((prev) => ({ ...prev, video: videoTrack }));
        }

        if (micEnabled) {
          const audioTrack = await room.localParticipant.createMicrophoneTrack();
          await room.localParticipant.publishTrack(audioTrack);
          setLocalTracks((prev) => ({ ...prev, audio: audioTrack }));
        }

        room.localParticipant.on(ParticipantEvent.AudioTrackPublished, () => {});

        roomRef.current = room;
        setRoom(room);
        return room;
      } finally {
        connectingRef.current = false;
      }
    },
    [cameraEnabled, micEnabled, setStatus],
  );

  const attemptReconnect = useCallback(() => {
    const args = connectArgsRef.current;
    if (!args) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus("disconnected");
      return;
    }

    reconnectAttemptsRef.current += 1;
    setStatus("reconnecting");

    // Destroy old room and create a fresh one
    const oldRoom = roomRef.current;
    if (oldRoom) {
      oldRoom.removeAllListeners();
      oldRoom.disconnect().catch(() => {});
      roomRef.current = null;
      setRoom(null);
    }
    setLocalTracks({});
    connectingRef.current = false;

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000);
    setTimeout(() => {
      connect(args.url, args.token).catch(() => {});
    }, delay);
  }, [connect, setStatus]);

  const disconnect = useCallback(async () => {
    const r = roomRef.current;
    if (r) {
      localTracks.video?.stop();
      localTracks.audio?.stop();
      await r.disconnect();
      roomRef.current = null;
      setRoom(null);
      setLocalTracks({});
    }
  }, [localTracks]);

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current;
    const pub = r?.localParticipant?.getTrackPublication(Track.Source.Camera);
    if (pub) {
      if (pub.isMuted) {
        await pub.unmute();
        setCameraEnabled(true);
      } else {
        await pub.mute();
        setCameraEnabled(false);
      }
    }
  }, [setCameraEnabled]);

  const toggleMic = useCallback(async () => {
    const r = roomRef.current;
    const pub = r?.localParticipant?.getTrackPublication(Track.Source.Microphone);
    if (pub) {
      if (pub.isMuted) {
        await pub.unmute();
        setMicEnabled(true);
      } else {
        await pub.mute();
        setMicEnabled(false);
      }
    }
  }, [setMicEnabled]);

  useEffect(() => {
    return () => {
      const r = roomRef.current;
      if (r) {
        localTracks.video?.stop();
        localTracks.audio?.stop();
        r.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  return {
    room,
    connect,
    disconnect,
    toggleCamera,
    toggleMic,
    localTracks,
  };
}
