import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { GateCheck } from '../components/admin/GateCheck';
import { MemberRoster } from '../components/admin/MemberRoster';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminCalendar } from '../components/admin/AdminCalendar';
import { AdminEvents } from '../components/admin/AdminEvents';
import { MapCalibrator } from '../components/admin/MapCalibrator';
import { Search, Users, BarChart3, Calendar, MapPin, PartyPopper } from 'lucide-react';

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

        <Tabs defaultValue="gate" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="gate" className="text-xs gap-1">
              <Search size={14} />
              Gate
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1">
              <Calendar size={14} />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="roster" className="text-xs gap-1">
              <Users size={14} />
              Roster
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs gap-1">
              <BarChart3 size={14} />
              Stats
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs gap-1">
              <MapPin size={14} />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gate">
            <GateCheck />
          </TabsContent>

          <TabsContent value="calendar">
            <AdminCalendar />
          </TabsContent>

          <TabsContent value="roster">
            <MemberRoster />
          </TabsContent>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="map">
            <MapCalibrator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}