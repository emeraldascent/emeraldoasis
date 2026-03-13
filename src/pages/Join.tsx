import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/auth/LoginModal';

const LOGO_URL =
  'https://images.editor.website/1e8f26a8520008254993a388bf2e8b1b1fd494438000ba1f65a7540480f93584/Emerald%20Oasis%20Logo%20%281%29_1769720840.jpg';
const JOTFORM_URL = 'https://form.jotform.com/251564463545057';

export function Join() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Branding header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <img
          src={LOGO_URL}
          alt="Emerald Oasis"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h1
            className="text-base font-semibold"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: 'var(--ea-midnight)',
            }}
          >
            Become a Member
          </h1>
          <p className="text-[10px] text-gray-400">
            Emerald Oasis · Private Membership Association
          </p>
        </div>
      </div>

      {/* JotForm iframe */}
      <div className="flex-1">
        <iframe
          src={JOTFORM_URL}
          title="Emerald Oasis Membership Signup"
          className="w-full border-0"
          style={{ minHeight: '80vh', height: '100%' }}
          allow="geolocation; camera"
        />
      </div>

      {/* Footer links */}
      <div className="px-4 py-4 border-t border-gray-100 text-center space-y-2">
        <button
          onClick={() => setLoginOpen(true)}
          className="text-xs font-medium block mx-auto"
          style={{ color: 'var(--ea-emerald)' }}
        >
          Already a member? Sign In
        </button>
        <button
          onClick={() => navigate('/book')}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors block mx-auto"
        >
          Book an Experience →
        </button>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
