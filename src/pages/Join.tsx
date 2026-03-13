import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepProgress } from '../components/signup/StepProgress';
import { StepAgreement } from '../components/signup/StepAgreement';
import { StepInfo, type MemberInfo } from '../components/signup/StepInfo';
import { StepTier } from '../components/signup/StepTier';
import { supabase } from '../lib/supabase';
import { TIER_CONFIG, type MembershipTier } from '../lib/types';

export function Join() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('weekly');
  const [loading, setLoading] = useState(false);

  const [info, setInfo] = useState<MemberInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licensePlate: '',
    emergencyContact: '',
    password: '',
    photoFile: null,
    photoPreview: null,
  });

  const handleComplete = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const tierConfig = TIER_CONFIG[selectedTier];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + tierConfig.days);

    // Get photo URL from storage if uploaded
    let photoUrl: string | null = null;
    if (info.photoPreview && info.photoPreview.startsWith('http')) {
      photoUrl = info.photoPreview;
    }

    const { error } = await supabase.from('members').insert({
      user_id: user.id,
      first_name: info.firstName,
      last_name: info.lastName,
      email: info.email,
      phone: info.phone,
      emergency_contact: info.emergencyContact,
      license_plate: info.licensePlate || null,
      photo_url: photoUrl,
      membership_tier: selectedTier,
      membership_start: startDate.toISOString().split('T')[0],
      membership_end: endDate.toISOString().split('T')[0],
      pma_agreed: true,
      pma_agreed_at: new Date().toISOString(),
      source: 'website',
      welcome_credits_issued: true,
    });

    setLoading(false);

    if (error) {
      console.error('Error creating member:', error);
      return;
    }

    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-md mx-auto">
      <StepProgress currentStep={step} totalSteps={3} />

      {step === 1 && (
        <StepAgreement onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <StepInfo
          info={info}
          onInfoChange={setInfo}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepTier
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          onComplete={handleComplete}
          loading={loading}
        />
      )}
    </div>
  );
}
