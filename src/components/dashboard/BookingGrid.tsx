import { Button } from '../ui/button';

interface BookingGridProps {
  disabled?: boolean;
  onBook?: () => void;
}

const bookings = [
  { emoji: '🥾', label: 'Day Pass', active: true },
  { emoji: '🔥', label: 'Sauna', active: false },
  { emoji: '🏕️', label: 'Camping', active: true },
  { emoji: '📅', label: 'Events', active: false },
];

export function BookingGrid({ disabled = false, onBook }: BookingGridProps) {
  const handleBook = () => {
    if (!disabled && onBook) {
      onBook();
    }
  };

  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        borderColor: disabled ? '#E5E7EB' : 'var(--ea-emerald)',
        backgroundColor: disabled ? '#F9FAFB' : '#F0FDF4',
      }}
    >
      <p className="text-xs font-bold mb-3" style={{ color: disabled ? '#9CA3AF' : 'var(--ea-emerald)' }}>
        {disabled ? '🔒 Active membership required to book' : 'Ready to visit? Book an experience:'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {bookings.map((item) => {
          const isDisabled = disabled || !item.active;
          return (
            <Button
              key={item.label}
              onClick={item.active ? handleBook : undefined}
              disabled={isDisabled}
              className="h-12 text-sm font-medium text-white rounded-lg relative"
              style={{
                backgroundColor: isDisabled ? '#D1D5DB' : 'var(--ea-emerald)',
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              <span className="mr-1.5">{item.emoji}</span>
              {item.active ? item.label : (
                <span className="flex flex-col items-start leading-tight">
                  <span>{item.label}</span>
                  <span className="text-[9px] font-normal opacity-80">Coming Soon</span>
                </span>
              )}
            </Button>
          );
        })}
      </div>
      <p className="text-[10px] text-center text-gray-400 mt-2">
        All experiences require advance booking
      </p>
    </div>
  );
}
