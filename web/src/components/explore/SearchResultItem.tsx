'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Hash, Users, Images, Calendar, MapPin, Heart } from 'lucide-react';
import type {
  HashtagResult,
  CreatorResult,
  AlbumResult,
  EventResult,
  ShoutResult,
} from '@/types/explore';

type SearchResultType = 'hashtag' | 'creator' | 'album' | 'event' | 'shout';

interface SearchResultItemProps {
  type: SearchResultType;
  data: HashtagResult | CreatorResult | AlbumResult | EventResult | ShoutResult;
}

export default function SearchResultItem({ type, data }: SearchResultItemProps) {
  switch (type) {
    case 'hashtag': {
      const hashtag = data as HashtagResult;
      return (
        <Link
          href={`/explore/hashtag/${hashtag.tag}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <Hash className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium">#{hashtag.tag}</p>
            <p className="text-sm text-zinc-400">
              {hashtag.postCount} {hashtag.postCount === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </Link>
      );
    }

    case 'creator': {
      const creator = data as CreatorResult;
      return (
        <Link
          href={`/u/${creator.username}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          {creator.avatar ? (
            <Image
              src={creator.avatar}
              alt={creator.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-medium">
              {creator.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {creator.displayName || creator.username}
            </p>
            <p className="text-sm text-zinc-400">@{creator.username}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <Users className="w-4 h-4" />
            {creator.followerCount >= 1000
              ? `${(creator.followerCount / 1000).toFixed(1)}K`
              : creator.followerCount}
          </div>
        </Link>
      );
    }

    case 'album': {
      const album = data as AlbumResult;
      return (
        <Link
          href={`/albums/${album.id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          {album.coverUrl ? (
            <Image
              src={album.coverUrl}
              alt={album.name}
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Images className="w-5 h-5 text-zinc-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{album.name}</p>
            <p className="text-sm text-zinc-400">
              by @{album.creator.username} · {album.itemCount} items
            </p>
          </div>
        </Link>
      );
    }

    case 'event': {
      const event = data as EventResult;
      const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      };

      return (
        <Link
          href={`/events/${event.id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          {event.coverUrl ? (
            <Image
              src={event.coverUrl}
              alt={event.title}
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-zinc-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{event.title}</p>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>{formatDate(event.startDate)}</span>
              {event.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <Users className="w-4 h-4" />
            {event.attendingCount}
          </div>
        </Link>
      );
    }

    case 'shout': {
      const shout = data as ShoutResult;
      return (
        <Link
          href={`/p/${shout.id}`}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          {shout.user.avatar ? (
            <Image
              src={shout.user.avatar}
              alt={shout.user.username}
              width={40}
              height={40}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-medium flex-shrink-0">
              {shout.user.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {shout.user.displayName || shout.user.username}
              </span>
              <span className="text-sm text-zinc-500">@{shout.user.username}</span>
            </div>
            <p className="text-zinc-300 mt-1 line-clamp-2">{shout.description}</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-zinc-500">
              <Heart className="w-4 h-4" />
              {shout.likeCount}
            </div>
          </div>
        </Link>
      );
    }
  }
}
