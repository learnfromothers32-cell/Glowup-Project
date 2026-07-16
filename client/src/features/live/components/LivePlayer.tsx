import { useEffect, useRef, useMemo } from "react";
import { RoomEvent, Track, type Room as LiveKitRoom, type TrackPublication, type Participant } from "livekit-client";
import { cn } from "@/utils/cn";

interface LivePlayerProps {
  room: LiveKitRoom | null;
  isHost: boolean;
  className?: string;
}

export function LivePlayer({ room, isHost, className }: LivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!room || !videoRef.current) return;

    const handleSubscribed = (trackPublication: TrackPublication, participant: Participant) => {
      if (trackPublication.source === Track.Source.Camera && trackPublication.track && !isHost) {
        const el = videoRef.current;
        if (el) {
          trackPublication.track.attach(el);
        }
      }
      if (trackPublication.source === Track.Source.Microphone && trackPublication.track && !isHost) {
        const el = audioRef.current;
        if (el) {
          trackPublication.track.attach(el);
        }
      }
    };

    const handleUnsubscribed = (trackPublication: TrackPublication) => {
      if (trackPublication.track) {
        trackPublication.track.detach();
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleUnsubscribed);

    room.participants?.forEach((p) => {
      p.tracks?.forEach((pub) => {
        if (pub.track) {
          if (pub.source === Track.Source.Camera && !isHost) {
            pub.track.attach(videoRef.current!);
          }
          if (pub.source === Track.Source.Microphone && !isHost) {
            pub.track.attach(audioRef.current!);
          }
        }
      });
    });

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleUnsubscribed);
    };
  }, [room, isHost]);

  const hostTracks = useMemo(() => {
    if (!room || !isHost) return null;
    return room.localParticipant;
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

      {isHost && hostTracks && (
        <LocalPreview participant={hostTracks} />
      )}

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

function LocalPreview({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!participant || !videoRef.current) return;

    const handleSubscribed = (pub: TrackPublication) => {
      if (pub.source === Track.Source.Camera && pub.track) {
        pub.track.attach(videoRef.current!);
      }
      if (pub.source === Track.Source.Microphone && pub.track) {
        pub.track.attach(audioRef.current!);
      }
    };

    participant.tracks?.forEach((pub) => {
      if (pub.track) handleSubscribed(pub);
    });

    participant.on("trackPublished", handleSubscribed);

    return () => {
      participant.off("trackPublished", handleSubscribed);
      participant.tracks?.forEach((pub) => {
        if (pub.track) pub.track.detach();
      });
    };
  }, [participant]);

  return (
    <>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        aria-hidden="true"
      />
      <audio ref={audioRef} autoPlay aria-hidden="true" />
    </>
  );
}
