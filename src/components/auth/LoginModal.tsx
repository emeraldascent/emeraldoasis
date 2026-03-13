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
  const [mode, setMode] = useState<'login' | 'claim'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'claim') {
      // Trying to claim an existing JotForm submission by creating a new account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setLoading(false);
        setError(signUpError.message || 'Error creating account. Please try again.');
        return;
      }

      if (signUpData.user) {
        // Wait a brief moment for the Supabase session to fully propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        const created = await matchJotformAndCreateMember(signUpData.user.id, email);
        setLoading(false);
        onOpenChange(false);
        resetForm();
        navigate(created ? '/welcome' : '/dashboard');
      } else {
        setLoading(false);
      }
      return;
    }

    // Standard Login Mode
    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // If login failed, check if they have a JotForm submission but no auth account
      const { data: jotformMatch } = await supabase
        .from('jotform_submissions')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      setLoading(false);

      if (jotformMatch) {
        // They exist in JotForm but their password failed (likely because they don't have an auth account yet)
        setMode('claim');
        setError('We found your PMA! Create a password below to set up your app account.');
      } else {
        setError('Invalid email or password');
      }
      return;
    }

    // Login successful
    if (authData.user) {
      // Check if we need to auto-create their member record from JotForm
      const created = await matchJotformAndCreateMember(authData.user.id, authData.user.email || email);
      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate(created ? '/welcome' : '/dashboard');
    } else {
      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate('/dashboard');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setMode('login');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) resetForm();
    }}>
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
              {mode === 'login' ? 'Sign In' : 'Claim Your Account'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 px-1">
          {error && (
            <div className={`text-sm p-3 rounded-lg text-center ${mode === 'claim' ? 'bg-green-50 text-green-700' : 'text-red-600 bg-red-50'}`}>
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
              disabled={mode === 'claim'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">{mode === 'claim' ? 'Create a Password' : 'Password'}</Label>
            <Input
              id="login-password"
              type="password"
              placeholder={mode === 'claim' ? 'Create your new password' : 'Your password'}
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
            {loading ? (mode === 'login' ? 'Signing in...' : 'Creating Account...') : (mode === 'login' ? 'Sign In' : 'Set Password & Enter')}
          </Button>
        </form>

        {mode === 'login' && (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
