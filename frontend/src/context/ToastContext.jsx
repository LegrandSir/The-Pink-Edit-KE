import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', duration = 3200) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-sm shadow-2xl border text-xs tracking-wide ${
                toast.type === 'error'
                  ? 'bg-[#2B1218] text-rose-100 border-rose-800/60'
                  : toast.type === 'info'
                  ? 'bg-white text-[#141414] border-stone-200'
                  : 'bg-[#141414] text-[#FAF8F6] border-stone-800'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-[#C86D85] shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#E8B4BC] shrink-0" />
              )}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);