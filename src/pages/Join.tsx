import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/auth/LoginModal';

const LOGO_URL = '/ea-logo.jpg';

export function Join() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    // Listen for JotForm's postMessage when the form is submitted
    const handleMessage = (event: MessageEvent) => {
      // JotForm sends messages to the parent window
      if (typeof event.data === 'string' && event.data.includes('setHeight')) {
        // This is just a height resize message, ignore it
        return;
      }
      
      // If the form redirects or completes, JotForm sometimes sends a specific message
      // But more reliably, we can look for specific submission confirmation events
      if (event.data === 'formCompleted' || event.data.action === 'submission-completed') {
        // Optionally auto-redirect them or open the login modal
        console.log('JotForm submission completed');
      }
    };

    window.addEventListener('message', handleMessage);

    // Inject JotForm auto-resize script
    const script = document.createElement('script');
    script.src = 'https://form.jotform.com/s/umd/latest/for-form-embed-handler.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      if (window.jotformEmbedHandler) {
        // @ts-ignore
        window.jotformEmbedHandler("iframe[id='JotFormIFrame-251564463545057']", "https://form.jotform.com/");
      }
    };

    return () => {
      window.removeEventListener('message', handleMessage);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
      <div className="flex-1 w-full bg-gray-50">
        <iframe
          id="JotFormIFrame-251564463545057"
          title="Emerald Oasis Membership Signup"
          src="https://form.jotform.com/251564463545057"
          className="w-full border-0"
          style={{ minWidth: '100%', maxWidth: '100%', height: '800px', minHeight: '80vh' }}
          allowFullScreen={true}
          allow="geolocation; microphone; camera; fullscreen; payment; autoplay; clipboard-write"
          sandbox="allow-forms allow-scripts allow-popups allow-top-navigation-by-user-activation allow-same-origin"
        />
      </div>

      {/* Footer links */}
      <div className="px-4 py-4 border-t border-gray-100 text-center space-y-2 bg-white">
        <button
          onClick={() => setLoginOpen(true)}
          className="text-xs font-medium block mx-auto hover:underline"
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
