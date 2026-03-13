import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const LOGO_URL = '/ea-logo.jpg';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the auth link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || 'Error updating password.');
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ea-birch)' }}>
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--ea-birch)] flex items-center justify-center p-1.5 border border-gray-100 shadow-sm">
            <img src={LOGO_URL} alt="Emerald Oasis" className="w-full h-full object-cover mix-blend-multiply rounded-full" />
          </div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}>
            Set New Password
          </h1>
        </div>

        {success ? (
          <div className="text-sm p-3 rounded-lg text-center text-green-700 bg-green-50">
            ✅ Password updated! Redirecting to your dashboard...
          </div>
        ) : !ready ? (
          <div className="text-sm text-gray-500 text-center">
            Processing your reset link...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm p-3 rounded-lg text-center text-red-600 bg-red-50">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full h-11 text-white rounded-lg font-medium" style={{ backgroundColor: 'var(--ea-emerald)' }} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
