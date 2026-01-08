'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useCreateEvent } from '@/hooks/useEvents';
import type { CreateEventPayload, LocationMode, UploadWindow } from '@/types/event';
import type { Visibility } from '@/types/database';

export function CreateEventForm() {
  const router = useRouter();
  const { mutate: createEvent, isPending, error } = useCreateEvent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    rsvpDeadline: '',
    locationName: '',
    locationMode: 'exact' as LocationMode,
    visibility: 'unlisted' as Visibility,
    showAttendeeList: true,
    allowMaybeUploads: false,
    uploadWindow: 'during_and_after' as UploadWindow,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('mediaType', 'image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await res.json();
      setFormData(prev => ({ ...prev, coverImageUrl: url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time
    const startAt = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
    const endAt = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
    const rsvpDeadlineAt = formData.rsvpDeadline
      ? new Date(formData.rsvpDeadline).toISOString()
      : undefined;

    const payload: CreateEventPayload = {
      title: formData.title,
      description: formData.description || undefined,
      coverImageUrl: formData.coverImageUrl || undefined,
      startAt,
      endAt,
      rsvpDeadlineAt,
      locationName: formData.locationName || undefined,
      locationMode: formData.locationMode,
      visibility: formData.visibility,
      showAttendeeList: formData.showAttendeeList,
      allowMaybeUploads: formData.allowMaybeUploads,
      uploadWindow: formData.uploadWindow,
    };

    createEvent(payload, {
      onSuccess: (data) => {
        router.push(`/events/${data.event.id}`);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || uploadError) && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error?.message || uploadError}
        </div>
      )}

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <ImageIcon className="w-4 h-4 inline mr-2" />
          Cover Image
        </label>
        <div className="relative">
          {formData.coverImageUrl ? (
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={formData.coverImageUrl}
                alt="Cover"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[16/9] border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                  <span className="text-sm text-gray-400">Click to upload cover image</span>
                </>
              )}
            </label>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
          Event Title *
        </label>
        <input
          id="title"
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Give your event a name"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Tell guests what to expect"
          rows={4}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Start *
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            End *
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Location
        </label>
        <input
          id="location"
          type="text"
          value={formData.locationName}
          onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
          placeholder="Add a location"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <div className="mt-2 flex gap-4">
          {(['exact', 'area_only', 'hidden'] as LocationMode[]).map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="radio"
                name="locationMode"
                value={mode}
                checked={formData.locationMode === mode}
                onChange={(e) => setFormData({ ...formData, locationMode: e.target.value as LocationMode })}
                className="text-emerald-500"
              />
              {mode === 'exact' && 'Show exact address'}
              {mode === 'area_only' && 'Show area only'}
              {mode === 'hidden' && 'Hide location'}
            </label>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="font-medium text-white">Event Settings</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showAttendeeList}
            onChange={(e) => setFormData({ ...formData, showAttendeeList: e.target.checked })}
            className="w-5 h-5 rounded text-emerald-500 bg-gray-700 border-gray-600"
          />
          <span className="text-gray-300">Show attendee list to guests</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.allowMaybeUploads}
            onChange={(e) => setFormData({ ...formData, allowMaybeUploads: e.target.checked })}
            className="w-5 h-5 rounded text-emerald-500 bg-gray-700 border-gray-600"
          />
          <span className="text-gray-300">Allow &quot;Maybe&quot; guests to upload to gallery</span>
        </label>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Gallery Upload Window</label>
          <select
            value={formData.uploadWindow}
            onChange={(e) => setFormData({ ...formData, uploadWindow: e.target.value as UploadWindow })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="during_and_after">During and after event</option>
            <option value="after_only">After event only</option>
          </select>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Event...
          </>
        ) : (
          'Create Event'
        )}
      </button>
    </form>
  );
}
