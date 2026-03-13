import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { LoginModal } from '../components/auth/LoginModal';

export function Welcome() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-16"
        style={{
          background: 'linear-gradient(160deg, var(--ea-emerald) 0%, var(--ea-spirulina) 100%)',
        }}
      >
        <span className="text-[32px] mb-3">🌿</span>
        <h1
          className="text-[22px] text-white text-center mb-2"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Welcome to the Oasis
        </h1>
        <p className="text-xs text-white/85 text-center mb-8">
          Private wellness sanctuary in the Blue Ridge Mountains
        </p>

        <div className="w-full max-w-xs space-y-2.5">
          <Button
            onClick={() => navigate('/join')}
            className="w-full h-12 text-white font-medium rounded-lg"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            Become a Member
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full h-12 font-medium rounded-lg"
            style={{ backgroundColor: 'white', color: 'var(--ea-midnight)' }}
          >
            Member Dashboard
          </Button>
          <Button
            onClick={() => navigate('/book')}
            className="w-full h-12 text-white font-medium rounded-lg"
            style={{ backgroundColor: 'var(--ea-spirulina)' }}
          >
            Book an Experience
          </Button>
        </div>

        <button
          onClick={() => setLoginOpen(true)}
          className="mt-6 text-white/80 text-xs underline underline-offset-2 hover:text-white transition-colors"
        >
          Sign In
        </button>
      </div>

      {/* Bottom info */}
      <div className="bg-white px-6 py-4 text-center space-y-3">
        <p className="text-[11px] text-gray-400">
          67 acres at Mandala Springs · Sauna · Cold Plunge · Camping · Trails
        </p>
        <div className="border-t pt-3">
          <p className="text-[10px] text-gray-400">
            All visitors must be active members. Membership starts at $2/visit.
          </p>
        </div>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
