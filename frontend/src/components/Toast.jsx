import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl glass-card border animate-in slide-in-from-bottom-5 duration-200">
      {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
      {type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}

      <span className="text-sm font-medium text-slate-200 max-w-sm">{message}</span>

      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-white rounded transition ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
