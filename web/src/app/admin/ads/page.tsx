'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink, Eye, MousePointer, TrendingUp, Upload, X, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

type FeedTarget = 'discovery' | 'following' | 'both';

interface Ad {
  id: string;
  image_url: string;
  headline: string;
  destination_url: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  ctr: string;
  frequency_free: number;
  frequency_standard: number;
  feed_target: FeedTarget;
  created_at: string;
}

async function fetchAds(): Promise<{ ads: Ad[] }> {
  const res = await fetch('/api/admin/ads');
  if (!res.ok) throw new Error('Failed to fetch ads');
  return res.json();
}

export default function AdminAdsPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAd, setNewAd] = useState({
    imageUrl: '',
    headline: '',
    destinationUrl: '',
    frequencyFree: 5,
    frequencyStandard: 10,
    feedTarget: 'both' as FeedTarget,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Max size: 10MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/ads/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await res.json();
      setNewAd((prev) => ({ ...prev, imageUrl: url }));
      setPreviewUrl(url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setPreviewUrl(null);
      URL.revokeObjectURL(localPreview);
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setNewAd((prev) => ({ ...prev, imageUrl: '' }));
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: fetchAds,
  });

  const createAd = useMutation({
    mutationFn: async (ad: typeof newAd) => {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ad),
      });
      if (!res.ok) throw new Error('Failed to create ad');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      setShowCreateForm(false);
      setNewAd({
        imageUrl: '',
        headline: '',
        destinationUrl: '',
        frequencyFree: 5,
        frequencyStandard: 10,
        feedTarget: 'both',
      });
      setPreviewUrl(null);
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  const toggleAd = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to update ad');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete ad');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
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
        Failed to load ads. Make sure you are an admin.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ad Management</h1>
          <p className="text-gray-400">Manage platform ads shown to Free and Standard users</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
        >
          <Plus size={20} />
          Create Ad
        </button>
      </div>

      {/* Create Ad Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Ad</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ad Image
              </label>

              {/* Image preview or upload area */}
              {previewUrl || newAd.imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={previewUrl || newAd.imageUrl}
                    alt="Ad preview"
                    className="max-w-xs h-40 object-cover rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition"
                  >
                    <X size={16} />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-600 hover:border-emerald-500 rounded-lg p-8 text-center cursor-pointer transition group"
                >
                  <div className="flex flex-col items-center gap-2">
                    {isUploading ? (
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 group-hover:bg-emerald-500/20 rounded-full flex items-center justify-center transition">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-emerald-400" />
                      </div>
                    )}
                    <p className="text-gray-400 group-hover:text-gray-300">
                      {isUploading ? 'Uploading...' : 'Click to upload image'}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploadError && (
                <p className="mt-2 text-sm text-red-400">{uploadError}</p>
              )}

              {/* Optional: manual URL input */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url) {
                      setNewAd((prev) => ({ ...prev, imageUrl: url }));
                      setPreviewUrl(url);
                    }
                  }}
                  className="text-sm text-gray-400 hover:text-emerald-400 transition"
                >
                  Or enter URL manually
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={newAd.headline}
                onChange={(e) => setNewAd({ ...newAd, headline: e.target.value })}
                placeholder="Check out our amazing product!"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Destination URL
              </label>
              <input
                type="url"
                value={newAd.destinationUrl}
                onChange={(e) => setNewAd({ ...newAd, destinationUrl: e.target.value })}
                placeholder="https://example.com/landing-page"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Display Frequency Section */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Display Frequency</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Free Users - Show every X posts
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 10, 15, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewAd({ ...newAd, frequencyFree: val })}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                          newAd.frequencyFree === val
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        )}
                      >
                        {val}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newAd.frequencyFree}
                      onChange={(e) => setNewAd({ ...newAd, frequencyFree: Math.max(1, parseInt(e.target.value) || 5) })}
                      className="w-16 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Standard Users - Show every X posts
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 10, 15, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewAd({ ...newAd, frequencyStandard: val })}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                          newAd.frequencyStandard === val
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        )}
                      >
                        {val}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newAd.frequencyStandard}
                      onChange={(e) => setNewAd({ ...newAd, frequencyStandard: Math.max(1, parseInt(e.target.value) || 10) })}
                      className="w-16 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Targeting Section */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Feed Targeting</h3>
              <div className="flex gap-3 flex-wrap">
                {[
                  { value: 'both', label: 'Both feeds' },
                  { value: 'discovery', label: 'Discovery only' },
                  { value: 'following', label: 'Following only' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNewAd({ ...newAd, feedTarget: option.value as FeedTarget })}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm font-medium transition',
                      newAd.feedTarget === option.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => createAd.mutate(newAd)}
                disabled={createAd.isPending || !newAd.imageUrl || !newAd.headline || !newAd.destinationUrl}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createAd.isPending && <Loader2 size={16} className="animate-spin" />}
                Create Ad
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAd({
                    imageUrl: '',
                    headline: '',
                    destinationUrl: '',
                    frequencyFree: 5,
                    frequencyStandard: 10,
                    feedTarget: 'both',
                  });
                  setPreviewUrl(null);
                  setUploadError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ads List */}
      {data?.ads.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-gray-400">No ads yet. Create your first ad to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.ads.map((ad) => (
            <div
              key={ad.id}
              className={clsx(
                'bg-gray-800 rounded-xl border overflow-hidden',
                ad.is_active ? 'border-green-500/30' : 'border-gray-700'
              )}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Preview */}
                <img
                  src={ad.image_url}
                  alt={ad.headline}
                  className="w-32 h-20 object-cover rounded-lg"
                />

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{ad.headline}</h3>
                      <a
                        href={ad.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {ad.destination_url}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <span
                      className={clsx(
                        'px-2 py-1 rounded-full text-xs',
                        ad.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      )}
                    >
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Eye size={14} />
                      {ad.impressions.toLocaleString()} impressions
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <MousePointer size={14} />
                      {ad.clicks.toLocaleString()} clicks
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <TrendingUp size={14} />
                      {ad.ctr}% CTR
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                      Free: every {ad.frequency_free} posts
                    </span>
                    <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                      Standard: every {ad.frequency_standard} posts
                    </span>
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs',
                      ad.feed_target === 'both' && 'bg-blue-500/20 text-blue-400',
                      ad.feed_target === 'discovery' && 'bg-purple-500/20 text-purple-400',
                      ad.feed_target === 'following' && 'bg-cyan-500/20 text-cyan-400'
                    )}>
                      {ad.feed_target === 'both' && 'Both feeds'}
                      {ad.feed_target === 'discovery' && 'Discovery only'}
                      {ad.feed_target === 'following' && 'Following only'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAd.mutate({ id: ad.id, isActive: !ad.is_active })}
                    disabled={toggleAd.isPending}
                    className={clsx(
                      'p-2 rounded-lg transition',
                      ad.is_active
                        ? 'text-green-400 hover:bg-green-500/20'
                        : 'text-gray-400 hover:bg-gray-700'
                    )}
                    title={ad.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {ad.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this ad?')) {
                        deleteAd.mutate(ad.id);
                      }
                    }}
                    disabled={deleteAd.isPending}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
