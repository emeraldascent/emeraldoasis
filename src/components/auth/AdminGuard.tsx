import { Navigate } from 'react-router-dom';

interface AdminGuardProps {
  isAdmin: boolean;
  loading: boolean;
  children: React.ReactNode;
}

export function AdminGuard({ isAdmin, loading, children }: AdminGuardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--ea-emerald)' }} />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
