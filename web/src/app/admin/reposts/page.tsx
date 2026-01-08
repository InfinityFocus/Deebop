'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ToggleLeft, ToggleRight, Save, Repeat, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface RepostSettings {
  id: string;
  allowChainReposts: boolean;
  createdAt: string;
  updatedAt: string;
}

async function fetchSettings(): Promise<{ settings: RepostSettings }> {
  const res = await fetch('/api/admin/reposts');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export default function AdminRepostsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    allowChainReposts: boolean;
  }>({
    allowChainReposts: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reposts'],
    queryFn: fetchSettings,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data?.settings) {
      setFormData({
        allowChainReposts: data.settings.allowChainReposts,
      });
    }
  }, [data]);

  // Track changes
  useEffect(() => {
    if (data?.settings) {
      const changed = formData.allowChainReposts !== data.settings.allowChainReposts;
      setHasChanges(changed);
    }
  }, [formData, data]);

  const updateSettings = useMutation({
    mutationFn: async (settings: typeof formData) => {
      const res = await fetch('/api/admin/reposts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reposts'] });
      setHasChanges(false);
    },
  });

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
        Failed to load repost settings. Make sure you are an admin.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Repost Settings</h1>
        <p className="text-gray-400">Configure how reposting works on the platform</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        {/* Chain Reposts Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Repeat size={20} className="text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Chain Reposting</h2>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Allow users to repost content they see in reposts (Twitter-style behavior)
            </p>
          </div>
          <button
            onClick={() => setFormData({ ...formData, allowChainReposts: !formData.allowChainReposts })}
            className={clsx(
              'p-2 rounded-lg transition ml-4',
              formData.allowChainReposts
                ? 'text-green-400 hover:bg-green-500/20'
                : 'text-gray-400 hover:bg-gray-700'
            )}
          >
            {formData.allowChainReposts ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>

        {/* Explanation */}
        <div className="py-6 space-y-4">
          <div className="flex items-start gap-3 bg-gray-900/50 rounded-lg p-4">
            <Info size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-2">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>
                  <span className="text-green-400">Enabled:</span> When users see a repost in their feed and click the repost button, they will repost the <strong className="text-white">original post</strong>.
                </li>
                <li>
                  <span className="text-red-400">Disabled:</span> The repost button is hidden on reposted content. Users must find and visit the original post to repost it.
                </li>
              </ul>
            </div>
          </div>

          {/* Current Status */}
          <div className={clsx(
            'rounded-lg p-4 border',
            formData.allowChainReposts
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          )}>
            <p className={clsx(
              'font-medium',
              formData.allowChainReposts ? 'text-emerald-400' : 'text-amber-400'
            )}>
              {formData.allowChainReposts
                ? 'Chain reposting is enabled - users can repost from anywhere in their feed'
                : 'Chain reposting is disabled - users must find original posts to repost'}
            </p>
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
