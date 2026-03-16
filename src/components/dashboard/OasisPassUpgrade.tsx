import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

export function OasisPassUpgrade() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/book')}
      className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-gray-200 bg-amber-50 border-amber-200"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-yellow-100 text-yellow-600">
        <Star size={18} />
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-semibold text-ea-midnight">
          Upgrade to an Oasis Pass
        </p>
        <p className="text-[11px] text-gray-500">
          Silver (5 visits/mo) or Gold (10 visits/mo) — save on every visit
        </p>
      </div>
      <span className="text-gray-300 shrink-0">→</span>
    </button>
  );
}
