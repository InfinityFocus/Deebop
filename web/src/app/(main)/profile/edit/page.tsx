'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, Crown, Camera, X, ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from 'clsx';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setProfileLink(user.profile_link || '');
      setIsPrivate(user.is_private || false);
      setAvatarUrl(user.avatar_url || null);
      setCoverImageUrl(user.cover_image_url || null);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload avatar');
        setAvatarPreview(null);
        return;
      }

      setAvatarUrl(data.avatar_url);
      refreshUser?.();
    } catch (err) {
      setError('Failed to upload avatar');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setError('');

    try {
      const res = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to remove avatar');
        return;
      }

      setAvatarUrl(null);
      setAvatarPreview(null);
      refreshUser?.();
    } catch (err) {
      setError('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };



  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { setError('Invalid file type'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Max 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setUploadingCover(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await fetch('/api/users/me/cover', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to upload'); setCoverPreview(null); return; }
      setCoverImageUrl(data.cover_image_url);
      refreshUser?.();
    } catch { setError('Failed to upload cover'); setCoverPreview(null); } finally { setUploadingCover(false); }
  };

  const handleRemoveCover = async () => {
    setUploadingCover(true);
    setError('');
    try {
      const res = await fetch('/api/users/me/cover', { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Failed'); return; }
      setCoverImageUrl(null);
      setCoverPreview(null);
      refreshUser?.();
    } catch { setError('Failed to remove cover'); } finally { setUploadingCover(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          profile_link: profileLink,
          is_private: isPrivate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
        return;
      }

      setSuccess(true);
      refreshUser?.();
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const canUseProfileLink = user.tier !== 'free';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/profile"
          className="p-2 -ml-2 hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
          <div className="relative">
            {coverPreview || coverImageUrl ? (
              <img src={coverPreview || coverImageUrl || ''} alt="Cover" className="w-full h-32 rounded-xl object-cover border border-gray-700" />
            ) : (
              <div className="w-full h-32 rounded-xl bg-gradient-to-r from-emerald-600 via-yellow-500 to-cyan-500 border border-gray-700" />
            )}
            {uploadingCover && (
              <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
              className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 rounded-lg flex items-center gap-2 text-white text-sm transition disabled:opacity-50">
              <ImageIcon size={16} />
              {coverImageUrl || coverPreview ? 'Change' : 'Add Cover'}
            </button>
            {(coverImageUrl || coverPreview) && !uploadingCover && (
              <button type="button" onClick={handleRemoveCover}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition">
                <X size={16} />
              </button>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleCoverChange} className="hidden" />
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Avatar Display */}
            {avatarPreview || avatarUrl ? (
              <img
                src={avatarPreview || avatarUrl || ''}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white">
                {displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            {/* Upload Overlay */}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white transition disabled:opacity-50"
            >
              <Camera size={16} />
            </button>

            {/* Remove Button (if has avatar) */}
            {(avatarUrl || avatarPreview) && !uploadingAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute top-0 right-0 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <p className="text-sm text-gray-500 mt-2">
            Click the camera to upload a photo
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            maxLength={50}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <p className="text-xs text-gray-500 mt-1">
            {displayName.length}/50 characters
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself"
            maxLength={160}
            rows={3}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio.length}/160 characters
          </p>
        </div>

        {/* Profile Link */}
        <div>
          <label htmlFor="profileLink" className="block text-sm font-medium text-gray-300 mb-2">
            Profile Link
            {!canUseProfileLink && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500">
                <Crown size={12} />
                Standard or Pro only
              </span>
            )}
          </label>
          <input
            id="profileLink"
            type="url"
            value={profileLink}
            onChange={(e) => setProfileLink(e.target.value)}
            placeholder="https://your-website.com"
            disabled={!canUseProfileLink}
            className={clsx(
              'w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition',
              !canUseProfileLink && 'opacity-50 cursor-not-allowed'
            )}
          />
          {!canUseProfileLink && (
            <Link
              href="/settings/subscription"
              className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block"
            >
              Upgrade to add a profile link
            </Link>
          )}
        </div>

        {/* Private Account */}
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-gray-300" />
            <div>
              <p className="font-medium text-white">Private Account</p>
              <p className="text-sm text-gray-300">
                Only approved followers can see your posts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={clsx(
              'relative w-12 h-6 rounded-full transition-colors',
              isPrivate ? 'bg-emerald-500' : 'bg-gray-600'
            )}
          >
            <span
              className={clsx(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                isPrivate ? 'right-1' : 'left-1'
              )}
            />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400">
            Profile updated! Redirecting...
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
}
