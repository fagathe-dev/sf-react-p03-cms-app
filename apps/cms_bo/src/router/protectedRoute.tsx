// src/router/protectedRoute.tsx
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/types';
import { Loading } from '@/ui/components/Feedback/Loading';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  minRole?: UserRole;
  redirectTo?: string;
}

export const ProtectedRoute = ({ minRole = 'ROLE_CONTRIBUTOR', redirectTo = '/' }: ProtectedRouteProps) => {
  const { token, isLoading } = useAuthStore();
  const { isGranted } = usePermissions();

  if (isLoading) {
    return (
      <div style={{ display: 'grid', height: '100vh', placeItems: 'center' }}>
        <Loading size="lg" label="Vérification de la session…" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (minRole && !isGranted(minRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
