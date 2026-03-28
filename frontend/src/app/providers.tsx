import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { APP_ERROR_EVENT, type AppErrorEventDetail } from '../lib/app-error';
import { getRole, getToken, setSession } from '../lib/auth';

export type Role = 'user' | 'admin' | null;

type AuthState = {
  token: string | null;
  role: Role;
};

type AuthContextValue = AuthState & {
  login: (token: string, role: Exclude<Role, null>) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOAST_DURATION_MS = 5000;

type ErrorToast = {
  id: number;
  message: string;
};

type ErrorToastContextValue = {
  notifyError: (message: string) => void;
  dismissError: (id: number) => void;
};

const ErrorToastContext = createContext<ErrorToastContextValue | null>(null);

export function AuthProvider({ children, initialState }: PropsWithChildren<{ initialState?: Partial<AuthState> }>) {
  const [auth, setAuth] = useState<AuthState>({
    token: initialState?.token ?? getToken(),
    role: initialState?.role ?? getRole()
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      login: (token, role) => {
        setSession(token, role);
        setAuth({ token, role });
      },
      logout: () => {
        setSession(null, null);
        setAuth({ token: null, role: null });
      }
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function ErrorToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ErrorToast[]>([]);
  const timersRef = useRef<Map<number, number>>(new Map());

  const dismissError = (id: number) => {
    const timer = timersRef.current.get(id);
    if (timer != null) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const notifyError = (message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message }]);
    const timer = window.setTimeout(() => dismissError(id), TOAST_DURATION_MS);
    timersRef.current.set(id, timer);
  };

  useEffect(() => {
    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorEventDetail>;
      if (customEvent.detail?.message) {
        notifyError(customEvent.detail.message);
      }
    };

    window.addEventListener(APP_ERROR_EVENT, handleError);
    return () => {
      window.removeEventListener(APP_ERROR_EVENT, handleError);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo<ErrorToastContextValue>(
    () => ({
      notifyError,
      dismissError
    }),
    []
  );

  return (
    <ErrorToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            aria-live="assertive"
            className="pointer-events-auto rounded-3xl border border-brick-300/70 bg-[#fff7f1] px-4 py-3 text-sm text-ink-900 shadow-card"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.28em] text-brick-500">请求失败</p>
                <p className="mt-1 leading-6">{toast.message}</p>
              </div>
              <button
                aria-label="关闭错误提示"
                className="rounded-full px-2 py-1 text-xs font-semibold text-brick-500 transition hover:bg-brick-100 hover:text-brick-700"
                onClick={() => dismissError(toast.id)}
                type="button"
              >
                关闭
              </button>
            </div>
          </div>
        ))}
      </div>
    </ErrorToastContext.Provider>
  );
}

export function AppProviders({ children, authInitialState }: PropsWithChildren<{ authInitialState?: Partial<AuthState> }>) {
  const client = useMemo(() => new QueryClient(), []);
  return (
    <QueryClientProvider client={client}>
      <ErrorToastProvider>
        <AuthProvider initialState={authInitialState}>{children}</AuthProvider>
      </ErrorToastProvider>
    </QueryClientProvider>
  );
}
