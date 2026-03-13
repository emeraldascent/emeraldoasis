import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import type { Member, BadgeStatus } from '../../lib/types';

function getBadgeStatus(member: Member): BadgeStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(member.membership_end);
  end.setHours(0, 0, 0, 0);
  const start = new Date(member.membership_start);
  start.setHours(0, 0, 0, 0);
  if (start > today) return 'future';
  if (end < today) return 'expired';
  return 'active';
}

type Filter = 'all' | 'active' | 'expired';

export function MemberRoster() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMembers(data as Member[]);
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const filtered = members.filter((m) => {
    if (filter === 'all') return true;
    return getBadgeStatus(m) === filter;
  });

  const activeCt = members.filter((m) => getBadgeStatus(m) === 'active').length;
  const expiredCt = members.filter((m) => getBadgeStatus(m) === 'expired').length;

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Expires', 'Status', 'Source'];
    const rows = filtered.map((m) => [
      `${m.first_name} ${m.last_name}`,
      m.email,
      m.phone,
      m.membership_tier,
      m.membership_end,
      getBadgeStatus(m),
      m.source,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-roster.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          ['all', `All (${members.length})`],
          ['active', `Active (${activeCt})`],
          ['expired', `Expired (${expiredCt})`],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
            style={{
              backgroundColor: filter === key ? 'var(--ea-emerald)' : '#F1F5F9',
              color: filter === key ? 'white' : '#6B7280',
            }}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">
          Export CSV
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading members...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((member) => {
            const status = getBadgeStatus(member);
            const isActive = status === 'active';
            const endDate = new Date(member.membership_end).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.photo_url ?? undefined} />
                  <AvatarFallback
                    className="text-xs font-bold text-white"
                    style={{ backgroundColor: isActive ? '#1B5E20' : '#B71C1C' }}
                  >
                    {member.first_name[0]}{member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--ea-midnight)' }}>
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {member.membership_tier} · Expires {endDate}
                  </p>
                </div>
                <Badge
                  variant={isActive ? 'default' : 'destructive'}
                  className="text-[9px] shrink-0"
                  style={isActive ? { backgroundColor: '#1B5E20' } : undefined}
                >
                  {isActive ? 'ACTIVE' : 'EXPIRED'}
                </Badge>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No members found</p>
          )}
        </div>
      )}
    </div>
  );
}
