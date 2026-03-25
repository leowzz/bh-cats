import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

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

export function AppProviders({ children, authInitialState }: PropsWithChildren<{ authInitialState?: Partial<AuthState> }>) {
  const client = useMemo(() => new QueryClient(), []);
  return (
    <QueryClientProvider client={client}>
      <AuthProvider initialState={authInitialState}>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
