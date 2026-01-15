'use client';

import { Check } from 'lucide-react';

interface Props {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = [
  'Welcome',
  'Add child',
  'Oversight',
  'Friends',
  'Quiet hours',
  'Complete',
];

export function OnboardingProgress({ currentStep, totalSteps = 6 }: Props) {
  return (
    <div className="mb-8">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-primary-500 text-white'
                    : isCurrent
                    ? 'bg-primary-500/20 text-primary-400 border-2 border-primary-500'
                    : 'bg-dark-700 text-gray-500'
                }`}
              >
                {isCompleted ? <Check size={16} /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`w-6 h-0.5 ${
                    isCompleted ? 'bg-primary-500' : 'bg-dark-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step label */}
      <p className="text-center text-sm text-gray-400 mt-3">
        Step {currentStep} of {totalSteps}: {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );
}
