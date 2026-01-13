'use client';

import { useState, useEffect, useRef } from 'react';
import { UserPlus } from 'lucide-react';
import { TagIndicator } from './TagIndicator';
import { UserTagSearch } from './UserTagSearch';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from 'clsx';

interface TaggedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Tag {
  id: string;
  postId: string;
  mediaId: string | null;
  positionX: number;
  positionY: number;
  status: string;
  taggedUser: TaggedUser;
  tagger: {
    id: string;
    username: string;
  };
}

interface TaggingOverlayProps {
  postId: string;
  mediaId?: string | null;
  contentType: 'image' | 'video' | 'panorama360';
  isOwner: boolean;
  children: React.ReactNode;
  className?: string;
}

export function TaggingOverlay({
  postId,
  mediaId,
  contentType,
  isOwner,
  children,
  className,
}: TaggingOverlayProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [isTagMode, setIsTagMode] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tags for this post/media
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/tags`);
        if (res.ok) {
          const data = await res.json();
          // Filter tags for this specific media (or all if no mediaId)
          const filteredTags = mediaId
            ? data.tags.filter((t: Tag) => t.mediaId === mediaId)
            : data.tags;
          setTags(filteredTags);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };

    fetchTags();
  }, [postId, mediaId]);

  // Handle click on media to add tag
  const handleMediaClick = (e: React.MouseEvent) => {
    if (!isTagMode || !user) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position as percentage
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPosition({ x, y });
    setShowSearch(true);
  };

  // Handle user selection from search
  const handleSelectUser = async (selectedUser: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }) => {
    if (!clickPosition) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taggedUserId: selectedUser.id,
          mediaId: mediaId || null,
          positionX: clickPosition.x,
          positionY: clickPosition.y,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTags((prev) => [
          ...prev,
          {
            ...data.tag,
            taggedUser: {
              id: selectedUser.id,
              username: selectedUser.username,
              displayName: selectedUser.display_name,
              avatarUrl: selectedUser.avatar_url,
            },
            tagger: {
              id: user!.id,
              username: user!.username,
            },
          },
        ]);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add tag');
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
      alert('Failed to add tag');
    } finally {
      setIsLoading(false);
      setClickPosition(null);
      setIsTagMode(false);
    }
  };

  // Handle tag removal
  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== tagId));
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  // Get already tagged user IDs to exclude from search
  const excludeUserIds = tags.map((t) => t.taggedUser.id);

  const hasApprovedTags = tags.some((t) => t.status === 'approved');

  return (
    <div
      ref={containerRef}
      className={clsx('relative group', className)}
      onMouseEnter={() => setShowTags(true)}
      onMouseLeave={() => {
        if (!isTagMode) setShowTags(false);
      }}
    >
      {/* Media content */}
      <div
        onClick={handleMediaClick}
        className={clsx(
          isTagMode && 'cursor-crosshair',
          isTagMode && 'ring-2 ring-purple-500 ring-inset'
        )}
      >
        {children}
      </div>

      {/* Tag indicators */}
      {(showTags || isTagMode) &&
        tags.map((tag) => (
          <TagIndicator
            key={tag.id}
            tag={tag}
            isOwner={isOwner || tag.tagger.id === user?.id}
            onRemove={handleRemoveTag}
            showAlways={isTagMode}
          />
        ))}

      {/* Tag mode indicator */}
      {isTagMode && (
        <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
          Click to tag someone
        </div>
      )}

      {/* Controls overlay - only show if user is logged in and can tag */}
      {user && (showTags || isTagMode) && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {/* Show tags count if there are approved tags */}
          {hasApprovedTags && !isTagMode && (
            <button
              onClick={() => setShowTags(!showTags)}
              className="bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition"
            >
              <UserPlus size={14} />
              {tags.filter((t) => t.status === 'approved').length}
            </button>
          )}

          {/* Add tag button - only for post owner or if allowed */}
          {isOwner && (
            <button
              onClick={() => setIsTagMode(!isTagMode)}
              className={clsx(
                'text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition',
                isTagMode
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-black/60 hover:bg-black/80'
              )}
            >
              <UserPlus size={14} />
              {isTagMode ? 'Done' : 'Tag'}
            </button>
          )}
        </div>
      )}

      {/* User search modal */}
      <UserTagSearch
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          setClickPosition(null);
        }}
        onSelectUser={handleSelectUser}
        position={clickPosition || { x: 0, y: 0 }}
        excludeUserIds={excludeUserIds}
      />
    </div>
  );
}
