interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className="h-2 flex-1 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: i < currentStep ? 'var(--ea-emerald)' : '#E5E7EB',
          }}
        />
      ))}
    </div>
  );
}
