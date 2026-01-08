'use client';

import { useState, useEffect } from 'react';
import { Loader2, Globe, Users, Lock, MapPin, Hash, X, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { useAlbum, useUpdateAlbum } from '@/hooks/useAlbum';
import type { Visibility } from '@/types/database';

interface EditAlbumFormProps {
  albumId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditAlbumForm({ albumId, onSuccess, onCancel }: EditAlbumFormProps) {
  const { album, isLoading: albumLoading } = useAlbum(albumId);
  const updateAlbum = useUpdateAlbum(albumId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [location, setLocation] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Populate form when album loads
  useEffect(() => {
    if (album) {
      setTitle(album.title);
      setDescription(album.description || '');
      setVisibility(album.visibility);
      setLocation(album.location || '');
      setHashtags(album.hashtags || []);
    }
  }, [album]);

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
      await updateAlbum.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        location: location.trim() || undefined,
        hashtags: hashtags.length > 0 ? hashtags : [],
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update album');
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this album' },
    { value: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only invited members can see' },
  ] as const;

  if (albumLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-12 text-red-400">
        Album not found
      </div>
    );
  }

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
          disabled={updateAlbum.isPending || !title.trim()}
          className={clsx(
            'flex-1 py-3 px-4 font-medium rounded-lg transition flex items-center justify-center gap-2',
            updateAlbum.isPending || !title.trim()
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
          )}
        >
          {updateAlbum.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
