import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

type ToastKind = 'default' | 'success' | 'error' | 'warning';
interface ToastMsg { id: number; kind: ToastKind; message: string; }
interface ToastCtx {
  toasts: ToastMsg[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

const Ctx = createContext<ToastCtx | undefined>(undefined);
let counter = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const push = useCallback((message: string, kind: ToastKind = 'default') => {
    const id = counter++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true" data-testid="toast-region">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role="status" data-testid={`toast-${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
