import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Calendar, Search, AlertTriangle } from 'lucide-react';
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

interface JotformMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emergency_contact: string;
  license_plate: string | null;
  photo_url: string | null;
  pma_agreed: boolean;
  pma_agreed_at: string | null;
  created_at: string;
  membership_tier: string | null;
  source: 'jotform';
}

interface TodayBooking {
  id: string;
  service_name: string;
  booking_time: string | null;
  member_id: string;
  guest_names: string[] | null;
}

type Filter = 'all' | 'active' | 'expired' | 'jotform_only';

export function MemberRoster() {
  const [members, setMembers] = useState<Member[]>([]);
  const [jotformOnly, setJotformOnly] = useState<JotformMember[]>([]);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    const fetchMembers = async () => {
      setLoading(true);
      const [membersRes, bookingsRes, jotformRes] = await Promise.all([
        supabase
          .from('members')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('member_bookings')
          .select('id, service_name, booking_time, member_id, guest_names')
          .eq('booking_date', today)
          .eq('status', 'confirmed')
          .order('booking_time', { ascending: true }),
        supabase
          .from('jotform_submissions')
          .select('*')
          .is('matched_member_id', null)
          .eq('pma_agreed', true)
          .order('created_at', { ascending: false }),
      ]);

      if (!membersRes.error && membersRes.data) {
        setMembers(membersRes.data as Member[]);
      }
      if (!bookingsRes.error && bookingsRes.data) {
        setTodayBookings(bookingsRes.data as TodayBooking[]);
      }
      if (!jotformRes.error && jotformRes.data) {
        setJotformOnly(jotformRes.data.map((j: any) => ({
          id: j.id,
          first_name: j.first_name,
          last_name: j.last_name,
          email: j.email,
          phone: j.phone,
          emergency_contact: j.emergency_contact,
          license_plate: j.license_plate,
          photo_url: j.photo_url,
          pma_agreed: j.pma_agreed,
          pma_agreed_at: j.pma_agreed_at,
          created_at: j.created_at,
          membership_tier: j.membership_tier,
          source: 'jotform' as const,
        })));
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const handleToggleSubscription = async (member: Member) => {
    const newStatus = !member.subscription_active;
    const newTier = newStatus ? (member.subscription_tier || 'silver') : null;
    
    const { error } = await supabase
      .from('members')
      .update({ subscription_active: newStatus, subscription_tier: newTier } as any)
      .eq('id', member.id);
      
    if (!error) {
      setMembers(members.map(m => m.id === member.id ? { ...m, subscription_active: newStatus, subscription_tier: newTier } : m));
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    
    const filteredMembers = members.filter((m) => {
      if (filter === 'jotform_only') return false;
      if (filter !== 'all' && getBadgeStatus(m) !== filter) return false;
      if (q) {
        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
        return fullName.includes(q) || m.email.toLowerCase().includes(q) ||
          (m.license_plate?.toLowerCase().includes(q) ?? false) || m.phone.includes(q);
      }
      return true;
    });

    const filteredJotform = (filter === 'all' || filter === 'jotform_only' || filter === 'active')
      ? jotformOnly.filter((j) => {
          if (q) {
            const fullName = `${j.first_name} ${j.last_name}`.toLowerCase();
            return fullName.includes(q) || j.email.toLowerCase().includes(q) ||
              (j.license_plate?.toLowerCase().includes(q) ?? false) || j.phone.includes(q);
          }
          return true;
        })
      : [];

    return { filteredMembers, filteredJotform };
  }, [members, jotformOnly, filter, search]);

  const activeCt = members.filter((m) => getBadgeStatus(m) === 'active').length;
  const expiredCt = members.filter((m) => getBadgeStatus(m) === 'expired').length;
  const jotformCt = jotformOnly.length;

  const bookingsByMember = todayBookings.reduce<Record<string, TodayBooking[]>>((acc, b) => {
    if (!acc[b.member_id]) acc[b.member_id] = [];
    acc[b.member_id].push(b);
    return acc;
  }, {});

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Expires', 'Status', 'Source'];
    const memberRows = filtered.filteredMembers.map((m) => [
      `${m.first_name} ${m.last_name}`, m.email, m.phone, m.membership_tier, m.membership_end, getBadgeStatus(m), m.source,
    ]);
    const jotformRows = filtered.filteredJotform.map((j) => [
      `${j.first_name} ${j.last_name}`, j.email, j.phone, j.membership_tier || 'PMA', 'N/A', 'PMA Only', 'jotform',
    ]);
    const csv = [headers, ...memberRows, ...jotformRows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-roster.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (t: string | null) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const totalResults = filtered.filteredMembers.length + filtered.filteredJotform.length;

  return (
    <div className="space-y-4">
      {todayBookings.length > 0 && (
        <div className="p-3 rounded-xl border border-border bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-ea-emerald" />
            <p className="text-xs font-bold text-ea-midnight">
              Today's Bookings ({todayBookings.length})
            </p>
          </div>
          <div className="space-y-1">
            {todayBookings.map((b) => {
              const member = members.find(m => m.id === b.member_id);
              return (
                <div key={b.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600">
                    {member ? `${member.first_name} ${member.last_name}` : 'Unknown'}
                  </span>
                  <span className="text-gray-500">
                    {b.service_name} {b.booking_time ? `· ${formatTime(b.booking_time)}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search name, email, phone, plate…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          ['all', `All (${members.length + jotformCt})`],
          ['active', `Active (${activeCt + jotformCt})`],
          ['expired', `Expired (${expiredCt})`],
          ['jotform_only', `PMA Only (${jotformCt})`],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === key ? 'bg-ea-emerald text-white' : 'bg-slate-100 text-gray-500'
            }`}
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
          {filtered.filteredMembers.map((member) => {
            const status = getBadgeStatus(member);
            const isActive = status === 'active';
            const endDate = new Date(member.membership_end).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });
            const memberBookings = bookingsByMember[member.id];

            return (
              <div key={member.id} className="p-3 rounded-xl bg-white border border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.photo_url ?? undefined} />
                    <AvatarFallback className={`text-xs font-bold text-white ${isActive ? 'bg-green-900' : 'bg-red-900'}`}>
                      {member.first_name[0]}{member.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-ea-midnight">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {member.membership_tier} · Expires {endDate}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSubscription(member)}
                    title={`Toggle Oasis Pass Subscription (${member.subscription_active ? 'Active' : 'Inactive'})`}
                    className={`p-1.5 rounded-full transition-colors ${member.subscription_active ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  >
                    <Crown size={14} className={member.subscription_active ? 'fill-current' : ''} />
                  </button>
                  <Badge
                    variant={isActive ? 'default' : 'destructive'}
                    className={`text-[9px] shrink-0 ${isActive ? 'bg-green-900' : ''}`}
                  >
                    {isActive ? 'ACTIVE' : 'EXPIRED'}
                  </Badge>
                </div>
                {memberBookings && memberBookings.length > 0 && (
                  <div className="mt-2 border-t border-gray-50 pt-1.5" style={{ marginLeft: '52px' }}>
                    {memberBookings.map((b) => (
                      <div key={b.id} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Calendar size={10} className="text-ea-emerald" />
                        <span>{b.service_name}</span>
                        {b.booking_time && <span className="opacity-60">· {formatTime(b.booking_time)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* JotForm-only PMA members */}
          {filtered.filteredJotform.map((jf) => (
            <div key={`jf-${jf.id}`} className="p-3 rounded-xl bg-white border border-amber-200">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={jf.photo_url ?? undefined} />
                  <AvatarFallback className="text-xs font-bold text-amber-900 bg-amber-300">
                    {jf.first_name?.[0] || '?'}{jf.last_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-ea-midnight">
                    {jf.first_name} {jf.last_name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {jf.email} · {jf.phone}
                  </p>
                </div>
                <Badge className="text-[9px] shrink-0 bg-amber-400 text-amber-900">
                  PMA ONLY
                </Badge>
              </div>
              {jf.license_plate && (
                <p className="text-[10px] text-gray-400 mt-1" style={{ marginLeft: '52px' }}>
                  🚗 {jf.license_plate}
                </p>
              )}
            </div>
          ))}

          {totalResults === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No members found</p>
          )}
        </div>
      )}
    </div>
  );
}
