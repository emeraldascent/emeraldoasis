import { useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';

export function WelcomePassBanner() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/book', { state: { welcomePass: true } })}
      className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-border/80 bg-green-50 border-green-200"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-green-100 text-ea-emerald">
        <Gift size={18} />
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-semibold text-ea-midnight">
          🎁 Free Oasis Pass
        </p>
        <p className="text-[11px] text-muted-foreground">
          Your welcome gift — 2 or 4 hour pass, on us!
        </p>
      </div>
      <span className="text-muted-foreground shrink-0 text-sm">→</span>
    </button>
  );
}
