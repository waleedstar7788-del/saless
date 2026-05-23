import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { PermissionKey } from '../lib/permissions';

type Props = {
  permission: PermissionKey;
  children: React.ReactNode;
};

export default function PermissionRoute({ permission, children }: Props) {
  const { can, isApproved, profileLoaded, loading } = useAuth();

  if (loading || !profileLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isApproved) {
    return null;
  }

  if (!can(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
