import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { GateCheck } from '../components/admin/GateCheck';
import { MemberRoster } from '../components/admin/MemberRoster';
import { AdminOverview } from '../components/admin/AdminOverview';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Users, BarChart3, Lock } from 'lucide-react';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || 'oasis2026';
const ADMIN_EMAIL = 'emeraldoasiscamp@gmail.com';
const SESSION_KEY = 'eo-admin-pin-auth';

interface AdminProps {
  userEmail?: string | null;
}

export function Admin({ userEmail }: AdminProps) {
  const [pinAuthed, setPinAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Bypass PIN for admin email
    if (userEmail === ADMIN_EMAIL) {
      setPinAuthed(true);
      return;
    }
    // Check session
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setPinAuthed(true);
    }
  }, [userEmail]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setPinAuthed(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
      setError('');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  // PIN gate
  if (!pinAuthed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--ea-birch)' }}
          >
            <Lock size={24} style={{ color: 'var(--ea-emerald)' }} />
          </div>
          <div>
            <h2
              className="text-base font-semibold mb-1"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'var(--ea-midnight)',
              }}
            >
              Staff Access
            </h2>
            <p className="text-xs text-gray-400">Enter PIN to continue</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
            )}
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full h-11 text-white font-medium rounded-lg"
              style={{ backgroundColor: 'var(--ea-emerald)' }}
            >
              Enter
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5">
        <h1
          className="text-lg text-center mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
        >
          Admin Panel
        </h1>

        <Tabs defaultValue="gate" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="gate" className="text-xs gap-1">
              <Search size={14} />
              Gate Check
            </TabsTrigger>
            <TabsTrigger value="roster" className="text-xs gap-1">
              <Users size={14} />
              Roster
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs gap-1">
              <BarChart3 size={14} />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gate">
            <GateCheck />
          </TabsContent>

          <TabsContent value="roster">
            <MemberRoster />
          </TabsContent>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
