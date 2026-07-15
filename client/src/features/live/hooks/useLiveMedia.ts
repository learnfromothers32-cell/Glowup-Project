import { useCallback, useRef, useState } from "react";
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

export function useLiveMedia() {
  const roomRef = useRef<LiveKitRoom | null>(null);
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
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
        videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 30 } },
      });

      room.on(RoomEvent.Connected, () => {
        setStatus("connected");
      });

      room.on(RoomEvent.Disconnected, () => {
        setStatus("disconnected");
      });

      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connecting) setStatus("connecting");
        else if (state === ConnectionState.Connected) setStatus("connected");
        else if (state === ConnectionState.Reconnecting) setStatus("reconnecting");
        else if (state === ConnectionState.Disconnected) setStatus("disconnected");
      });

      room.on(
        RoomEvent.TrackSubscribed,
        (_track: any, _pub: TrackPublication, _participant: any) => {},
      );

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
      return room;
    },
    [cameraEnabled, micEnabled, setStatus],
  );

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      localTracks.video?.stop();
      localTracks.audio?.stop();
      await room.disconnect();
      roomRef.current = null;
      setLocalTracks({});
    }
  }, [localTracks]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    const pub = room?.localParticipant?.getTrackPublication(Track.Source.Camera);
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
    const room = roomRef.current;
    const pub = room?.localParticipant?.getTrackPublication(Track.Source.Microphone);
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

  return {
    room: roomRef.current,
    connect,
    disconnect,
    toggleCamera,
    toggleMic,
    localTracks,
  };
}
