'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Users, Lock, ChevronDown } from 'lucide-react';

export type Visibility = 'public' | 'followers' | 'private';

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  onPrivateSelect?: () => void; // Callback when private is selected to open audience picker
  disabled?: boolean;
}

const visibilityOptions: {
  value: Visibility;
  label: string;
  description: string;
  icon: typeof Globe;
}[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Visible to all logged-in users',
    icon: Globe,
  },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Only your followers can see this',
    icon: Users,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Select specific people or groups',
    icon: Lock,
  },
];

export function VisibilitySelector({
  value,
  onChange,
  onPrivateSelect,
  disabled = false,
}: VisibilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = visibilityOptions.find((opt) => opt.value === value) || visibilityOptions[0];
  const Icon = selectedOption.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: typeof visibilityOptions[0]) => {
    onChange(option.value);
    setIsOpen(false);

    // If private is selected, trigger the audience picker
    if (option.value === 'private' && onPrivateSelect) {
      onPrivateSelect();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
          ${disabled
            ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
            : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white cursor-pointer'
          }
        `}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {visibilityOptions.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`
                  w-full flex items-start gap-3 p-3 text-left transition-colors
                  ${isSelected
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                  }
                `}
              >
                <OptionIcon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{option.description}</div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
