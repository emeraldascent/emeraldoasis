import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function WelcomeConfirmation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <span className="text-5xl mb-4">🌿</span>
      <h1
        className="text-xl text-center mb-2"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-emerald)' }}
      >
        Welcome to the Oasis!
      </h1>
      <p className="text-xs text-gray-500 text-center mb-8">
        Your membership is active. You're part of the community.
      </p>

      {/* Welcome Credits Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-5 border"
        style={{
          background: 'linear-gradient(135deg, var(--ea-emerald), var(--ea-spirulina))',
          borderColor: 'var(--ea-emerald)',
        }}
      >
        <div className="text-center mb-4">
          <p className="text-white font-semibold text-sm flex items-center justify-center gap-2">
            🎁 Your Welcome Credits
          </p>
          <p className="text-white/80 text-[10px]">On us — valid for 30 days</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <span className="text-2xl block mb-1">🥾</span>
            <p className="text-white text-xs font-semibold">2-Hour Day Pass</p>
            <p className="text-white/70 text-[9px]">$4 value · FREE</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <span className="text-2xl block mb-1">📅</span>
            <p className="text-white text-xs font-semibold">$10 Event Credit</p>
            <p className="text-white/70 text-[9px]">Any recurring event</p>
          </div>
        </div>

        <p className="text-white/60 text-[9px] text-center mt-3">
          Expires 30 days from signup
        </p>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-3 mt-8">
        <Button
          onClick={() => navigate('/book')}
          className="w-full h-12 text-white font-medium rounded-lg"
          style={{ backgroundColor: 'var(--ea-spirulina)' }}
        >
          Book Your First Visit →
        </Button>
        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full h-12 font-medium rounded-lg"
          style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-midnight)' }}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
