import { Navigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
  user: User | null;
  loading: boolean;
  children: React.ReactNode;
}

export function AuthGuard({ user, loading, children }: AuthGuardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--ea-emerald)' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
