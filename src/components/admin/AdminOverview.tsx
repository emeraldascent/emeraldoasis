import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, AlertTriangle } from 'lucide-react';

interface Stats {
  todayBookings: number;
  activeMembers: number;
  expiringThisWeek: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    todayBookings: 0,
    activeMembers: 0,
    expiringThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const weekStr = weekFromNow.toISOString().split('T')[0];

      // Today's bookings
      const { count: bookingCount } = await supabase
        .from('member_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_date', todayStr)
        .eq('status', 'confirmed');

      // Active members
      const { count: activeCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .lte('membership_start', todayStr)
        .gte('membership_end', todayStr);

      // Expiring this week
      const { count: expiringCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('membership_end', todayStr)
        .lte('membership_end', weekStr);

      setStats({
        todayBookings: bookingCount ?? 0,
        activeMembers: activeCount ?? 0,
        expiringThisWeek: expiringCount ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    {
      icon: LogIn,
      label: "Today's Check-ins",
      value: stats.todayCheckIns,
      color: 'var(--ea-emerald)',
      bg: '#F0FDF4',
    },
    {
      icon: Users,
      label: 'Active Members',
      value: stats.activeMembers,
      color: 'var(--ea-spirulina)',
      bg: '#F0FDFA',
    },
    {
      icon: AlertTriangle,
      label: 'Expiring This Week',
      value: stats.expiringThisWeek,
      color: 'var(--ea-gold)',
      bg: '#FBF5E8',
    },
  ];

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-8">Loading stats...</p>;
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ backgroundColor: card.bg }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: card.color }}
            >
              <Icon size={22} color="white" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--ea-midnight)' }}>
                {card.value}
              </p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
