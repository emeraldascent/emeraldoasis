import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, TreePine, User, PenLine, Shield } from 'lucide-react';

const ADMIN_EMAILS = ['emeraldoasiscamp@gmail.com', 'connor@emeraldascent.com'];

interface BottomNavProps {
  isAuthenticated: boolean;
  userEmail?: string | null;
}

const authNav = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/book', label: 'Book', icon: CalendarDays },
  { path: '/guide', label: 'Guide', icon: TreePine },
  { path: '/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/book', label: 'Book', icon: CalendarDays },
  { path: '/admin', label: 'Admin', icon: Shield },
  { path: '/guide', label: 'Guide', icon: TreePine },
  { path: '/profile', label: 'Profile', icon: User },
];

const publicNav = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/join', label: 'Join', icon: PenLine },
  { path: '/book', label: 'Book', icon: CalendarDays },
  { path: '/guide', label: 'Guide', icon: TreePine },
];

export function BottomNav({ isAuthenticated, userEmail }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = isAuthenticated && ADMIN_EMAILS.includes(userEmail || '');
  const items = isAdmin ? adminNav : isAuthenticated ? authNav : publicNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
              style={{
                color: isActive ? 'var(--ea-emerald)' : '#9CA3AF',
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
