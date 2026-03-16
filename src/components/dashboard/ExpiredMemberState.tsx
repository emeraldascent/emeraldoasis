import { useNavigate } from 'react-router-dom';
import { BookingGrid } from './BookingGrid';

export function ExpiredMemberState() {
  const navigate = useNavigate();

  return (
    <>
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
        <p className="text-sm font-semibold text-red-700 mb-1">
          Your membership has expired
        </p>
        <p className="text-xs text-red-500">
          Renew to access booking and property experiences.
        </p>
        <button
          onClick={() => navigate('/join')}
          className="text-xs font-semibold underline underline-offset-2 text-ea-emerald"
        >
          Renew Membership →
        </button>
      </div>
      <BookingGrid disabled />
    </>
  );
}
