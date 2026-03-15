import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoginModal } from '../components/auth/LoginModal';

const LOGO_URL = '/ea-logo.jpg';

type Step = 'email' | 'already_member' | 'form' | 'completed';

export function Join() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('completed') === 'true') {
      setStep('completed');
    }

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string' && event.data.includes('setHeight')) return;
      if (event.data === 'formCompleted' || event.data?.action === 'submission-completed') {
        setStep('completed');
      }
    };
    window.addEventListener('message', handleMessage);

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
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [location.search]);

  const checkEmail = async () => {
    if (!email.trim()) return;
    setChecking(true);
    const { data: exists } = await supabase
      .rpc('jotform_email_exists', { _email: email.trim() });
    setChecking(false);

    if (exists) {
      setStep('already_member');
    } else {
      setStep('form');
    }
  };

  const jotformUrl = `https://form.jotform.com/251564463545057${email ? `?email=${encodeURIComponent(email)}` : ''}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Branding header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 relative z-10 bg-white">
        <img src={LOGO_URL} alt="Emerald Oasis" className="w-10 h-10 rounded-full object-cover" />
        <div>
          <h1 className="text-base font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}>
            Become a Member
          </h1>
          <p className="text-[10px] text-gray-400">Emerald Oasis · Private Membership Association</p>
        </div>
      </div>

      {step === 'email' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
          <div className="w-full max-w-sm space-y-4 text-center">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}>
              Let's get started
            </h2>
            <p className="text-sm text-gray-500">Enter your email to begin your membership application.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkEmail()}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              onClick={checkEmail}
              disabled={checking || !email.trim()}
              className="w-full px-6 py-3 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--ea-emerald)' }}
            >
              {checking ? 'Checking…' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {step === 'already_member' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gray-50">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}>
            You're already a member!
          </h2>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            We found your membership application on file. Sign in below to access your account.
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            className="px-6 py-3 text-white rounded-lg font-medium shadow-sm mt-4"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setEmail(''); setStep('email'); }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-2"
          >
            Use a different email
          </button>
        </div>
      )}

      {step === 'completed' && (
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
            Your PMA is signed and payment is complete. Set up your app account below.
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            className="px-6 py-3 text-white rounded-lg font-medium shadow-sm mt-4"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            Set Up Account Password
          </button>
        </div>
      )}

      {step === 'form' && (
        <div className="flex-1 w-full bg-gray-50 relative">
          <iframe
            id="JotFormIFrame-251564463545057"
            title="Emerald Oasis Membership Signup"
            src={jotformUrl}
            className="w-full border-0"
            style={{ minWidth: '100%', maxWidth: '100%', height: '800px', minHeight: '80vh' }}
            allowFullScreen={true}
            allow="geolocation; microphone; camera; fullscreen; payment; autoplay; clipboard-write; display-capture"
          />
        </div>
      )}

      {/* Footer links */}
      <div className="px-4 py-4 border-t border-gray-100 text-center space-y-2 bg-white relative z-10">
        <button onClick={() => setLoginOpen(true)} className="text-xs font-medium block mx-auto hover:underline" style={{ color: 'var(--ea-emerald)' }}>
          Already a member? Sign In
        </button>
        <button onClick={() => navigate('/book')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors block mx-auto">
          Book an Experience →
        </button>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} postJotform={step === 'completed'} />
    </div>
  );
}