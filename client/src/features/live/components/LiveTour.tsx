import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Gift, MessageCircle, UserPlus, X } from "lucide-react";

const STORAGE_KEY = "opencode-live-tour-completed";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight: string;
}

const STEPS: Step[] = [
  {
    title: "Follow the Stylist",
    description: "Tap Follow to stay updated when this stylist goes live or shares new content.",
    icon: <UserPlus size={28} />,
    highlight: "bottom-left",
  },
  {
    title: "Send Gifts",
    description: "Show your appreciation! Tap the Gift button to send virtual gifts.",
    icon: <Gift size={28} />,
    highlight: "right",
  },
  {
    title: "Double-Tap to Like",
    description: "Double-tap anywhere on the video to send hearts and show your support.",
    icon: <Heart size={28} />,
    highlight: "center",
  },
  {
    title: "Chat with Viewers",
    description: "Join the conversation! Tap Chat to discuss with the stylist and others.",
    icon: <MessageCircle size={28} />,
    highlight: "right",
  },
];

interface Props {
  onComplete: () => void;
}

export function LiveTour({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  const isComplete = () => {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === "true";
  };

  const done = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete();
  };

  const current = STEPS[step];
  const total = STEPS.length;

  if (isComplete()) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-none"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={done} />

        {/* Highlight ring */}
        <motion.div
          key={current.highlight}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute pointer-events-none"
          style={
            current.highlight === "bottom-left"
              ? { bottom: 80, left: 12, width: 180, height: 56, borderRadius: 28, boxShadow: "0 0 0 4px rgba(254,44,85,0.8), 0 0 20px rgba(254,44,85,0.4)" }
              : current.highlight === "right"
              ? { bottom: 120, right: 4, width: 56, height: 260, borderRadius: 28, boxShadow: "0 0 0 4px rgba(168,85,247,0.8), 0 0 20px rgba(168,85,247,0.4)" }
              : { top: "40%", left: "50%", width: 120, height: 120, borderRadius: "50%", transform: "translate(-50%, -50%)", boxShadow: "0 0 0 4px rgba(239,68,68,0.8), 0 0 30px rgba(239,68,68,0.4)" }
          }
        />

        {/* Card */}
        <motion.div
          key={`card-${step}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative mx-4 mb-6 px-5 pt-5 pb-4 rounded-2xl pointer-events-auto"
          style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Close */}
          <button
            onClick={done}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-white/40" />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(254,44,85,0.15)", color: "#FE2C55" }}
            >
              {current.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-base mb-0.5">{current.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{current.description}</p>
            </div>
          </div>

          {/* Progress + nav */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    background: i === step ? "#FE2C55" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={done}
                className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  if (step < total - 1) {
                    setStep((s) => s + 1);
                  } else {
                    done();
                  }
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{ background: "#FE2C55", color: "white" }}
              >
                {step < total - 1 ? "Next" : "Got it"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
