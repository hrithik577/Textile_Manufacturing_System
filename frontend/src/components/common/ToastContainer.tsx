import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();
  const navigate = useNavigate();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          danger: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-teal-400 shrink-0" />,
        };

        const bgColors = {
          success: 'bg-slate-900 border-emerald-500/50 shadow-emerald-950/30',
          danger: 'bg-slate-900 border-rose-500/50 shadow-rose-950/30',
          warning: 'bg-slate-900 border-amber-500/50 shadow-amber-950/30',
          info: 'bg-slate-900 border-teal-500/50 shadow-teal-950/30',
        };

        return (
          <div
            key={toast.id}
            className={clsx(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl text-slate-100 transition-all duration-300 animate-in slide-in-from-bottom-5',
              bgColors[toast.type]
            )}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white font-display">{toast.title}</h4>
              {toast.message && (
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>
              )}
              {toast.actionUrl && (
                <button
                  onClick={() => {
                    removeToast(toast.id);
                    navigate(toast.actionUrl!);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 underline underline-offset-2"
                >
                  <span>{toast.actionLabel || 'View Details'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
