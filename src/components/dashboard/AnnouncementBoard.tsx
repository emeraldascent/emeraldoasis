import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  emoji: string;
  created_at: string;
}

export function AnnouncementBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, body, emoji, created_at')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setAnnouncements(data as Announcement[]);
      });
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
        <Megaphone size={12} className="text-amber-600" />
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Updates</p>
      </div>
      <div className="px-3 pb-3 space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="flex items-start gap-2">
            <span className="text-sm mt-0.5">{a.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ea-midnight">{a.title}</p>
              {a.body && (
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{a.body}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
