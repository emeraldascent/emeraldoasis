import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MemberRoster } from '../components/admin/MemberRoster';
import { AdminCalendar } from '../components/admin/AdminCalendar';
import { AdminEvents } from '../components/admin/AdminEvents';
import { AdminAnnouncements } from '../components/admin/AdminAnnouncements';
import { MapCalibrator } from '../components/admin/MapCalibrator';
import { TodayBookings } from '../components/admin/TodayBookings';
import { Users, Calendar, MapPin, PartyPopper, CalendarCheck, Megaphone } from 'lucide-react';

export function Admin() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5">
        <h1
          className="text-lg text-center mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
        >
          Admin Panel
        </h1>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="today" className="text-xs gap-1">
              <CalendarCheck size={14} />
              Today
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1">
              <Calendar size={14} />
              Cal
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs gap-1">
              <PartyPopper size={14} />
              Events
            </TabsTrigger>
            <TabsTrigger value="roster" className="text-xs gap-1">
              <Users size={14} />
              Roster
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs gap-1">
              <MapPin size={14} />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <TodayBookings />
          </TabsContent>

          <TabsContent value="calendar">
            <AdminCalendar />
          </TabsContent>

          <TabsContent value="events">
            <AdminEvents />
          </TabsContent>

          <TabsContent value="roster">
            <MemberRoster />
          </TabsContent>

          <TabsContent value="map">
            <MapCalibrator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}