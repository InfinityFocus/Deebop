'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { ContentType, HeadlineStyle, Visibility } from '@/types/database';
import { VisibilitySelector } from './VisibilitySelector';
import { AudiencePickerModal } from './AudiencePickerModal';

interface EditPostModalProps {
  post: {
    id: string;
    content_type: ContentType;
    headline: string | null;
    headline_style: HeadlineStyle;
    text_content: string | null;
    visibility: Visibility;
  };
  onClose: () => void;
  onSave: (updatedPost: {
    headline: string | null;
    headline_style: HeadlineStyle;
    text_content: string | null;
    visibility: Visibility;
  }) => void;
}

export function EditPostModal({ post, onClose, onSave }: EditPostModalProps) {
  const [headline, setHeadline] = useState(post.headline || '');
  const [headlineStyle, setHeadlineStyle] = useState<HeadlineStyle>(post.headline_style || 'normal');
  const [description, setDescription] = useState(post.text_content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(post.visibility || 'public');
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [audienceUserIds, setAudienceUserIds] = useState<string[]>([]);
  const [audienceGroupIds, setAudienceGroupIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isShout = post.content_type === 'shout';
  const headlineCharCount = headline.length;
  const isHeadlineTooLong = headlineCharCount > 80;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isShout && headline && isHeadlineTooLong) {
      setError('Headline must be 80 characters or less');
      return;
    }

    // Check for URLs in headline
    if (!isShout && headline) {
      const urlPattern = /https?:\/\/|www\./i;
      if (urlPattern.test(headline)) {
        setError('Headlines cannot contain URLs');
        return;
      }
    }

    if (visibility === 'private' && audienceUserIds.length === 0 && audienceGroupIds.length === 0) {
      setError('Please select at least one follower or group for private posts');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: isShout ? null : (headline.trim() || null),
          headline_style: headlineStyle,
          description: description.trim() || null,
          visibility,
          audience_user_ids: visibility === 'private' ? audienceUserIds : [],
          audience_group_ids: visibility === 'private' ? audienceGroupIds : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update post');
      }

      onSave({
        headline: data.post.headline,
        headline_style: data.post.headline_style,
        text_content: data.post.text_content,
        visibility: data.post.visibility,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Edit Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
            aria-label="Close"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Visibility</label>
            <VisibilitySelector
              value={visibility}
              onChange={setVisibility}
              onPrivateSelect={() => setShowAudiencePicker(true)}
            />
            {visibility === 'private' && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowAudiencePicker(true)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  {audienceUserIds.length + audienceGroupIds.length > 0
                    ? `${audienceUserIds.length} follower${audienceUserIds.length !== 1 ? 's' : ''}${audienceGroupIds.length > 0 ? ` + ${audienceGroupIds.length} group${audienceGroupIds.length !== 1 ? 's' : ''}` : ''} selected - Edit`
                    : 'Select audience'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Headline (not for shouts) */}
          {!isShout && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Headline
                <span className="text-gray-500 font-normal ml-1">(optional, max 80 chars)</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Add a headline..."
                className={clsx(
                  'w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition',
                  isHeadlineTooLong ? 'border-red-500' : 'border-gray-700'
                )}
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                <span className={clsx(
                  'text-xs',
                  isHeadlineTooLong ? 'text-red-400' : 'text-gray-500'
                )}>
                  {headlineCharCount}/80
                </span>
              </div>

              {/* Headline Style Toggle */}
              {headline.trim() && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Headline Style
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHeadlineStyle('normal')}
                      className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium transition',
                        headlineStyle === 'normal'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      )}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeadlineStyle('news')}
                      className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium transition',
                        headlineStyle === 'news'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      )}
                    >
                      News
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description / Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {isShout ? 'Content' : 'Description'}
              {!isShout && <span className="text-gray-500 font-normal ml-1">(optional)</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isShout ? "What's on your mind?" : 'Add a description...'}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hashtags (#) and links are allowed
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isShout && !description.trim())}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
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
      </div>

      {/* Audience Picker Modal */}
      <AudiencePickerModal
        isOpen={showAudiencePicker}
        selectedUserIds={audienceUserIds}
        selectedGroupIds={audienceGroupIds}
        onSelectionChange={(userIds, groupIds) => {
          setAudienceUserIds(userIds);
          setAudienceGroupIds(groupIds);
        }}
        onClose={() => setShowAudiencePicker(false)}
      />
    </div>
  );
}
