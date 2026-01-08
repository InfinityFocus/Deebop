'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe, Users, Lock, MapPin, Hash, X, Clock, Calendar, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useCreateAlbum } from '@/hooks/useAlbums';
import type { Visibility } from '@/types/database';

interface CreateAlbumFormProps {
  onSuccess?: (albumId: string) => void;
  onCancel?: () => void;
}

export function CreateAlbumForm({ onSuccess, onCancel }: CreateAlbumFormProps) {
  const router = useRouter();
  const createAlbum = useCreateAlbum();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [location, setLocation] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [hideTeaser, setHideTeaser] = useState(false);

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const result = await createAlbum.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        location: location.trim() || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        scheduledFor: isScheduled && scheduledFor ? scheduledFor : undefined,
        hideTeaser: isScheduled ? hideTeaser : undefined,
      });

      if (onSuccess) {
        onSuccess(result.album.id);
      } else {
        router.push(`/albums/${result.album.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create album');
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this album' },
    { value: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only invited members can see' },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
          Album Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your album a name"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this album about?"
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
          maxLength={500}
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Who can see this album?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {visibilityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVisibility(option.value)}
              className={clsx(
                'flex flex-col items-center p-4 rounded-lg border transition',
                visibility === option.value
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              )}
            >
              <option.icon
                size={24}
                className={clsx(
                  'mb-2',
                  visibility === option.value ? 'text-emerald-400' : 'text-gray-400'
                )}
              />
              <span
                className={clsx(
                  'font-medium',
                  visibility === option.value ? 'text-white' : 'text-gray-300'
                )}
              >
                {option.label}
              </span>
              <span className="text-xs text-gray-500 text-center mt-1">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
          Location
        </label>
        <div className="relative">
          <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add a location"
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
            maxLength={100}
          />
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <label htmlFor="hashtags" className="block text-sm font-medium text-gray-300 mb-2">
          Hashtags
        </label>
        <div className="relative">
          <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id="hashtags"
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddHashtag}
            placeholder="Add hashtags (press Enter)"
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
          />
        </div>
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveHashtag(tag)}
                  className="hover:text-white transition"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Drop Toggle */}
      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-emerald-400" />
            <div>
              <p className="font-medium text-white">Schedule Drop</p>
              <p className="text-sm text-gray-500">Set a future release time</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsScheduled(!isScheduled);
              if (!isScheduled) {
                // Default to 1 hour from now
                const defaultTime = new Date(Date.now() + 60 * 60 * 1000);
                setScheduledFor(defaultTime.toISOString().slice(0, 16));
              }
            }}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              isScheduled ? 'bg-emerald-500' : 'bg-gray-700'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isScheduled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {isScheduled && (
          <div className="space-y-4 pl-8">
            {/* Date/Time Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Drop Time
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 5 minutes from now</p>
            </div>

            {/* Hide Teaser Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                {hideTeaser ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-emerald-400" />}
                <div>
                  <p className="text-sm font-medium text-white">Hide teaser preview</p>
                  <p className="text-xs text-gray-500">
                    {hideTeaser
                      ? 'Only title and countdown shown'
                      : 'Blurred preview will be shown'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHideTeaser(!hideTeaser)}
                className={clsx(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  hideTeaser ? 'bg-amber-500' : 'bg-gray-700'
                )}
              >
                <span
                  className={clsx(
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    hideTeaser ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Preview Info */}
            {scheduledFor && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Clock size={14} />
                  <span className="text-sm font-medium">Scheduled</span>
                </div>
                <p className="text-sm text-gray-300">
                  Your followers will see a countdown card until{' '}
                  <span className="text-white font-medium">
                    {new Date(scheduledFor).toLocaleString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createAlbum.isPending || !title.trim() || (isScheduled && !scheduledFor)}
          className={clsx(
            'flex-1 py-3 px-4 font-medium rounded-lg transition flex items-center justify-center gap-2',
            createAlbum.isPending || !title.trim() || (isScheduled && !scheduledFor)
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : isScheduled && scheduledFor
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
          )}
        >
          {createAlbum.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {isScheduled ? 'Scheduling...' : 'Creating...'}
            </>
          ) : isScheduled && scheduledFor ? (
            <>
              <Clock size={18} />
              Schedule Album
            </>
          ) : (
            'Create Album'
          )}
        </button>
      </div>
    </form>
  );
}
