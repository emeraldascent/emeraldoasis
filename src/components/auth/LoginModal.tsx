import { useState, useEffect } from 'react';
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

const LOGO_URL = '/ea-logo.jpg';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postJotform?: boolean;
}

type AuthMode = 'email_check' | 'login' | 'create_account' | 'reset';

export function LoginModal({ open, onOpenChange, postJotform = false }: LoginModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>(postJotform ? 'create_account' : 'email_check');

  useEffect(() => {
    if (open) {
      setMode(postJotform ? 'create_account' : 'email_check');
    }
  }, [open, postJotform]);

  // Step 1: Check email — does this person have a Supabase auth account?
  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      // Try to sign in with a dummy password to see if the user exists
      const { error: dummyError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-check-12345',
      });

      if (dummyError && dummyError.message.includes('Invalid login credentials')) {
        // User EXISTS in Supabase — they have an account, need to enter password
        setMode('login');
      } else {
        // User does NOT exist — let them create an account
        setMode('create_account');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Login with existing password
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
      setError('Invalid password. Try again or reset your password.');
      return;
    }

    if (authData.user) {
      // Check if they have a member record; if not, create a basic one
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (!existingMember) {
        await createBasicMember(authData.user.id, email);
      }

      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate(existingMember ? '/dashboard' : '/welcome');
    } else {
      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate('/dashboard');
    }
  };

  // Step 2b: Create new account (used after JotForm completion OR for new users)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      // If user already exists, switch to login mode
      if (signUpError.message.includes('already registered')) {
        setLoading(false);
        setMode('login');
        setPassword('');
        setError('An account with this email already exists. Please enter your password.');
        return;
      }
      setLoading(false);
      setError(signUpError.message || 'Error creating account.');
      return;
    }

    if (signUpData.user) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await createBasicMember(signUpData.user.id, email);
      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate('/welcome');
    } else {
      setLoading(false);
    }
  };

  // Create a basic member record directly (no jotform_submissions lookup needed)
  const createBasicMember = async (userId: string, memberEmail: string) => {
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    await supabase.from('members').insert({
      user_id: userId,
      email: memberEmail.toLowerCase(),
      first_name: '',
      last_name: '',
      phone: '',
      emergency_contact: '',
      license_plate: null,
      photo_url: null,
      membership_tier: 'monthly',
      membership_start: now.toISOString(),
      membership_end: thirtyDaysLater.toISOString(),
      pma_agreed: true,
      pma_agreed_at: now.toISOString(),
      source: 'app',
    });
  };

  // Password reset
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
    setMode(postJotform ? 'create_account' : 'email_check');
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
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--ea-birch)] flex items-center justify-center p-1.5 border border-gray-100 shadow-sm">
              <img
                src={LOGO_URL}
                alt="Emerald Oasis"
                className="w-full h-full object-cover mix-blend-multiply rounded-full"
              />
            </div>
            <DialogTitle
              className="text-center text-lg mt-1"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'var(--ea-midnight)',
              }}
            >
              {mode === 'email_check' && 'Find Your Account'}
              {mode === 'login' && 'Welcome Back'}
              {mode === 'create_account' && 'Create Your Account'}
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

          {/* EMAIL CHECK MODE */}
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

          {/* LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" value={email} disabled className="bg-gray-50 text-gray-500" />
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

          {/* CREATE ACCOUNT MODE */}
          {mode === 'create_account' && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-2">
                Enter your email and create a password for the app.
              </p>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Create Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Create your password"
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
                {loading ? 'Creating Account...' : 'Create Account & Enter'}
              </Button>
            </form>
          )}

          {/* RESET MODE */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-2">
                We'll send you a link to reset your password.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={email} disabled className="bg-gray-50 text-gray-500" />
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
