'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, AlertCircle, Pause, Play } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { Avatar, AvatarSelector } from '@/components/child/AvatarSelector';
import { OversightSelector } from '@/components/parent/OversightSelector';
import type { Child, AgeBand, OversightMode } from '@/types';

const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: '6-8', label: '6-8 years' },
  { value: '9-10', label: '9-10 years' },
  { value: '11-12', label: '11-12 years' },
];

export default function ChildSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('cat');
  const [ageBand, setAgeBand] = useState<AgeBand>('6-8');
  const [oversightMode, setOversightMode] = useState<OversightMode>('approve_first');
  const [messagingPaused, setMessagingPaused] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('');
  const [quietHoursEnd, setQuietHoursEnd] = useState('');

  useEffect(() => {
    async function fetchChild() {
      try {
        const response = await fetch(`/api/parent/children/${childId}`);
        const data = await response.json();

        if (data.success) {
          const c = data.data;
          setChild(c);
          setDisplayName(c.displayName);
          setAvatarId(c.avatarId);
          setAgeBand(c.ageBand);
          setOversightMode(c.oversightMode);
          setMessagingPaused(c.messagingPaused);
          setQuietHoursStart(c.quietHoursStart || '');
          setQuietHoursEnd(c.quietHoursEnd || '');
        } else {
          setError('Child not found');
        }
      } catch {
        setError('Failed to load child settings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChild();
  }, [childId]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/parent/children/${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          avatarId,
          ageBand,
          oversightMode,
          messagingPaused,
          quietHoursStart: quietHoursStart || null,
          quietHoursEnd: quietHoursEnd || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Settings saved successfully');
        setChild(data.data);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/parent/children/${childId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/children');
      } else {
        setError(data.error || 'Failed to delete account');
        setShowDeleteConfirm(false);
      }
    } catch {
      setError('Something went wrong');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">Child not found</p>
          <Link href="/children" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
            Back to Children
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/children" className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-3">
          <Avatar avatarId={child.avatarId} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-white">{child.displayName}</h1>
            <p className="text-gray-400">@{child.username}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-primary-500/10 border border-primary-500/20 rounded-xl">
          <Save className="text-primary-400 flex-shrink-0" size={20} />
          <p className="text-primary-400 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
              <AvatarSelector selected={avatarId} onSelect={setAvatarId} size="sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Age Range</label>
              <div className="grid grid-cols-3 gap-2">
                {AGE_BANDS.map((band) => (
                  <button
                    key={band.value}
                    type="button"
                    onClick={() => setAgeBand(band.value)}
                    className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                      ageBand === band.value
                        ? 'border-primary-500 bg-primary-500/10 text-white'
                        : 'border-dark-600 text-gray-400 hover:border-dark-500'
                    }`}
                  >
                    {band.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Section */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Safety Settings</h2>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Message Oversight</h3>
            <OversightSelector selected={oversightMode} onSelect={setOversightMode} />
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Messaging Status</h3>
            <button
              type="button"
              onClick={() => setMessagingPaused(!messagingPaused)}
              className={`flex items-center gap-3 w-full p-4 rounded-lg border-2 transition-colors ${
                messagingPaused
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              {messagingPaused ? (
                <Pause className="text-yellow-400" size={20} />
              ) : (
                <Play className="text-primary-400" size={20} />
              )}
              <div className="text-left">
                <p className={messagingPaused ? 'text-yellow-400' : 'text-white'}>
                  {messagingPaused ? 'Messaging Paused' : 'Messaging Active'}
                </p>
                <p className="text-sm text-gray-500">
                  {messagingPaused
                    ? 'Your child cannot send or receive messages'
                    : 'Your child can send and receive messages'}
                </p>
              </div>
            </button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Quiet Hours (Optional)</h3>
            <p className="text-sm text-gray-500 mb-3">
              During quiet hours, your child won&apos;t receive notifications
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-2">Delete Account?</h3>
              <p className="text-gray-400 mb-6">
                This will permanently delete {child.displayName}&apos;s account, including all
                messages and friend connections. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
