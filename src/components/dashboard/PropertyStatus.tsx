export function PropertyStatus() {
  // Default to open — this will read from a property_status field later
  const status: 'open' | 'limited' | 'closed' = 'open';

  const config = {
    open: {
      emoji: '🟢',
      label: 'Open Today',
      description: 'All experiences available',
      borderColor: '#22C55E',
      bgColor: '#F0FDF4',
    },
    limited: {
      emoji: '🟡',
      label: 'Limited Access',
      description: 'Some experiences may be unavailable',
      borderColor: '#EAB308',
      bgColor: '#FEFCE8',
    },
    closed: {
      emoji: '🔴',
      label: 'Private Retreat Today',
      description: 'Property closed',
      borderColor: '#EF4444',
      bgColor: '#FEF2F2',
    },
  };

  const c = config[status];

  return (
    <div
      className="p-3 rounded-xl border-l-4"
      style={{ borderColor: c.borderColor, backgroundColor: c.bgColor }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
        {c.emoji} {c.label}
      </p>
      <p className="text-xs text-gray-500">{c.description}</p>
    </div>
  );
}
