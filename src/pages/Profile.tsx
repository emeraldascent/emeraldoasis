import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { LogOut, Camera, Save, ArrowUp, CreditCard, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Member } from '../lib/types';
import { TIER_CONFIG } from '../lib/types';
import { MembershipUpgrade } from '../components/membership/MembershipUpgrade';

interface ProfileProps {
  member: Member | null;
  onLogout: () => void;
  onRefresh: () => void;
}

export function Profile({ member, onLogout, onRefresh }: ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [form, setForm] = useState({
    first_name: member?.first_name ?? '',
    last_name: member?.last_name ?? '',
    phone: member?.phone ?? '',
    license_plate: member?.license_plate ?? '',
    emergency_contact: member?.emergency_contact ?? '',
  });

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const tier = TIER_CONFIG[member.membership_tier];
  const endDate = new Date(member.membership_end).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('members')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        license_plate: form.license_plate || null,
        emergency_contact: form.emergency_contact,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id);

    setSaving(false);
    if (!error) {
      setEditing(false);
      onRefresh();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member.user_id) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${member.user_id}/avatar.${fileExt}`;

    await supabase.storage
      .from('member-photos')
      .upload(filePath, file, { upsert: true });

    const { data: urlData } = supabase.storage
      .from('member-photos')
      .getPublicUrl(filePath);

    await supabase
      .from('members')
      .update({ photo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', member.id);

    onRefresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        <h1
          className="text-lg text-center"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
        >
          My Profile
        </h1>

        {/* Photo + Name */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="w-20 h-20 border-2" style={{ borderColor: 'var(--ea-emerald)' }}>
              <AvatarImage src={member.photo_url ?? undefined} />
              <AvatarFallback
                className="text-xl font-bold text-white"
                style={{ backgroundColor: 'var(--ea-emerald)' }}
              >
                {member.first_name[0]}{member.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="photo-change"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--ea-emerald)' }}
            >
              <Camera size={14} color="white" />
            </label>
            <input
              id="photo-change"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: 'var(--ea-midnight)' }}>
              {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-gray-500">{member.email}</p>
          </div>
        </div>

        {/* Membership info — tappable to upgrade */}
        <button
          onClick={() => member.membership_tier !== 'annual' && setShowUpgrade(true)}
          className="w-full p-4 rounded-xl text-left transition-colors"
          style={{ backgroundColor: 'var(--ea-birch)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--ea-midnight)' }}>
              {tier.emoji} {tier.label} Membership
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: member.membership_tier === 'annual' ? 'var(--ea-gold)' : 'var(--ea-emerald)' }}
              >
                ${tier.price}
              </span>
              {member.membership_tier !== 'annual' && (
                <ArrowUp size={13} style={{ color: 'var(--ea-emerald)' }} />
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-500">Valid through {endDate}</p>
          {member.membership_tier !== 'annual' && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--ea-emerald)' }}>
              Tap to upgrade →
            </p>
          )}
        </button>

        {showUpgrade && (
          <MembershipUpgrade
            member={member}
            mode="upgrade"
            onComplete={onRefresh}
            onClose={() => setShowUpgrade(false)}
          />
        )}

        <Separator />

        {/* Editable fields */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: 'var(--ea-midnight)', fontFamily: 'Inter, sans-serif' }}>
              Personal Information
            </h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-medium"
                style={{ color: 'var(--ea-emerald)' }}
              >
                Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">First Name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                disabled={!editing}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Last Name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                disabled={!editing}
                className="bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!editing}
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">License Plate</Label>
            <Input
              value={form.license_plate}
              onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
              disabled={!editing}
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Emergency Contact</Label>
            <Input
              value={form.emergency_contact}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
              disabled={!editing}
              className="bg-slate-50"
            />
          </div>

          {editing && (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="flex-1 text-white rounded-lg"
                style={{ backgroundColor: 'var(--ea-emerald)' }}
                disabled={saving}
              >
                <Save size={14} className="mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setForm({
                    first_name: member.first_name,
                    last_name: member.last_name,
                    phone: member.phone,
                    license_plate: member.license_plate ?? '',
                    emergency_contact: member.emergency_contact,
                  });
                }}
                className="rounded-lg"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Logout */}
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full rounded-lg text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut size={16} className="mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
