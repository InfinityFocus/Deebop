'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import type { Interest, InterestsByCategory } from '@/types/explore';

const MIN_INTERESTS = 5;
const MAX_INTERESTS = 10;

export default function InterestsSettingsPage() {
  const { userInterests, setUserInterests } = useExplorePreferencesStore();
  const [allInterests, setAllInterests] = useState<InterestsByCategory>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all interests
      const interestsRes = await fetch('/api/interests');
      const interestsData = await interestsRes.json();
      setAllInterests(interestsData.interests);

      // Expand first 3 categories
      const categories = Object.keys(interestsData.interests);
      setExpandedCategories(new Set(categories.slice(0, 3)));

      // Fetch user's interests
      const userRes = await fetch('/api/user/interests');
      if (userRes.ok) {
        const userData = await userRes.json();
        const ids = new Set<string>(userData.interests.map((i: Interest) => i.id));
        setSelectedIds(ids);
        setUserInterests(userData.interests);
      }
    } catch (err) {
      console.error('Error fetching interests:', err);
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
    setMessage(null);
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
      setMessage({ type: 'error', text: `Please select at least ${MIN_INTERESTS} interests` });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserInterests(data.interests);
        setMessage({ type: 'success', text: 'Interests saved successfully!' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save interests' });
      }
    } catch (err) {
      console.error('Error saving interests:', err);
      setMessage({ type: 'error', text: 'Failed to save interests' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Your Interests</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || selectedIds.size < MIN_INTERESTS}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>

      {/* Selection counter */}
      <div className="max-w-2xl mx-auto px-4 py-4 border-b border-zinc-800">
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

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div
            className={`p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Interests list */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {Object.entries(allInterests).map(([category, categoryInterests]) => (
          <div
            key={category}
            className="border border-zinc-800 rounded-xl overflow-hidden"
          >
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
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
              <div className="p-4 flex flex-wrap gap-2">
                {categoryInterests.map((parent) => (
                  <div key={parent.id} className="contents">
                    {parent.children && parent.children.length > 0 ? (
                      parent.children.map((child: Interest) => (
                        <button
                          key={child.id}
                          onClick={() => toggleInterest(child.id)}
                          disabled={
                            !selectedIds.has(child.id) &&
                            selectedIds.size >= MAX_INTERESTS
                          }
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
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
                          {child.iconEmoji && <span>{child.iconEmoji}</span>}
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
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
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
                        {parent.iconEmoji && <span>{parent.iconEmoji}</span>}
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
    </div>
  );
}
