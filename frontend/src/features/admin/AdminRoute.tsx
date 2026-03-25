import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../app/providers';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  return role === 'admin' ? children : <Navigate to="/login" replace />;
}
