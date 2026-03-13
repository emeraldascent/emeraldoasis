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
import { supabase } from '@/integrations/supabase/client';

const LOGO_URL = '/ea-logo.jpg';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postJotform?: boolean;
}

type AuthMode = 'email_check' | 'login' | 'claim' | 'reset';

export function LoginModal({ open, onOpenChange, postJotform = false }: LoginModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>(postJotform ? 'claim' : 'email_check');
  const [jotformData, setJotformData] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setMode(postJotform ? 'claim' : 'email_check');
    }
  }, [open, postJotform]);

  // Step 1: Check email — existing account or JotForm submission?
  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // First check for a PMA/JotForm record.
      // If found, always start in claim mode.
      // If an auth account already exists, handleClaim will gracefully switch to login.
      const { data: jotformMatch, error: jotformError } = await supabase
        .from('jotform_submissions')
        .select('*')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jotformError) {
        console.error('JotForm lookup error:', jotformError);
      }

      if (jotformMatch) {
        setJotformData(jotformMatch);
        setMode('claim');
      } else {
        // Fallback path for non-JotForm accounts
        setMode('login');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Login with existing password
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
      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate('/dashboard');
    }
  };

  // Claim account — create Supabase auth + member record
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setLoading(false);
        setMode('login');
        setPassword('');
        setError('An account with this email already exists. Enter your password.');
        return;
      }
      setLoading(false);
      setError(signUpError.message || 'Error creating account.');
      return;
    }

    if (signUpData.user) {
      // Member record creation is handled by useMember hook's matchJotformAndCreateMember
      // Just close the modal and navigate — the hook will auto-create the member record
      setLoading(false);
      onOpenChange(false);
      resetForm();
      navigate('/welcome');
    } else {
      setLoading(false);
    }
  };

  // Password reset via custom Gmail SMTP edge function
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-reset-email', {
        body: { email: email.toLowerCase().trim() },
      });

      setLoading(false);
      if (fnError || data?.error) {
        setError('Error sending reset link. Please try again.');
      } else {
        setSuccess('Check your email for a password reset link.');
      }
    } catch {
      setLoading(false);
      setError('Error sending reset link. Please try again.');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setJotformData(null);
    setMode(postJotform ? 'claim' : 'email_check');
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

          {/* EMAIL CHECK */}
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

          {/* LOGIN */}
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

          {/* CLAIM / CREATE ACCOUNT */}
          {mode === 'claim' && (
            <form onSubmit={handleClaim} className="space-y-4">
              {postJotform ? (
                <p className="text-sm text-gray-500 text-center mb-2">
                  Your PMA is complete! Enter your email and create a password for the app.
                </p>
              ) : (
                <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg text-center mb-2">
                  ✅ We found your PMA membership! Create a password below.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="claim-email">Email</Label>
                <Input
                  id="claim-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={!!jotformData}
                  className={jotformData ? 'bg-gray-50 text-gray-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-password">Create Password</Label>
                <Input
                  id="claim-password"
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

          {/* RESET */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-2">
                We'll send a link to reset your password.
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
              onClick={() => { onOpenChange(false); navigate('/join'); }}
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
              onClick={() => { setMode('email_check'); setPassword(''); setError(''); setJotformData(null); }}
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
