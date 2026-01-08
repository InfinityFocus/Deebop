'use client';

import { useState, useEffect } from 'react';
import { X, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Interest, InterestsByCategory } from '@/types/explore';

interface InterestPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (interestIds: string[]) => Promise<void>;
  initialSelectedIds?: string[];
}

export default function InterestPicker({
  isOpen,
  onClose,
  onSave,
  initialSelectedIds = [],
}: InterestPickerProps) {
  const [interests, setInterests] = useState<InterestsByCategory>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  const MIN_INTERESTS = 5;
  const MAX_INTERESTS = 10;

  useEffect(() => {
    if (isOpen) {
      fetchInterests();
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/interests');
      const data = await res.json();
      setInterests(data.interests);

      // Expand first 3 categories by default
      const categories = Object.keys(data.interests);
      setExpandedCategories(new Set(categories.slice(0, 3)));
    } catch (err) {
      console.error('Error fetching interests:', err);
      setError('Failed to load interests');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(interestId)) {
        next.delete(interestId);
      } else if (next.size < MAX_INTERESTS) {
        next.add(interestId);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size < MIN_INTERESTS) {
      setError(`Please select at least ${MIN_INTERESTS} interests`);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(Array.from(selectedIds));
      onClose();
    } catch (err) {
      console.error('Error saving interests:', err);
      setError('Failed to save interests');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold">Select Your Interests</h2>
            <p className="text-sm text-zinc-400">
              Choose {MIN_INTERESTS}-{MAX_INTERESTS} topics to personalize your
              Explore feed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection counter */}
        <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Selected:{' '}
              <span
                className={`font-bold ${
                  selectedIds.size >= MIN_INTERESTS
                    ? 'text-emerald-400'
                    : 'text-yellow-400'
                }`}
              >
                {selectedIds.size}
              </span>{' '}
              / {MAX_INTERESTS}
            </span>
            {selectedIds.size < MIN_INTERESTS && (
              <span className="text-sm text-yellow-400">
                Select {MIN_INTERESTS - selectedIds.size} more
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                selectedIds.size >= MIN_INTERESTS
                  ? 'bg-emerald-500'
                  : 'bg-yellow-500'
              }`}
              style={{
                width: `${Math.min((selectedIds.size / MAX_INTERESTS) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(interests).map(([category, categoryInterests]) => (
                <div
                  key={category}
                  className="border border-zinc-800 rounded-lg overflow-hidden"
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-medium">{category}</span>
                    {expandedCategories.has(category) ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>

                  {/* Category interests */}
                  {expandedCategories.has(category) && (
                    <div className="p-3 flex flex-wrap gap-2">
                      {categoryInterests.map((parent) => (
                        <div key={parent.id} className="contents">
                          {/* Show children if available, otherwise show parent */}
                          {parent.children && parent.children.length > 0 ? (
                            parent.children.map((child) => (
                              <button
                                key={child.id}
                                onClick={() => toggleInterest(child.id)}
                                disabled={
                                  !selectedIds.has(child.id) &&
                                  selectedIds.size >= MAX_INTERESTS
                                }
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  selectedIds.has(child.id)
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-transparent'
                                } ${
                                  !selectedIds.has(child.id) &&
                                  selectedIds.size >= MAX_INTERESTS
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                }`}
                              >
                                {child.iconEmoji && (
                                  <span>{child.iconEmoji}</span>
                                )}
                                {child.name}
                                {selectedIds.has(child.id) && (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ))
                          ) : (
                            <button
                              onClick={() => toggleInterest(parent.id)}
                              disabled={
                                !selectedIds.has(parent.id) &&
                                selectedIds.size >= MAX_INTERESTS
                              }
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                selectedIds.has(parent.id)
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-transparent'
                              } ${
                                !selectedIds.has(parent.id) &&
                                selectedIds.size >= MAX_INTERESTS
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              }`}
                            >
                              {parent.iconEmoji && (
                                <span>{parent.iconEmoji}</span>
                              )}
                              {parent.name}
                              {selectedIds.has(parent.id) && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedIds.size < MIN_INTERESTS}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Interests
          </button>
        </div>
      </div>
    </div>
  );
}
