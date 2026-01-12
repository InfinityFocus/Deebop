'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Edit2, Trash2, Eye, EyeOff, Image, Video, Mic, MessageSquare, Compass, Images, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

interface Drop {
  id: string;
  type: 'post' | 'album';
  content_type: string;
  title: string | null;
  headline_style?: string;
  description: string | null;
  preview_url: string | null;
  hide_teaser: boolean;
  visibility: string;
  scheduled_for: string;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tier?: string;
  };
}

const CONTENT_TYPE_ICONS: Record<string, typeof Image> = {
  image: Image,
  video: Video,
  audio: Mic,
  shout: MessageSquare,
  panorama360: Compass,
  album: Images,
};

function EditDropModal({ drop, onClose, onSave }: { drop: Drop; onClose: () => void; onSave: () => void }) {
  const [scheduledFor, setScheduledFor] = useState('');
  const [hideTeaser, setHideTeaser] = useState(drop.hide_teaser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Convert to local datetime-local format
    const date = new Date(drop.scheduled_for);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduledFor(localDateTime);
  }, [drop.scheduled_for]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/drops/${drop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: drop.type,
          scheduledFor: new Date(scheduledFor).toISOString(),
          hideTeaser,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update drop');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update drop');
    } finally {
      setSaving(false);
    }
  };

  // Calculate minimum datetime (5 minutes from now)
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000);
  const minDateTimeStr = new Date(minDateTime.getTime() - minDateTime.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Edit Scheduled Drop</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Drop Time</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={minDateTimeStr}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hideTeaser}
              onChange={(e) => setHideTeaser(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-medium">Hide teaser preview</span>
              <p className="text-xs text-gray-500">Don't show preview until drop time</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function DropCard({ drop, onEdit, onDelete }: { drop: Drop; onEdit: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ContentIcon = CONTENT_TYPE_ICONS[drop.content_type] || Image;

  const scheduledDate = new Date(drop.scheduled_for);
  const timeUntilDrop = formatDistanceToNow(scheduledDate, { addSuffix: true });
  const isPast = scheduledDate < new Date();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/drops/${drop.id}?type=${drop.type}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to cancel drop');
      }
      onDelete();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to cancel drop');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      {/* Preview Image or Placeholder */}
      <div className="relative aspect-video bg-gray-800 flex items-center justify-center">
        {drop.preview_url && !drop.hide_teaser ? (
          <img
            src={drop.preview_url}
            alt={drop.title || 'Drop preview'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            {drop.hide_teaser ? (
              <>
                <EyeOff size={32} />
                <span className="text-xs">Preview hidden</span>
              </>
            ) : (
              <ContentIcon size={32} />
            )}
          </div>
        )}

        {/* Content type badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-full text-xs flex items-center gap-1">
          <ContentIcon size={12} />
          {drop.type === 'album' ? 'Album' : drop.content_type}
        </div>

        {/* Visibility badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-full text-xs">
          {drop.visibility}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {drop.title && (
          <h4 className={clsx(
            'font-semibold mb-1 truncate',
            drop.headline_style === 'news' ? 'text-red-400' : 'text-white'
          )}>
            {drop.title}
          </h4>
        )}
        {drop.description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">{drop.description}</p>
        )}

        {/* Scheduled time */}
        <div className={clsx(
          'flex items-center gap-2 text-sm mb-4',
          isPast ? 'text-red-400' : 'text-emerald-400'
        )}>
          <Clock size={14} />
          <span>
            {isPast ? 'Overdue - processing' : `Drops ${timeUntilDrop}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Calendar size={12} />
          {format(scheduledDate, 'PPp')}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 py-2 px-3 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="py-2 px-3 bg-red-500/10 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Cancel Drop?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will permanently delete your scheduled {drop.type}. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Keep It
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : null}
                Cancel Drop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MyScheduledDrops() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);

  const fetchDrops = async () => {
    try {
      const response = await fetch('/api/drops/my');
      if (!response.ok) {
        throw new Error('Failed to fetch drops');
      }
      const data = await response.json();
      setDrops(data.drops || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDrops}
          className="text-emerald-400 hover:text-emerald-300"
        >
          Try again
        </button>
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">No Scheduled Drops</h3>
        <p className="text-gray-500 text-sm">
          Schedule a post or album to drop at a specific time
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {drops.length} scheduled {drops.length === 1 ? 'drop' : 'drops'}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {drops.map((drop) => (
          <DropCard
            key={`${drop.type}-${drop.id}`}
            drop={drop}
            onEdit={() => setEditingDrop(drop)}
            onDelete={fetchDrops}
          />
        ))}
      </div>

      {editingDrop && (
        <EditDropModal
          drop={editingDrop}
          onClose={() => setEditingDrop(null)}
          onSave={fetchDrops}
        />
      )}
    </div>
  );
}
