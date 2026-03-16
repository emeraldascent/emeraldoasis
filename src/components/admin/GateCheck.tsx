import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Search, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Member, BadgeStatus } from '../../lib/types';

function getBadgeStatus(member: Member): BadgeStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(member.membership_start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(member.membership_end);
  end.setHours(0, 0, 0, 0);
  if (start > today) return 'future';
  if (end < today) return 'expired';
  return 'active';
}

interface JotformResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_plate: string | null;
  photo_url: string | null;
  pma_agreed: boolean;
  membership_tier: string | null;
}

export function GateCheck() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [jotformResults, setJotformResults] = useState<JotformResult[]>([]);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setJotformResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const searchTerm = `%${query}%`;
      
      const [membersRes, jotformRes] = await Promise.all([
        supabase
          .from('members')
          .select('*')
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},license_plate.ilike.${searchTerm}`)
          .limit(10),
        supabase
          .from('jotform_submissions')
          .select('id, first_name, last_name, email, phone, license_plate, photo_url, pma_agreed, membership_tier')
          .is('matched_member_id', null)
          .eq('pma_agreed', true)
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},license_plate.ilike.${searchTerm}`)
          .limit(10),
      ]);

      if (!membersRes.error && membersRes.data) {
        setResults(membersRes.data as Member[]);
      }
      if (!jotformRes.error && jotformRes.data) {
        setJotformResults(jotformRes.data as JotformResult[]);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleCheckIn = async (member: Member) => {
    const { error } = await supabase.from('check_ins').insert({
      member_id: member.id,
      checked_in_by: 'admin',
    });
    if (!error) {
      setCheckedIn((prev) => new Set(prev).add(member.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Search name or license plate..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-14 text-lg border-2 rounded-xl"
          style={{ borderColor: 'var(--ea-emerald)' }}
          autoFocus
        />
      </div>

      {searching && (
        <p className="text-sm text-gray-400 text-center">Searching...</p>
      )}

      <div className="space-y-3">
        {results.map((member) => {
          const status = getBadgeStatus(member);
          const isActive = status === 'active';
          const justCheckedIn = checkedIn.has(member.id);

          return (
            <div
              key={member.id}
              className="p-4 rounded-xl border bg-white shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={member.photo_url ?? undefined} />
                  <AvatarFallback
                    className="text-lg font-bold text-white"
                    style={{ backgroundColor: isActive ? '#1B5E20' : '#B71C1C' }}
                  >
                    {member.first_name[0]}{member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold" style={{ color: 'var(--ea-midnight)' }}>
                    {member.first_name} {member.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant={isActive ? 'default' : 'destructive'}
                      className="text-[10px] font-bold"
                      style={isActive ? { backgroundColor: '#1B5E20' } : undefined}
                    >
                      {status === 'active' ? 'ACTIVE' : status === 'expired' ? 'EXPIRED' : 'FUTURE'}
                    </Badge>
                    <span className="text-xs text-gray-500 capitalize">{member.membership_tier}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                    {member.license_plate && <span>🚗 {member.license_plate}</span>}
                    <span>· {member.source}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleCheckIn(member)}
                disabled={justCheckedIn}
                className="w-full mt-3 text-white rounded-lg"
                style={{
                  backgroundColor: justCheckedIn ? '#22C55E' : 'var(--ea-emerald)',
                }}
              >
                {justCheckedIn ? (
                  <>
                    <CheckCircle size={16} className="mr-1" /> Checked In
                  </>
                ) : (
                  '✓ Check In'
                )}
              </Button>
            </div>
          );
        })}

        {/* JotForm-only PMA results */}
        {jotformResults.map((jf) => (
          <div key={`jf-${jf.id}`} className="p-4 rounded-xl border border-amber-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarImage src={jf.photo_url ?? undefined} />
                <AvatarFallback className="text-lg font-bold text-white bg-amber-700">
                  {jf.first_name?.[0] || '?'}{jf.last_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold" style={{ color: 'var(--ea-midnight)' }}>
                  {jf.first_name} {jf.last_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="text-[10px] font-bold bg-amber-600">
                    PMA ONLY
                  </Badge>
                  <span className="text-xs text-gray-500">{jf.membership_tier || 'No tier'}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                  {jf.license_plate && <span>🚗 {jf.license_plate}</span>}
                  <span>· No app account</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-amber-600 mt-2 text-center">
              ⚠ PMA signed via JotForm — no app account yet
            </p>
          </div>
        ))}
      </div>

      {query.length >= 2 && results.length === 0 && jotformResults.length === 0 && !searching && (
        <p className="text-sm text-gray-400 text-center py-8">No members found</p>
      )}
    </div>
  );
}
