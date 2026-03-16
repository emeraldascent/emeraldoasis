import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, Sun, Tent, Users, Clock, Star, Gift } from 'lucide-react';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { MemberPassSection } from '../components/booking/MemberPassSection';
import type { Member, BadgeStatus } from '../lib/types';

interface ServiceCard {
  id: number;
  name: string;
  description: string;
  price: string;
  icon: React.ReactNode;
  imageUrl?: string;
  isFreeWelcome?: boolean;
}

const WELCOME_PASSES: ServiceCard[] = [
  { id: 18, name: 'Welcome Pass — 2 Hours', description: 'Your free welcome gift!', price: 'FREE', icon: <Gift size={18} />, isFreeWelcome: true },
  { id: 19, name: 'Welcome Pass — 4 Hours', description: 'Your free welcome gift!', price: 'FREE', icon: <Gift size={18} />, isFreeWelcome: true },
];

const DAY_PASSES: ServiceCard[] = [
  { id: 18, name: 'Oasis Pass — 2 Hours', description: 'Spring water, trails, Zen Lounge & market', price: '$4', icon: <Clock size={18} /> },
  { id: 19, name: 'Oasis Pass — 4 Hours', description: 'Extended visit · full property & lounge access', price: '$8', icon: <Sun size={18} /> },
  { id: 22, name: 'Oasis Pass — 6 Hours', description: 'Full day · coworking, lounge & all amenities', price: '$12', icon: <Sun size={18} /> },
  { id: 23, name: 'Oasis Pass — 8 Hours', description: 'Dawn-to-dusk · complete Oasis immersion', price: '$16', icon: <Sun size={18} /> },
];

const MEMBER_PASSES: ServiceCard[] = [
  { id: 20, name: 'Silver/Gold Pass — 2 Hours', description: 'Included with Silver/Gold subscription', price: 'Included', icon: <Star size={18} /> },
  { id: 21, name: 'Silver/Gold Pass — 4 Hours', description: 'Included with Silver/Gold subscription', price: 'Included', icon: <Star size={18} /> },
];

const CAMPSITES: ServiceCard[] = [
  { id: 11, name: 'Terrace #3', description: 'Meadow corner · creek views · forest trail access', price: '$25/night', icon: <Tent size={18} />, imageUrl: '/photos/campsite-terrace3.jpg' },
  { id: 12, name: 'Terrace #4', description: 'Between trees along meadow · creek views', price: '$28/night', icon: <Tent size={18} />, imageUrl: '/photos/campsite-terrace4.jpg' },
  { id: 13, name: 'Terrace #5', description: 'Above meadow · more privacy · forest trails', price: '$30/night', icon: <Tent size={18} />, imageUrl: '/photos/campsite-terrace5.jpg' },
  { id: 14, name: 'Secluded Site #6', description: 'Forest hollow · nestled in the woods', price: '$28/night', icon: <Tent size={18} />, imageUrl: '/photos/campsite-secluded6.jpg' },
  { id: 9, name: 'Creekside #7 — Social', description: 'Shared community site · 1 spot', price: '$20/night', icon: <Tent size={18} />, imageUrl: '/photos/campsite-creekside7.jpg' },
  { id: 8, name: 'Creekside #7 — Group', description: 'Exclusive group use · up to 5 tents', price: '$60/night', icon: <Users size={18} />, imageUrl: '/photos/campsite-creekside7.jpg' },
  { id: 10, name: 'Creekside Group #2', description: 'Group creekside camping', price: '$45/night', icon: <Users size={18} />, imageUrl: '/photos/campsite-creekside2.jpg' },
];

interface BookProps {
  member: Member | null;
  badgeStatus: BadgeStatus;
  onRefreshMember?: () => void;
}

export function Book({ member, badgeStatus, onRefreshMember }: BookProps) {
  const navigate = useNavigate();
  const location = useLocation();
  void (location.state as any)?.welcomePass; // used for navigation intent
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);
  const isActive = badgeStatus === 'active';
  const hasWelcomePass = member && !member.welcome_pass_redeemed;

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-4xl block mb-3">🌿</span>
          <p className="text-sm text-gray-500">Loading membership...</p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    const expDate = new Date(member.membership_end).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <Lock size={28} className="text-red-500" />
          </div>
          <div>
            <h2
              className="text-base font-semibold mb-1"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'var(--ea-midnight)',
              }}
            >
              Booking Unavailable
            </h2>
            <p className="text-sm text-red-600 font-medium">
              Your membership expired on {expDate}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Renew your membership to book experiences
            </p>
          </div>
          <Button
            onClick={() => navigate('/join')}
            className="w-full h-11 text-white font-medium rounded-lg"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            Renew Membership
          </Button>
        </div>
      </div>
    );
  }

  if (selectedService && member) {
    return (
      <BookingCalendar
        service={selectedService}
        member={member}
        onBack={() => setSelectedService(null)}
        onRefreshMember={onRefreshMember}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        {/* Hero photo banner */}
        <div className="relative rounded-xl overflow-hidden h-36">
          <img
            src="/photos/creek-trail.jpg"
            alt="Mineral Creek trail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <div>
              <h1 className="text-lg text-white font-serif">
                Book an Experience
              </h1>
              <p className="text-[11px] text-white/80">
                Welcome back, {member.first_name}
              </p>
            </div>
          </div>
        </div>

        {/* Free Welcome Pass */}
        {hasWelcomePass && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} style={{ color: 'var(--ea-emerald)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                🎁 Your Free Welcome Pass
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 ml-6">
              Every new member gets one free Oasis Pass — choose 2 or 4 hours
            </p>
            <div className="space-y-2">
              {WELCOME_PASSES.map((service) => (
                <button
                  key={`welcome-${service.id}`}
                  onClick={() => setSelectedService(service)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-border/80 text-left"
                  style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#DCFCE7', color: 'var(--ea-emerald)' }}
                  >
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                      {service.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{service.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
                      FREE
                    </p>
                    <p className="text-[10px] text-muted-foreground">Redeem →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sun size={16} style={{ color: 'var(--ea-emerald)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
              Day Passes
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mb-3 ml-6">
            Includes Zen Lounge with WiFi & coworking, spring water, trails & market
          </p>
          <div className="space-y-2">
            {DAY_PASSES.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-emerald)' }}
                >
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                    {service.name}
                  </p>
                  <p className="text-[11px] text-gray-400">{service.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
                    {service.price}
                  </p>
                  <p className="text-[10px] text-gray-400">Book →</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <MemberPassSection
          services={MEMBER_PASSES}
          member={member}
          onSelect={setSelectedService}
          onSubscriptionChange={onRefreshMember}
        />

        <ServiceSection
          title="Campsites"
          icon={<Tent size={16} style={{ color: 'var(--ea-emerald)' }} />}
          services={CAMPSITES}
          onSelect={setSelectedService}
        />
      </div>
    </div>
  );
}

// SimplyBook membership page

function MembershipModal({
  open,
  onClose,
  tier,
  member,
}: {
  open: boolean;
  onClose: (purchased: boolean) => void;
  tier: 'silver' | 'gold';
  member: Member | null;
}) {
  const label = tier === 'silver' ? 'Silver' : 'Gold';

  useEffect(() => {
    if (!open) return;

    let widgetInstance: any = null;

    const initWidget = () => {
      const container = document.getElementById('sb-membership-modal-container');
      if (container) {
        container.innerHTML = ''; // Clean up before re-init
      }

      // Pre-fill client details if member exists
      const predefinedClient = member ? {
        client: {
          name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || undefined,
          email: member.email || undefined,
          phone: member.phone || undefined,
        }
      } : {};

      // If SimplybookWidget exists globally, initialize it targeting our container
      if ((window as any).SimplybookWidget) {
        widgetInstance = new (window as any).SimplybookWidget({
          widget_type: 'membership',
          url: 'https://emeraldoasiscamp.simplybook.me',
          theme: 'air',
          theme_settings: {
            timeline_hide_unavailable: '1',
            hide_past_days: '0',
            timeline_show_end_time: '0',
            timeline_modern_display: 'as_slots',
            sb_base_color: '#13694b',
            display_item_mode: 'block',
            booking_nav_bg_color: '#e8ece2',
            body_bg_color: '#ffffff',
            sb_review_image: '',
            dark_font_color: '#101820',
            light_font_color: '#ffffff',
            btn_color_1: '#288c6f',
            sb_company_label_color: '#ffffff',
            hide_img_mode: '0',
            show_sidebar: '1',
            sb_busy: '#dad2ce',
            sb_available: '#d3e0f1',
          },
          timeline: 'modern',
          datepicker: 'top_calendar',
          is_rtl: false,
          app_config: {
            clear_session: 0,
            allow_switch_to_ada: 0,
            predefined: predefinedClient,
          },
          container_id: 'sb-membership-modal-container',
        });
      }
    };

    if (!(window as any).SimplybookWidget) {
      const script = document.createElement('script');
      script.src = 'https://widget.simplybook.me/v2/widget/widget.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    return () => {
      // Clean up widget DOM if unmounting
      const container = document.getElementById('sb-membership-modal-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose(false)}
      />
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl flex flex-col" style={{ height: '85vh', maxHeight: '700px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-none">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--ea-midnight)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Subscribe to {label} Pass
          </h3>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 text-lg font-medium px-2"
          >
            ✕
          </button>
        </div>
        
        {/* SimplyBook official widget container */}
        <div 
          id="sb-membership-modal-container" 
          className="w-full flex-grow overflow-y-auto bg-white"
        />

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex-none">
          <button
            onClick={() => onClose(true)}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            I've completed my subscription →
          </button>
        </div>
      </div>
    </div>
  );
}

const PASS_LIMITS = { silver: 5, gold: 10 } as const;

function MemberPassSection({
  services,
  member,
  onSelect,
}: {
  services: ServiceCard[];
  member: Member;
  onSelect: (s: ServiceCard) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold'>('silver');
  const [passesUsed, setPassesUsed] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);

  const hasSubscription = member.subscription_active && member.subscription_tier;
  const passLimit = member.subscription_tier ? PASS_LIMITS[member.subscription_tier] : 0;
  const passesRemaining = Math.max(0, passLimit - passesUsed);

  // Count member pass bookings this month
  useEffect(() => {
    if (!hasSubscription) { setLoadingUsage(false); return; }

    async function fetchUsage() {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { count, error } = await supabase
        .from('member_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .eq('is_member_pass', true)
        .eq('status', 'confirmed')
        .gte('booking_date', monthStart);

      if (!error && count !== null) setPassesUsed(count);
      setLoadingUsage(false);
    }
    fetchUsage();
  }, [member.id, hasSubscription]);

  const handleModalClose = async (purchased: boolean) => {
    setModalOpen(false);
    if (purchased) {
      // Force an immediate sync check before reloading the page
      try {
        await supabase.functions.invoke('simplybook-sync', { method: 'POST' });
      } catch (e) {
        console.error('Sync failed', e);
      }
      window.location.reload();
    }
  };

  if (!hasSubscription) {
    return (
      <>
        <MembershipModal
          open={modalOpen}
          onClose={handleModalClose}
          tier={selectedTier}
          member={member}
        />
        <div>
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--ea-midnight)' }}
          >
            <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
            Member Passes
          </h2>
          <div className="space-y-2">
            {/* Silver */}
            <button
              onClick={() => { setSelectedTier('silver'); setModalOpen(true); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#F0F0F0', color: '#9CA3AF' }}
              >
                <Star size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                  Silver Pass
                </p>
                <p className="text-[11px] text-gray-400">5 included day passes per month</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--ea-spirulina)' }}>
                  $25/mo
                </p>
                <p className="text-[10px] text-gray-400">Subscribe →</p>
              </div>
            </button>
            {/* Gold */}
            <button
              onClick={() => { setSelectedTier('gold'); setModalOpen(true); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FEF9C3', color: '#CA8A04' }}
              >
                <Star size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                  Gold Pass
                </p>
                <p className="text-[11px] text-gray-400">10 included day passes per month</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--ea-spirulina)' }}>
                  $50/mo
                </p>
                <p className="text-[10px] text-gray-400">Subscribe →</p>
              </div>
            </button>
          </div>
        </div>
      </>
    );
  }

  // Has active subscription — show passes with usage counter
  return (
    <div>
      <h2
        className="text-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: 'var(--ea-midnight)' }}
      >
        <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
        Member Passes
        <span
          className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: passesRemaining > 0 ? '#F0FDF4' : '#FEF2F2',
            color: passesRemaining > 0 ? 'var(--ea-emerald)' : '#DC2626',
          }}
        >
          {loadingUsage ? '...' : `${passesRemaining} of ${passLimit} remaining`}
        </span>
      </h2>

      {passesRemaining === 0 && !loadingUsage ? (
        <div className="p-4 rounded-xl bg-white border border-red-100 text-center space-y-2">
          <p className="text-sm font-medium text-red-600">
            All {member.subscription_tier === 'gold' ? 'Gold' : 'Silver'} passes used this month
          </p>
          <p className="text-xs text-gray-400">
            Passes reset on the 1st. You can still book regular day passes below.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              disabled={loadingUsage}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-emerald)' }}
              >
                {service.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                  {service.name}
                </p>
                <p className="text-[11px] text-gray-400">{service.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
                  Included
                </p>
                <p className="text-[10px] text-gray-400">Book →</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceSection({
  title,
  icon,
  services,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  services: ServiceCard[];
  onSelect: (s: ServiceCard) => void;
}) {
  return (
    <div>
      <h2
        className="text-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: 'var(--ea-midnight)' }}
      >
        {icon}
        {title}
      </h2>
      <div className="space-y-2">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
          >
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-emerald)' }}
              >
                {service.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                {service.name}
              </p>
              <p className="text-[11px] text-gray-400">{service.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
                {service.price}
              </p>
              <p className="text-[10px] text-gray-400">Book →</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}