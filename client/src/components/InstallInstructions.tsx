import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";

interface InstallInstructionsProps {
  className?: string;
  buttonClassName?: string;
  icon?: ReactNode;
}

export default function InstallInstructions({ className = "", buttonClassName = "", icon }: InstallInstructionsProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setShow((v) => !v)}
        className={buttonClassName || "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white/15 border border-white/20 px-5 text-sm font-medium text-white hover:bg-white/25 transition-all duration-200"}
      >
        {icon || <Download size={14} />}
        Download App
      </button>

      {show && (
        <div className="mt-3 text-left w-full">
          <div className="rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700 px-4 py-3.5 shadow-sm">
            <p className="text-[11px] font-bold text-gray-700 dark:text-white/90 uppercase tracking-wider text-center sm:text-left">How to install</p>
            <ol className="mt-2 space-y-1.5 text-[12px] text-gray-600 dark:text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">1.</span>
                <span>Open glowup.app in your browser (Chrome, Safari, or Edge)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">2.</span>
                <span>Tap the browser menu <span className="text-gray-500 font-bold">&#8942;</span> or look for the install icon in the address bar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">3.</span>
                <span>Select <span className="font-semibold text-gray-800 dark:text-white">"Install"</span> or <span className="font-semibold text-gray-800 dark:text-white">"Add to Home Screen"</span></span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}