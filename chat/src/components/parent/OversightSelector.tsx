'use client';

import { Eye, Shield, ShieldCheck } from 'lucide-react';
import type { OversightMode } from '@/types';

interface OversightOption {
  value: OversightMode;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const OPTIONS: OversightOption[] = [
  {
    value: 'monitor',
    label: 'Monitor Only',
    description: 'Messages are delivered immediately. You can review all conversations anytime.',
    icon: Eye,
    color: 'cyan',
  },
  {
    value: 'approve_first',
    label: 'Approve First Contact',
    description: 'First message to each new friend needs approval. After that, messages flow freely.',
    icon: Shield,
    color: 'primary',
  },
  {
    value: 'approve_all',
    label: 'Approve All Messages',
    description: 'Every outgoing message requires your approval before being sent.',
    icon: ShieldCheck,
    color: 'yellow',
  },
];

interface Props {
  selected: OversightMode;
  onSelect: (mode: OversightMode) => void;
  disabled?: boolean;
}

export function OversightSelector({ selected, onSelect, disabled }: Props) {
  return (
    <div className="space-y-3">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selected === option.value;

        const colorClasses = {
          cyan: isSelected ? 'border-cyan-500 bg-cyan-500/10' : '',
          primary: isSelected ? 'border-primary-500 bg-primary-500/10' : '',
          yellow: isSelected ? 'border-yellow-500 bg-yellow-500/10' : '',
        };

        const iconColorClasses = {
          cyan: 'text-cyan-400',
          primary: 'text-primary-400',
          yellow: 'text-yellow-400',
        };

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
              isSelected
                ? colorClasses[option.color as keyof typeof colorClasses]
                : 'border-dark-600 hover:border-dark-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-dark-800' : 'bg-dark-700'}`}>
                <Icon
                  size={24}
                  className={isSelected ? iconColorClasses[option.color as keyof typeof iconColorClasses] : 'text-gray-500'}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {option.label}
                  </h3>
                  {option.value === 'approve_first' && (
                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                  {option.description}
                </p>
              </div>
              <div className="mt-1">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-primary-500' : 'border-dark-500'
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
