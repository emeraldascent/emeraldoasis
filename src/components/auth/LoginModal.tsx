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
  '/ea-logo.jpg';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = 'email_check' | 'login' | 'claim' | 'reset';

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('email_check');

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      // 1. Check if they have an active Supabase user account via an RPC or sign-in attempt
      // We'll do a dummy sign in with a bad password to see if the user exists
      const { error: dummyError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-check-12345',
      });

      if (dummyError && dummyError.message.includes('Invalid login credentials')) {
        // The user exists in Supabase (has an account). They just need to enter their password.
        setMode('login');
      } else {
        // The user likely doesn't exist in Supabase auth yet.
        // Let's check if they exist in JotForm submissions to claim.
        const { data: jotformMatch } = await supabase
          .from('jotform_submissions')
          .select('id')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (jotformMatch) {
          // Found JotForm! They can set a password to claim it.
          setMode('claim');
        } else {
          // No Supabase user, no JotForm submission. They need to sign up.
          setError("We couldn't find a membership for this email.");
        }
      }
    } catch (err: any) {
      console.error("Email check error:", err);
      setError("An error occurred checking your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError('Invalid password. Please try again or reset your password.');
      return;
    }

    // Login successful
    if (authData.user) {
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

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      await new Promise(resolve => setTimeout(resolve, 500));
      const created = await matchJotformAndCreateMember(signUpData.user.id, email);
      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate(created ? '/welcome' : '/dashboard');
    } else {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });

    setLoading(false);

    if (resetError) {
      setError('Error sending reset link. Please try again.');
    } else {
      setSuccess('Check your email for a password reset link.');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setMode('email_check');
    setError('');
    setSuccess('');
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
              {mode === 'email_check' && 'Find Your Account'}
              {mode === 'login' && 'Welcome Back'}
              {mode === 'claim' && 'Set Up Your Account'}
              {mode === 'reset' && 'Reset Password'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-1">
          {error && (
            <div className="text-sm p-3 rounded-lg text-center text-red-600 bg-red-50 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm p-3 rounded-lg text-center text-green-700 bg-green-50 mb-4">
              {success}
            </div>
          )}

          {mode === 'email_check' && (
            <form onSubmit={checkEmail} className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-2">
                Enter the email you used to sign the PMA.
              </p>
              <div className="space-y-2">
                <Label htmlFor="check-email">Email</Label>
                <Input
                  id="check-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-white rounded-lg font-medium"
                style={{ backgroundColor: 'var(--ea-emerald)' }}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Continue'}
              </Button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => { setError(''); setMode('reset'); }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Forgot password?
                  </button>
                </div>
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
          )}

          {mode === 'claim' && (
            <form onSubmit={handleClaim} className="space-y-4">
              <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg text-center mb-2">
                We found your PMA! Create a password below to set up your app account.
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-email">Email</Label>
                <Input
                  id="claim-email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-password">Create Password</Label>
                <Input
                  id="claim-password"
                  type="password"
                  placeholder="Create your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-white rounded-lg font-medium"
                style={{ backgroundColor: 'var(--ea-emerald)' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Set Password & Enter'}
              </Button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-2">
                We'll send you a link to reset your password.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-white rounded-lg font-medium"
                style={{ backgroundColor: 'var(--ea-emerald)' }}
                disabled={loading || !!success}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-lg font-medium"
                onClick={() => { setError(''); setSuccess(''); setMode('login'); }}
              >
                Back to Login
              </Button>
            </form>
          )}
        </div>

        {mode === 'email_check' && (
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

        {mode !== 'email_check' && (
          <div className="text-center pt-2 pb-1">
            <button
              onClick={() => {
                setMode('email_check');
                setPassword('');
                setError('');
              }}
              className="text-xs font-medium text-gray-400 hover:text-gray-600"
            >
              ← Use a different email
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
