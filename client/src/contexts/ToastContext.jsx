import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, status = 'info', duration = 3000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, description, status }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white min-w-[250px] transition-all ${
              t.status === 'error' ? 'bg-red-500' :
              t.status === 'success' ? 'bg-green-500' :
              t.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            }`}
          >
            <div className="font-bold">{t.title}</div>
            {t.description && <div className="mt-1 opacity-90 text-xs">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
