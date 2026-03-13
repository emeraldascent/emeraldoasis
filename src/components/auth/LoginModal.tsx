import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { matchJotformAndCreateMember } from '../../hooks/useJotformMatch';

const LOGO_URL =
  'https://images.editor.website/1e8f26a8520008254993a388bf2e8b1b1fd494438000ba1f65a7540480f93584/Emerald%20Oasis%20Logo%20%281%29_1769720840.jpg';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError('Invalid email or password');
      return;
    }

    // Check for JotForm PMA submission match and auto-create member
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const created = await matchJotformAndCreateMember(authUser.id, authUser.email || email);
      onOpenChange(false);
      setEmail('');
      setPassword('');
      navigate(created ? '/welcome' : '/dashboard');
    } else {
      onOpenChange(false);
      setEmail('');
      setPassword('');
      navigate('/dashboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-xl">
        <DialogHeader>
          <div className="flex flex-col items-center gap-2 mb-1">
            <img
              src={LOGO_URL}
              alt="Emerald Oasis"
              className="w-14 h-14 rounded-full object-cover"
            />
            <DialogTitle
              className="text-center text-lg"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'var(--ea-midnight)',
              }}
            >
              Sign In
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 px-1">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-white rounded-lg font-medium"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center pt-2 pb-1">
          <button
            onClick={() => {
              onOpenChange(false);
              navigate('/join');
            }}
            className="text-xs font-medium"
            style={{ color: 'var(--ea-spirulina)' }}
          >
            Not a member yet? Join here →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
