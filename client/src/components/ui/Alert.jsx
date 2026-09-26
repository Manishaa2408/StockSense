import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export default function Alert({ type = 'info', message, onClose, className = '' }) {
  const styles = {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: <CheckCircle className="h-5 w-5 text-emerald-400" /> },
    error: { bg: 'bg-red-50', text: 'text-red-800', icon: <XCircle className="h-5 w-5 text-red-400" /> },
    warning: { bg: 'bg-amber-50', text: 'text-amber-800', icon: <AlertTriangle className="h-5 w-5 text-amber-400" /> },
    info: { bg: 'bg-blue-50', text: 'text-blue-800', icon: <Info className="h-5 w-5 text-blue-400" /> },
  };

  const style = styles[type];

  return (
    <div className={`rounded-lg p-4 ${style.bg} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${style.text}`}>{message}</p>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.text} hover:opacity-75`}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
