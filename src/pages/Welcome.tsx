import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { LoginModal } from '../components/auth/LoginModal';
import { useMember } from '../hooks/useMember';

const LOGO_URL = '/ea-logo.jpg';

const HERO_PHOTOS = [
  '/photos/creek-rocks.jpg',
  '/photos/forest-camp.jpg',
  '/photos/spring-water.jpg',
  '/photos/terrace.jpg',
];

export function Welcome() {
  const navigate = useNavigate();
  const { user } = useMember();
  const [loginOpen, setLoginOpen] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  const handleBook = () => {
    if (user) {
      navigate('/book');
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero with background image */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(19,105,75,0.75) 0%, rgba(40,140,111,0.75) 100%), url("${HERO_PHOTOS[heroIdx]}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.6s ease-in-out',
        }}
      >
        {/* Logo */}
        <div className="w-28 h-28 rounded-full overflow-hidden bg-ea-birch mb-4 border-2 border-white/30 shadow-lg flex items-center justify-center p-1">
          <img
            src={LOGO_URL}
            alt="Emerald Oasis"
            className="w-full h-full object-cover rounded-full mix-blend-multiply"
          />
        </div>

        <h1
          className="text-[22px] text-white text-center mb-2 font-serif"
        >
          Welcome to the Oasis
        </h1>
        <p className="text-xs text-white/85 text-center mb-5">
          Private wellness sanctuary in the Blue Ridge Mountains
        </p>

        {/* Photo dots */}
        <div className="flex gap-1.5 mb-6">
          {HERO_PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === heroIdx ? 'bg-white scale-110' : 'bg-white/40'}`}
            />
          ))}
        </div>

        <div className="w-full max-w-xs space-y-2.5">
          <Button
            onClick={() => navigate('/join')}
            className="w-full h-12 text-white font-medium rounded-lg bg-ea-emerald hover:bg-ea-emerald/90"
          >
            Become a Member
          </Button>
          <Button
            onClick={() => setLoginOpen(true)}
            className="w-full h-12 font-medium rounded-lg bg-white text-ea-midnight hover:bg-white/90"
          >
            Sign In
          </Button>
          <Button
            onClick={handleBook}
            className="w-full h-12 text-white font-medium rounded-lg bg-ea-spirulina hover:bg-ea-spirulina/90"
          >
            Book an Experience
          </Button>
        </div>
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
        <button
          onClick={() => navigate('/admin')}
          className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          Staff Login
        </button>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
