import { useNavigate } from 'react-router-dom';
import { Map, User, ShoppingBag } from 'lucide-react';

const links = [
  { icon: Map, label: 'Property Guide', path: '/guide', emoji: '🗺️' },
  { icon: User, label: 'My Profile', path: '/profile', emoji: '👤' },
  { icon: ShoppingBag, label: 'Market', path: '#', emoji: '🌿' },
];

export function QuickLinks() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-2">
      {links.map((link) => (
        <button
          key={link.label}
          onClick={() => link.path !== '#' && navigate(link.path)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-xl">{link.emoji}</span>
          <span className="text-[10px] font-medium text-gray-600">{link.label}</span>
        </button>
      ))}
    </div>
  );
}
