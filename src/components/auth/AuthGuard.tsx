import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { Button } from '../ui/button';
import { LoginModal } from './LoginModal';

const LOGO_URL =
  '/ea-logo.jpg';

interface AuthGuardProps {
  user: User | null;
  loading: boolean;
  children: React.ReactNode;
}

export function AuthGuard({ user, loading, children }: AuthGuardProps) {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: 'var(--ea-emerald)' }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-5">
          <img
            src={LOGO_URL}
            alt="Emerald Oasis"
            className="w-16 h-16 rounded-full object-cover mx-auto"
          />
          <div>
            <h2
              className="text-base font-semibold mb-1"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'var(--ea-midnight)',
              }}
            >
              Sign in to access your membership
            </h2>
            <p className="text-xs text-gray-400">
              Members enjoy booking, property access, and more
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => setLoginOpen(true)}
              className="w-full h-11 text-white font-medium rounded-lg"
              style={{ backgroundColor: 'var(--ea-emerald)' }}
            >
              Sign In
            </Button>
            <button
              onClick={() => navigate('/join')}
              className="text-xs font-medium block mx-auto"
              style={{ color: 'var(--ea-spirulina)' }}
            >
              Not a member? Join here →
            </button>
          </div>
        </div>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </div>
    );
  }

  return <>{children}</>;
}
