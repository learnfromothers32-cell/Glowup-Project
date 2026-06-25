import { useState, useEffect } from "react";
import { X, Share, Plus, Smartphone } from "lucide-react";

export function PwaInstallModal({
  open,
  onClose,
  isIOS,
  isAndroid,
}: {
  open: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mb-5 mx-auto">
          <Smartphone size={24} className="text-white" />
        </div>

        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
          Install GlowUp
        </h3>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          Add GlowUp to your home screen for the best experience.
        </p>

        {isIOS ? (
          <div className="space-y-3">
            <Step num={1} text="Tap the Share button in Safari" icon={<Share size={16} />} />
            <Step num={2} text='Scroll down and tap "Add to Home Screen"' icon={<Plus size={16} />} />
            <Step num={3} text='Tap "Add" in the top right corner' icon={<Plus size={16} />} />
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
              The app will appear on your home screen
            </p>
          </div>
        ) : isAndroid ? (
          <div className="space-y-3">
            <Step num={1} text='Tap the 3-dot menu in Chrome' icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>} />
            <Step num={2} text='Tap "Install app" or "Add to Home Screen"' icon={<Plus size={16} />} />
            <Step num={3} text="Confirm the installation" icon={<Smartphone size={16} />} />
          </div>
        ) : (
          <div className="space-y-3">
            <Step num={1} text="Click the install icon in your browser's address bar" icon={<Smartphone size={16} />} />
            <Step num={2} text='Or open the menu and click "Install GlowUp"' icon={<Plus size={16} />} />
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function Step({
  num,
  text,
  icon,
}: {
  num: number;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0 text-xs font-bold">
        {num}
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
      </div>
    </div>
  );
}
