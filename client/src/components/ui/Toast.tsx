import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: 'bg-success/10 text-success-dark dark:text-success border-success/20',
  error: 'bg-error/10 text-error-dark dark:text-error border-error/20',
  warning: 'bg-warning/10 text-warning-dark dark:text-warning border-warning/20',
  info: 'bg-info/10 text-info-dark dark:text-info border-info/20',
};

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-elevated animate-slide-up',
                styles[t.type],
              )}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm flex-1">{t.message}</p>
              <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
