'use client';

import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';

interface PersonalizedInviteFormProps {
  code: string;
  onGenerate: (names: string[]) => void;
  isLoading?: boolean;
}

export function PersonalizedInviteForm({
  code,
  onGenerate,
  isLoading = false,
}: PersonalizedInviteFormProps) {
  const [childNames, setChildNames] = useState<string[]>(['']);
  const [error, setError] = useState('');

  const handleAddName = () => {
    if (childNames.length < 5) {
      setChildNames([...childNames, '']);
    }
  };

  const handleRemoveName = (index: number) => {
    if (childNames.length > 1) {
      setChildNames(childNames.filter((_, i) => i !== index));
    }
  };

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...childNames];
    newNames[index] = value;
    setChildNames(newNames);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validNames = childNames.map(n => n.trim()).filter(n => n.length > 0);

    if (validNames.length === 0) {
      setError('Please enter at least one child name');
      return;
    }

    onGenerate(validNames);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Your child&apos;s name(s)
        </label>
        <p className="text-xs text-gray-500">
          Add names to create a personalized invite message
        </p>

        {childNames.map((name, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              placeholder="Child's name"
              maxLength={50}
              className="flex-1"
            />
            {childNames.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveName(index)}
                className="p-2.5 text-gray-400 hover:text-gray-300 bg-dark-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        {childNames.length < 5 && (
          <button
            type="button"
            onClick={handleAddName}
            className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
          >
            <Plus className="w-4 h-4" />
            Add another child
          </button>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        leftIcon={<Sparkles className="w-4 h-4" />}
        className="w-full"
      >
        Generate personalized link
      </Button>
    </form>
  );
}
