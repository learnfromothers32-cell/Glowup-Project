import { X, Download, Share, Plus, CheckCircle, ArrowRight, Smartphone } from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall";

interface PwaInstallModalProps {
  open: boolean;
  onClose: () => void;
  isIOS?: boolean;
  isAndroid?: boolean;
}

export default function PwaInstallModal({ open, onClose, isIOS, isAndroid }: PwaInstallModalProps) {
  const { promptInstall } = usePwaInstall();

  if (!open) return null;

  const handleInstall = async () => {
    if (isAndroid) {
      const result = await promptInstall();
      if (result) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      {/* Modal - bottom sheet on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-surface-dark-secondary shadow-2xl overflow-hidden sm:rounded-3xl rounded-t-3xl animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4 sm:px-6 sm:py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20">
              <Smartphone size={20} className="text-white sm:hidden" />
              <Download size={24} className="text-white hidden sm:block" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold">Install GlowUp</h3>
              <p className="text-[11px] sm:text-xs text-white/70 mt-0.5">Quick access from your home screen</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {isIOS ? (
            <div className="space-y-3.5">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                Install in 3 easy steps:
              </p>
              {[
                { icon: Share, step: "1", title: "Tap Share", desc: "Tap the share button at the bottom of Safari" },
                { icon: Plus, step: "2", title: 'Tap "Add to Home Screen"', desc: "Scroll down and select this option" },
                { icon: CheckCircle, step: "3", title: 'Tap "Add"', desc: "Confirm to install GlowUp" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30">
                    <item.icon size={16} className="text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{item.step}</span>
                </div>
              ))}
            </div>
          ) : isAndroid ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                One tap to install:
              </p>
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-sm hover:bg-brand-600 hover:shadow-glow-sm active:scale-[0.98] transition-all duration-200"
              >
                <Download size={16} />
                Install Now
              </button>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                <CheckCircle size={12} className="text-success shrink-0" />
                <span>Free · No account needed · Takes 5 seconds</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 px-4 py-3">
                <Smartphone size={18} className="text-brand-500 shrink-0" />
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Open this page on your phone to install the app.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-3 text-center">
                  <p className="text-[10px] text-gray-400 mb-1">Scan QR code</p>
                  <div className="h-16 w-16 mx-auto rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <span className="text-[8px] text-gray-400">QR Code</span>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-3 text-center">
                  <p className="text-[10px] text-gray-400 mb-1">Or visit</p>
                  <p className="text-xs font-bold text-brand-500">glowup.app</p>
                  <p className="text-[10px] text-gray-400 mt-1">on your phone</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile drag indicator */}
        <div className="flex justify-center pb-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
      </div>
    </div>
  );
}
