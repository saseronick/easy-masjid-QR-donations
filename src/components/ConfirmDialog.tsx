import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmDialogProps) {
  const colors = {
    danger: 'bg-rose-600 hover:bg-rose-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-rose-100' : type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
            <AlertTriangle className={`w-6 h-6 ${type === 'danger' ? 'text-rose-600' : type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-700">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-3 min-h-[48px] min-w-[48px] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 min-h-[48px] ${colors[type]} text-white rounded-lg transition-colors font-medium`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 min-h-[48px] bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
