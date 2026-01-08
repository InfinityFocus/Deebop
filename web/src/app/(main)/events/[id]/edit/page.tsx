'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, MapPin, Clock, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useEvent, useUpdateEvent } from '@/hooks/useEvent';
import type { LocationMode, UploadWindow, UpdateEventPayload } from '@/types/event';
import { format } from 'date-fns';

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useEvent(id);
  const { mutate: updateEvent, isPending: isUpdating, error: updateError } = useUpdateEvent(id);

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
    showAttendeeList: true,
    allowMaybeUploads: false,
    uploadWindow: 'during_and_after' as UploadWindow,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Populate form when event data loads
  useEffect(() => {
    if (data?.event) {
      const event = data.event;
      const startDate = new Date(event.startAt);
      const endDate = new Date(event.endAt);

      setFormData({
        title: event.title,
        description: event.description || '',
        coverImageUrl: event.coverImageUrl || '',
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        endTime: format(endDate, 'HH:mm'),
        rsvpDeadline: event.rsvpDeadlineAt ? format(new Date(event.rsvpDeadlineAt), "yyyy-MM-dd'T'HH:mm") : '',
        locationName: event.locationName || '',
        locationMode: event.locationMode as LocationMode,
        showAttendeeList: event.showAttendeeList,
        allowMaybeUploads: event.allowMaybeUploads,
        uploadWindow: event.uploadWindow as UploadWindow,
      });
    }
  }, [data]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', 'image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
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

    const startAt = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
    const endAt = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
    const rsvpDeadlineAt = formData.rsvpDeadline
      ? new Date(formData.rsvpDeadline).toISOString()
      : null;

    const payload: UpdateEventPayload = {
      title: formData.title,
      description: formData.description || null,
      coverImageUrl: formData.coverImageUrl || null,
      startAt,
      endAt,
      rsvpDeadlineAt,
      locationName: formData.locationName || null,
      locationMode: formData.locationMode,
      showAttendeeList: formData.showAttendeeList,
      allowMaybeUploads: formData.allowMaybeUploads,
      uploadWindow: formData.uploadWindow,
    };

    updateEvent(payload, {
      onSuccess: () => {
        router.push(`/events/${id}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error?.message || 'Event not found'}</p>
          <Link href="/events" className="text-emerald-400 hover:underline">
            Go back to events
          </Link>
        </div>
      </div>
    );
  }

  if (!data.event.isHost) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">You don&apos;t have permission to edit this event</p>
          <Link href={`/events/${id}`} className="text-emerald-400 hover:underline">
            Go back to event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/events/${id}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-white">Edit Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(updateError || uploadError) && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {updateError?.message || uploadError}
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
          <div className="flex gap-4">
            <Link
              href={`/events/${id}`}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isUpdating || uploading}
              className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
