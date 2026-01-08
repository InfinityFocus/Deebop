'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ToggleLeft, ToggleRight, Save, Clock, Hash, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface DoomScrollSettings {
  id: string;
  isEnabled: boolean;
  postsThreshold: number;
  timeThresholdSeconds: number;
  breakDurationSeconds: number;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchSettings(): Promise<{ settings: DoomScrollSettings }> {
  const res = await fetch('/api/admin/wellbeing');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export default function AdminWellbeingPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    isEnabled: boolean;
    postsThreshold: number;
    timeThresholdSeconds: number;
    breakDurationSeconds: number;
    title: string;
    message: string;
  }>({
    isEnabled: true,
    postsThreshold: 50,
    timeThresholdSeconds: 600,
    breakDurationSeconds: 300,
    title: 'Doom Scrolling?',
    message: 'As much as we love having you on Deebop, you\'ve been scrolling for a while. Is it time to take a break?',
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-wellbeing'],
    queryFn: fetchSettings,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data?.settings) {
      setFormData({
        isEnabled: data.settings.isEnabled,
        postsThreshold: data.settings.postsThreshold,
        timeThresholdSeconds: data.settings.timeThresholdSeconds,
        breakDurationSeconds: data.settings.breakDurationSeconds,
        title: data.settings.title,
        message: data.settings.message,
      });
    }
  }, [data]);

  // Track changes
  useEffect(() => {
    if (data?.settings) {
      const changed =
        formData.isEnabled !== data.settings.isEnabled ||
        formData.postsThreshold !== data.settings.postsThreshold ||
        formData.timeThresholdSeconds !== data.settings.timeThresholdSeconds ||
        formData.breakDurationSeconds !== data.settings.breakDurationSeconds ||
        formData.title !== data.settings.title ||
        formData.message !== data.settings.message;
      setHasChanges(changed);
    }
  }, [formData, data]);

  const updateSettings = useMutation({
    mutationFn: async (settings: typeof formData) => {
      const res = await fetch('/api/admin/wellbeing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wellbeing'] });
      setHasChanges(false);
    },
  });

  // Format seconds to human readable time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-red-400">
        Failed to load wellbeing settings. Make sure you are an admin.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wellbeing Settings</h1>
        <p className="text-gray-400">Configure doom scrolling intervention to help users take breaks</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Doom Scroll Prevention</h2>
            <p className="text-sm text-gray-400">Show a friendly reminder when users scroll too much</p>
          </div>
          <button
            onClick={() => setFormData({ ...formData, isEnabled: !formData.isEnabled })}
            className={clsx(
              'p-2 rounded-lg transition',
              formData.isEnabled
                ? 'text-green-400 hover:bg-green-500/20'
                : 'text-gray-400 hover:bg-gray-700'
            )}
          >
            {formData.isEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>

        {/* Thresholds */}
        <div className="py-6 border-b border-gray-700 space-y-6">
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Info size={16} />
            Trigger Conditions (whichever comes first)
          </h3>

          {/* Posts Threshold */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Hash size={16} />
              Show warning after scrolling through X posts
            </label>
            <div className="flex gap-2 flex-wrap">
              {[25, 50, 75, 100, 150].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormData({ ...formData, postsThreshold: val })}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition',
                    formData.postsThreshold === val
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  {val}
                </button>
              ))}
              <input
                type="number"
                min="10"
                max="500"
                value={formData.postsThreshold}
                onChange={(e) => setFormData({ ...formData, postsThreshold: Math.max(10, parseInt(e.target.value) || 50) })}
                className="w-20 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Time Threshold */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Clock size={16} />
              Show warning after X time spent scrolling
            </label>
            <div className="flex gap-2 flex-wrap">
              {[300, 600, 900, 1200, 1800].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormData({ ...formData, timeThresholdSeconds: val })}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition',
                    formData.timeThresholdSeconds === val
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  {formatTime(val)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="60"
                max="7200"
                step="60"
                value={formData.timeThresholdSeconds}
                onChange={(e) => setFormData({ ...formData, timeThresholdSeconds: Math.max(60, parseInt(e.target.value) || 600) })}
                className="w-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-400">seconds ({formatTime(formData.timeThresholdSeconds)})</span>
            </div>
          </div>
        </div>

        {/* Break Duration */}
        <div className="py-6 border-b border-gray-700 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Break Duration</h3>
            <p className="text-xs text-gray-500 mb-3">When users click &quot;Take a Break&quot;, the feed will be blurred for this duration.</p>
            <div className="flex gap-2 flex-wrap">
              {[60, 300, 600, 900, 1800].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormData({ ...formData, breakDurationSeconds: val })}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition',
                    formData.breakDurationSeconds === val
                      ? 'bg-amber-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  {formatTime(val)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="60"
                max="3600"
                step="60"
                value={formData.breakDurationSeconds}
                onChange={(e) => setFormData({ ...formData, breakDurationSeconds: Math.max(60, parseInt(e.target.value) || 300) })}
                className="w-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-400">seconds ({formatTime(formData.breakDurationSeconds)})</span>
            </div>
          </div>
        </div>

        {/* Message Customization */}
        <div className="py-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Warning Message</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Doom Scrolling?"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Message
              <span className="ml-2 text-gray-500">(Use {'{posts}'} for post count, {'{time}'} for duration)</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="As much as we love having you on Deebop, you've been scrolling for a while. Is it time to take a break?"
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="py-6 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Preview</h3>
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-6">
            <h4 className="text-xl font-bold text-amber-400 mb-2">{formData.title || 'Doom Scrolling?'}</h4>
            <p className="text-gray-300">
              {(formData.message || 'As much as we love having you on Deebop, you\'ve been scrolling for a while. Is it time to take a break?')
                .replace('{posts}', formData.postsThreshold.toString())
                .replace('{time}', formatTime(formData.timeThresholdSeconds))}
            </p>
            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition">
                Take a Break
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                Keep Scrolling
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-700">
          <button
            onClick={() => updateSettings.mutate(formData)}
            disabled={updateSettings.isPending || !hasChanges}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition',
              hasChanges
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            {updateSettings.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {updateSettings.isPending ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
          {updateSettings.isSuccess && (
            <p className="mt-2 text-sm text-green-400">Settings saved successfully!</p>
          )}
          {updateSettings.isError && (
            <p className="mt-2 text-sm text-red-400">Failed to save settings. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
