import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useMediaStore } from "@/domain/live/stores/mediaStore";

interface HostControlsProps {
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndStream: () => void;
  isStreaming: boolean;
  className?: string;
}

export function HostControls({
  onToggleCamera,
  onToggleMic,
  onEndStream,
  isStreaming,
  className,
}: HostControlsProps) {
  const cameraEnabled = useMediaStore((s) => s.cameraEnabled);
  const micEnabled = useMediaStore((s) => s.micEnabled);

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 p-4",
        className,
      )}
      role="toolbar"
      aria-label="Stream controls"
    >
      <ControlButton
        active={micEnabled}
        onClick={onToggleMic}
        activeIcon={<Mic size={20} aria-hidden="true" />}
        inactiveIcon={<MicOff size={20} aria-hidden="true" />}
        activeLabel="Mute microphone"
        inactiveLabel="Unmute microphone"
      />

      <ControlButton
        active={cameraEnabled}
        onClick={onToggleCamera}
        activeIcon={<Video size={20} aria-hidden="true" />}
        inactiveIcon={<VideoOff size={20} aria-hidden="true" />}
        activeLabel="Turn camera off"
        inactiveLabel="Turn camera on"
      />

      <button
        onClick={onEndStream}
        disabled={!isStreaming}
        aria-label={isStreaming ? "End stream" : "Stream not active"}
        className={cn(
          "p-3 rounded-full transition-all",
          isStreaming
            ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200"
            : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed",
        )}
      >
        <PhoneOff size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  activeIcon,
  inactiveIcon,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  onClick: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? activeLabel : inactiveLabel}
      aria-pressed={active}
      className={cn(
        "p-3 rounded-full transition-all",
        active
          ? "bg-gray-800/80 text-white hover:bg-gray-700"
          : "bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50",
      )}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}

interface ViewerControlsProps {
  onLeave: () => void;
  className?: string;
}

export function ViewerControls({ onLeave, className }: ViewerControlsProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-3 p-4", className)}
      role="toolbar"
      aria-label="Viewer controls"
    >
      <button
        onClick={onLeave}
        aria-label="Leave stream"
        className="p-3 rounded-full bg-gray-800/80 text-white hover:bg-gray-700 transition-all"
      >
        <PhoneOff size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
