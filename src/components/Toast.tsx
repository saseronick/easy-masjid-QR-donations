import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle,
  };

  const styles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  const Icon = icons[type];

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${styles[type]} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md animate-slide-up`}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <p className="font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-3 min-h-[48px] min-w-[48px] hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex items-center justify-center"
        aria-label="Close notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
