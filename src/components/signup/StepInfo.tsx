import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface MemberInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licensePlate: string;
  emergencyContact: string;
  password: string;
  photoFile: File | null;
  photoPreview: string | null;
}

interface StepInfoProps {
  info: MemberInfo;
  onInfoChange: (info: MemberInfo) => void;
  onNext: () => void;
}

export function StepInfo({ info, onInfoChange, onNext }: StepInfoProps) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onInfoChange({
          ...info,
          photoFile: file,
          photoPreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const update = (field: keyof MemberInfo, value: string) => {
    onInfoChange({ ...info, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (info.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (info.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Create Supabase auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: info.email,
      password: info.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Upload photo if provided
    if (info.photoFile && authData.user) {
      const fileExt = info.photoFile.name.split('.').pop();
      const filePath = `${authData.user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, info.photoFile, { upsert: true });

      if (uploadError) {
        console.warn('Photo upload failed:', uploadError.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('member-photos')
          .getPublicUrl(filePath);
        onInfoChange({ ...info, photoPreview: urlData.publicUrl });
      }
    }

    setLoading(false);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--ea-midnight)', fontFamily: 'Inter, sans-serif' }}>
        Your Information
      </h2>

      {/* Photo upload */}
      <div className="flex flex-col items-center gap-2">
        <label
          htmlFor="photo-upload"
          className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ borderColor: '#94A3B8' }}
        >
          {info.photoPreview ? (
            <img src={info.photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Camera size={28} color="#94A3B8" />
          )}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        <span className="text-[11px] font-bold" style={{ color: 'var(--ea-emerald)' }}>
          Upload Photo *
        </span>
        <span className="text-[10px] text-gray-400">Used for visual verification</span>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs">First Name *</Label>
          <Input
            id="firstName"
            value={info.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            required
            className="bg-slate-50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
          <Input
            id="lastName"
            value={info.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            required
            className="bg-slate-50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs">Email *</Label>
        <Input
          id="email"
          type="email"
          value={info.email}
          onChange={(e) => update('email', e.target.value)}
          required
          className="bg-slate-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          value={info.phone}
          onChange={(e) => update('phone', e.target.value)}
          required
          className="bg-slate-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="licensePlate" className="text-xs">License Plate (optional)</Label>
        <Input
          id="licensePlate"
          value={info.licensePlate}
          onChange={(e) => update('licensePlate', e.target.value)}
          className="bg-slate-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="emergencyContact" className="text-xs">Emergency Contact Name & Phone *</Label>
        <Input
          id="emergencyContact"
          value={info.emergencyContact}
          onChange={(e) => update('emergencyContact', e.target.value)}
          placeholder="Jane Doe — (555) 123-4567"
          required
          className="bg-slate-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs">Password *</Label>
        <Input
          id="password"
          type="password"
          value={info.password}
          onChange={(e) => update('password', e.target.value)}
          required
          minLength={6}
          className="bg-slate-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="bg-slate-50"
        />
      </div>

      <Button
        type="submit"
        className="w-full text-white rounded-lg h-12"
        style={{ backgroundColor: 'var(--ea-emerald)' }}
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Continue →'}
      </Button>
    </form>
  );
}
