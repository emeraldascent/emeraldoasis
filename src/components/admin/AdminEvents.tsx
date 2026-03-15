import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Trash2, Eye, EyeOff, Users, CheckCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  capacity: number;
  price: number;
  is_published: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  event_id: string;
  member_id: string;
  quantity: number;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  members?: { first_name: string; last_name: string; email: string; phone: string } | null;
}

type ViewMode = 'list' | 'form' | 'tickets';

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '10:00',
    end_time: '12:00',
    location: '',
    capacity: 50,
    price: 0,
    is_published: false,
  });

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    setEvents((data as Event[]) || []);
    setLoading(false);
  };

  const fetchTickets = async (eventId: string) => {
    const { data } = await supabase
      .from('event_tickets')
      .select('*, members(first_name, last_name, email, phone)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
  };

  useEffect(() => { fetchEvents(); }, []);

  const openForm = (event?: Event) => {
    if (event) {
      setSelectedEvent(event);
      setForm({
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        start_time: event.start_time?.slice(0, 5) || '10:00',
        end_time: event.end_time?.slice(0, 5) || '12:00',
        location: event.location || '',
        capacity: event.capacity,
        price: event.price,
        is_published: event.is_published,
      });
    } else {
      setSelectedEvent(null);
      setForm({ title: '', description: '', event_date: '', start_time: '10:00', end_time: '12:00', location: '', capacity: 50, price: 0, is_published: false });
    }
    setViewMode('form');
  };

  const saveEvent = async () => {
    setSaving(true);
    if (selectedEvent) {
      await supabase.from('events').update(form).eq('id', selectedEvent.id);
    } else {
      await supabase.from('events').insert(form);
    }
    setSaving(false);
    setViewMode('list');
    fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event and all its tickets?')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
  };

  const togglePublish = async (event: Event) => {
    await supabase.from('events').update({ is_published: !event.is_published }).eq('id', event.id);
    fetchEvents();
  };

  const toggleCheckIn = async (ticket: Ticket) => {
    const now = new Date().toISOString();
    await supabase.from('event_tickets').update({
      checked_in: !ticket.checked_in,
      checked_in_at: !ticket.checked_in ? now : null,
    }).eq('id', ticket.id);
    fetchTickets(ticket.event_id);
  };

  const viewTickets = async (event: Event) => {
    setSelectedEvent(event);
    await fetchTickets(event.id);
    setViewMode('tickets');
  };

  const sendAnnouncement = async (event: Event) => {
    // For now, show what would be sent
    alert(`📢 Announcement would be sent for:\n\n${event.title}\n${event.event_date} at ${event.start_time?.slice(0, 5)}\n${event.location}\n\n(Email integration coming soon)`);
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  // ── Form View ──
  if (viewMode === 'form') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
            {selectedEvent ? 'Edit Event' : 'New Event'}
          </h3>
          <button onClick={() => setViewMode('list')} className="text-xs text-gray-500 underline">Cancel</button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
          />
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Start</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">End</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
          <input
            placeholder="Location (e.g. Meadow Stage)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Capacity</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs text-gray-600">Publish immediately</span>
          </label>

          <button
            onClick={saveEvent}
            disabled={saving || !form.title || !form.event_date}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            {saving ? 'Saving…' : selectedEvent ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    );
  }

  // ── Tickets View ──
  if (viewMode === 'tickets' && selectedEvent) {
    const checkedIn = tickets.filter((t) => t.checked_in).length;
    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
              {selectedEvent.title}
            </h3>
            <p className="text-[11px] text-gray-500">
              {formatDate(selectedEvent.event_date)} · {checkedIn}/{tickets.length} checked in · {totalTickets} total tickets
            </p>
          </div>
          <button onClick={() => setViewMode('list')} className="text-xs text-gray-500 underline">Back</button>
        </div>

        {tickets.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No tickets yet</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5"
                style={{ borderColor: ticket.checked_in ? '#BBF7D0' : '#E5E7EB' }}
              >
                <button
                  onClick={() => toggleCheckIn(ticket)}
                  className="shrink-0"
                >
                  <CheckCircle
                    size={20}
                    style={{ color: ticket.checked_in ? '#16a34a' : '#D1D5DB' }}
                    fill={ticket.checked_in ? '#DCFCE7' : 'none'}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--ea-midnight)' }}>
                    {ticket.members?.first_name} {ticket.members?.last_name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {ticket.quantity > 1 ? `${ticket.quantity} tickets · ` : ''}
                    {ticket.members?.phone || ticket.members?.email}
                  </p>
                </div>
                {ticket.checked_in && ticket.checked_in_at && (
                  <span className="text-[10px] text-green-600 shrink-0">
                    {new Date(ticket.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
          Events
        </h3>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--ea-emerald)' }}
        >
          <Plus size={13} /> New Event
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-8">Loading…</p>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-2">No events yet</p>
          <button
            onClick={() => openForm()}
            className="text-xs font-medium underline"
            style={{ color: 'var(--ea-emerald)' }}
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const isExpanded = expandedEvent === event.id;
            const isPast = new Date(event.event_date + 'T23:59:59') < new Date();

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl border overflow-hidden transition-colors"
                style={{
                  borderColor: event.is_published ? '#BBF7D0' : '#E5E7EB',
                  opacity: isPast ? 0.6 : 1,
                }}
              >
                <button
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--ea-midnight)' }}>
                        {event.title}
                      </p>
                      {!event.is_published && (
                        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Draft</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {formatDate(event.event_date)} · {formatTime(event.start_time)}
                      {event.price > 0 ? ` · $${event.price}` : ' · Free'}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2">
                    {event.description && (
                      <p className="text-[11px] text-gray-500">{event.description}</p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      📍 {event.location || 'TBD'} · 👥 {event.capacity} capacity
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => viewTickets(event)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 hover:bg-gray-50"
                        style={{ color: 'var(--ea-midnight)' }}
                      >
                        <Users size={12} /> Tickets
                      </button>
                      <button
                        onClick={() => togglePublish(event)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 hover:bg-gray-50"
                        style={{ color: event.is_published ? '#d97706' : '#16a34a' }}
                      >
                        {event.is_published ? <EyeOff size={12} /> : <Eye size={12} />}
                        {event.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => openForm(event)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 hover:bg-gray-50"
                        style={{ color: 'var(--ea-midnight)' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => sendAnnouncement(event)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 hover:bg-gray-50"
                        style={{ color: '#2563eb' }}
                      >
                        <Send size={12} /> Announce
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-red-200 hover:bg-red-50 text-red-500"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
