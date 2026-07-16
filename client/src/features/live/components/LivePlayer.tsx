import { useEffect, useRef } from "react";
import { RoomEvent, Track, type Room as LiveKitRoom, type TrackPublication, type Participant } from "livekit-client";
import type { LocalVideoTrack, LocalAudioTrack } from "livekit-client";
import { cn } from "@/utils/cn";

interface LivePlayerProps {
  room: LiveKitRoom | null;
  isHost: boolean;
  localVideoTrack?: LocalVideoTrack | null;
  localAudioTrack?: LocalAudioTrack | null;
  className?: string;
}

export function LivePlayer({ room, isHost, localVideoTrack, localAudioTrack, className }: LivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Host: attach local camera directly via MediaStream (bypasses LiveKit track publication)
  useEffect(() => {
    if (!isHost || !localVideoTrack || !videoRef.current) return;
    const stream = new MediaStream([localVideoTrack.mediaStreamTrack]);
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isHost, localVideoTrack]);

  // Host: attach local mic directly via MediaStream
  useEffect(() => {
    if (!isHost || !localAudioTrack || !audioRef.current) return;
    const stream = new MediaStream([localAudioTrack.mediaStreamTrack]);
    audioRef.current.srcObject = stream;

    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [isHost, localAudioTrack]);

  // Viewer: attach remote tracks via LiveKit's TrackSubscribed events
  useEffect(() => {
    if (!room || isHost || !videoRef.current) return;

    const attachRemoteTrack = (trackPublication: TrackPublication) => {
      if (!trackPublication.track) return;
      if (trackPublication.source === Track.Source.Camera) {
        trackPublication.track.attach(videoRef.current!);
      }
      if (trackPublication.source === Track.Source.Microphone && audioRef.current) {
        trackPublication.track.attach(audioRef.current);
      }
    };

    const handleSubscribed = (trackPublication: TrackPublication, _participant: Participant) => {
      attachRemoteTrack(trackPublication);
    };

    const handleUnsubscribed = (trackPublication: TrackPublication) => {
      if (trackPublication.track) {
        trackPublication.track.detach();
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleUnsubscribed);

    room.participants?.forEach((p) => {
      p.trackPublications?.forEach((pub) => {
        if (pub.track) attachRemoteTrack(pub);
      });
    });

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleUnsubscribed);
    };
  }, [room, isHost]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-gray-950 overflow-hidden",
        className,
      )}
      role="region"
      aria-label={isHost ? "Your camera preview" : "Live stream video"}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        aria-hidden="true"
      />
      <audio ref={audioRef} autoPlay aria-hidden="true" />

      {!room && (
        <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Connecting to stream">
          <div className="text-center text-white/50">
            <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <p className="text-sm font-medium">Connecting to stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}
