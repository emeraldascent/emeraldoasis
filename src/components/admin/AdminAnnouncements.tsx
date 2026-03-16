import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  emoji: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [emoji, setEmoji] = useState('📢');

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data as Announcement[]);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await supabase.from('announcements').insert({
      title: title.trim(),
      body: body.trim(),
      emoji,
    } as any);
    setTitle('');
    setBody('');
    setEmoji('📢');
    setShowForm(false);
    fetchAnnouncements();
  };

  const handleToggle = async (a: Announcement) => {
    await supabase
      .from('announcements')
      .update({ is_active: !a.is_active } as any)
      .eq('id', a.id);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnnouncements();
  };

  const emojiOptions = ['📢', '🚨', '🎉', '🌿', '⚠️', '💧', '🔥', '❄️', '☀️', '🌙'];

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ea-midnight">Announcements ({announcements.length})</p>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] h-7 bg-ea-emerald hover:bg-ea-emerald/90"
        >
          <Plus size={12} className="mr-1" /> New
        </Button>
      </div>

      {showForm && (
        <div className="p-3 rounded-xl border border-border bg-white space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {emojiOptions.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${
                  emoji === e ? 'bg-ea-emerald/20 ring-2 ring-ea-emerald' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <Input
            placeholder="Announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xs h-8"
          />
          <textarea
            placeholder="Details (optional)..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full text-xs border border-border rounded-lg px-3 py-2 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-ea-emerald"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} className="text-[10px] h-7 bg-ea-emerald hover:bg-ea-emerald/90 flex-1">
              Publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="text-[10px] h-7">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {announcements.length === 0 && !showForm && (
        <p className="text-xs text-gray-400 text-center py-6">No announcements yet</p>
      )}

      {announcements.map((a) => (
        <div
          key={a.id}
          className={`p-3 rounded-xl border bg-white ${a.is_active ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ea-midnight">{a.title}</p>
              {a.body && <p className="text-[11px] text-gray-500 mt-0.5">{a.body}</p>}
              <p className="text-[10px] text-gray-300 mt-1">
                {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggle(a)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title={a.is_active ? 'Hide' : 'Show'}
              >
                {a.is_active ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-gray-400" />}
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
