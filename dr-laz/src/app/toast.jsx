// Dr Laz — minimal toast so action buttons give tactile feedback.
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((text) => {
    setMsg(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1900);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {msg && (
        <div style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', zIndex: 9999,
          maxWidth: '84%', padding: '12px 18px', borderRadius: 14,
          background: 'rgba(14,31,36,0.94)', color: '#fff',
          fontFamily: 'Manrope, sans-serif', fontSize: 13.5, fontWeight: 500,
          textAlign: 'center', lineHeight: 1.35,
          boxShadow: '0 8px 30px rgba(0,0,0,0.28)',
          animation: 'dl-fade-in 0.2s ease both',
        }}>{msg}</div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
