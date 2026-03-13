import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Member, BadgeStatus } from '../../lib/types';
import { TIER_CONFIG } from '../../lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface MemberBadgeProps {
  member: Member;
  badgeStatus: BadgeStatus;
}

const statusConfig = {
  active: {
    borderColor: '#E8F5EE',
    statusBarColor: '#1B5E20',
    bgColor: '#F0FDF4',
    label: 'ACTIVE MEMBER',
    icon: CheckCircle,
    avatarBorder: '#1B5E20',
  },
  expired: {
    borderColor: '#FDEAEA',
    statusBarColor: '#B71C1C',
    bgColor: '#FEF2F2',
    label: 'MEMBERSHIP EXPIRED',
    icon: XCircle,
    avatarBorder: '#B71C1C',
  },
  future: {
    borderColor: '#FFF8E1',
    statusBarColor: '#E65100',
    bgColor: '#FFFBEB',
    label: 'FUTURE PASS',
    icon: Clock,
    avatarBorder: '#E65100',
  },
};

export function MemberBadge({ member, badgeStatus }: MemberBadgeProps) {
  const config = statusConfig[badgeStatus];
  const Icon = config.icon;
  const tier = TIER_CONFIG[member.membership_tier];
  const endDate = new Date(member.membership_end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div
        className="rounded-2xl border-2 overflow-hidden"
        style={{ borderColor: config.borderColor, backgroundColor: config.bgColor }}
      >
        <div
          className="py-2.5 px-4 flex items-center justify-center gap-2"
          style={{ backgroundColor: config.statusBarColor }}
        >
          <Icon size={18} color="white" />
          <span className="text-white text-xs font-bold tracking-wider uppercase">
            {config.label}
          </span>
        </div>
        <div className="flex flex-col items-center py-4 gap-3">
          <Avatar className="w-20 h-20 border-3" style={{ borderColor: config.avatarBorder }}>
            <AvatarImage src={member.photo_url ?? undefined} alt={`${member.first_name} ${member.last_name}`} />
            <AvatarFallback
              className="text-xl font-bold text-white"
              style={{ backgroundColor: config.statusBarColor }}
            >
              {member.first_name[0]}{member.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-[15px] font-bold" style={{ color: 'var(--ea-midnight)' }}>
              {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-gray-500">
              {tier.label} · Valid through {endDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
