import { Droplets, ShoppingBag, Smartphone } from 'lucide-react';

export function MembershipIncludes() {
  return (
    <div className="p-4 rounded-xl bg-slate-100">
      <p className="text-xs font-bold mb-2 text-ea-midnight">
        Your membership includes:
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Droplets size={14} className="text-ea-emerald" />
          <span>Spring water (30 min parking)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <ShoppingBag size={14} className="text-ea-emerald" />
          <span>Emerald Market — coming April 2026 (select days/hrs)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Smartphone size={14} className="text-ea-emerald" />
          <span>Booking portal access</span>
        </div>
      </div>
    </div>
  );
}
