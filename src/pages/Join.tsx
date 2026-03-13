import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/auth/LoginModal';

const LOGO_URL = '/ea-logo.jpg';

export function Join() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [showRedirectNotice, setShowRedirectNotice] = useState(false);

  useEffect(() => {
    // Listen for JotForm's postMessage when the form is submitted
    const handleMessage = (event: MessageEvent) => {
      // Prevent parent window from being redirected
      if (typeof event.data === 'string' && event.data.includes('setHeight')) {
        return;
      }
      
      // If the form redirects or completes, JotForm sometimes sends a specific message
      if (event.data === 'formCompleted' || event.data?.action === 'submission-completed') {
        setShowRedirectNotice(true);
        // Automatically open the login modal after a short delay so they can claim their account
        setTimeout(() => {
          setLoginOpen(true);
        }, 1000);
      }
    };

    window.addEventListener('message', handleMessage);

    // Prevent any internal iframe redirects from forcing the parent window to navigate
    window.onbeforeunload = function() {
        if (!showRedirectNotice && document.activeElement && document.activeElement.tagName === 'IFRAME') {
            setShowRedirectNotice(true);
            setLoginOpen(true);
            return false;
        }
    };

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
      window.onbeforeunload = null;
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [showRedirectNotice]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Branding header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 relative z-10 bg-white">
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

      {showRedirectNotice ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gray-50">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}>
            Membership Confirmed!
          </h2>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            Your PMA is signed and payment is complete. Let's set up your app password so you can access your dashboard.
          </p>
          <button 
            onClick={() => setLoginOpen(true)}
            className="px-6 py-3 text-white rounded-lg font-medium shadow-sm mt-4"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            Set Up Account Password
          </button>
        </div>
      ) : (
        <div className="flex-1 w-full bg-gray-50 relative">
          {/* Using explicit sandbox to prevent top-level navigation while keeping popups alive for payments */}
          <iframe
            id="JotFormIFrame-251564463545057"
            title="Emerald Oasis Membership Signup"
            src="https://form.jotform.com/251564463545057?isIframeEmbed=1"
            className="w-full border-0"
            style={{ minWidth: '100%', maxWidth: '100%', height: '800px', minHeight: '80vh' }}
            allowFullScreen={true}
            sandbox="allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            allow="geolocation; microphone; camera; fullscreen; payment; autoplay; clipboard-write; display-capture"
          />
        </div>
      )}

      {/* Footer links */}
      <div className="px-4 py-4 border-t border-gray-100 text-center space-y-2 bg-white relative z-10">
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
