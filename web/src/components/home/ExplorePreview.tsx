'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Shield, MessageCircle, Podcast } from 'lucide-react';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

// Small video component that autoplays when in view
function AutoplayVideo({ src, poster, className }: { src: string; poster?: string | null; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster || undefined}
      muted
      loop
      playsInline
      className={className}
    />
  );
}

interface PublicPost {
  id: string;
  headline: string | null;
  text_content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  content_type: string;
  provenance: string | null;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  // Multi-image carousel support
  media?: Array<{
    media_url: string;
    thumbnail_url?: string | null;
  }>;
}

const interestChips = [
  'For you',
  'Photography',
  'Art',
  'Music',
  'Gaming',
  'Travel',
];

export default function ExplorePreview() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackCta, trackExploreEntry } = useHomepageAnalytics();

  const handleExploreClick = () => {
    trackCta('explore');
    trackExploreEntry();
  };

  useEffect(() => {
    async function fetchPublicPosts() {
      try {
        const res = await fetch('/api/posts?visibility=public&limit=6');
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Failed to fetch public posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicPosts();
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Explore Content
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-8">
          Browse trending posts, discover creators, and find content that matches your interests.
        </p>

        {/* Filter bar preview */}
        <div className="flex flex-wrap items-center gap-3 mb-6 justify-center">
          {/* Interest chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {interestChips.map((chip, index) => (
              <span
                key={chip}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  index === 0
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {index === 0 && <Sparkles size={14} className="inline mr-1" />}
                {chip}
              </span>
            ))}
          </div>

          {/* Filter button */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700">
            <Shield size={14} />
            Filters
          </button>
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.slice(0, 6).map((post) => {
              const username = post.author?.username || 'unknown';
              const displayName = post.author?.display_name || username;
              const avatarUrl = post.author?.avatar_url;

              // Determine what image to show (including multi-image carousel support)
              const firstMedia = post.media?.[0];
              const thumbnailUrl = post.content_type === 'video'
                ? post.media_thumbnail_url
                : (post.media_url || firstMedia?.media_url || firstMedia?.thumbnail_url);
              const isVideo = post.content_type === 'video';
              const isShout = post.content_type === 'shout';
              const isAudio = post.content_type === 'audio';
              const hasMultipleImages = (post.media?.length || 0) > 1;

              return (
                <Link
                  key={post.id}
                  href={post.author ? `/u/${username}?post=${post.id}` : '#'}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800"
                >
                  {isVideo && post.media_url ? (
                    <AutoplayVideo
                      src={post.media_url}
                      poster={post.media_thumbnail_url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : thumbnailUrl && !isAudio ? (
                    <img
                      src={thumbnailUrl}
                      alt={post.headline || 'Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : isAudio ? (
                    // Styled audio card
                    <div className="w-full h-full bg-gradient-to-br from-rose-900/80 via-gray-900 to-purple-900/80 flex flex-col items-center justify-center p-4 relative">
                      {/* Decorative waveform bars */}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-white rounded-full"
                            style={{ height: `${20 + Math.sin(i * 0.8) * 30 + Math.random() * 20}%` }}
                          />
                        ))}
                      </div>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center mb-3 shadow-lg z-10">
                        <Podcast size={28} className="text-white" />
                      </div>
                      <p className="text-white text-sm font-medium text-center line-clamp-2 z-10">
                        {post.headline || post.text_content || 'Audio'}
                      </p>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {displayName[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-gray-400 text-xs">@{username}</span>
                      </div>
                    </div>
                  ) : isShout ? (
                    // Styled shout card
                    <div className="w-full h-full bg-gradient-to-br from-emerald-900/80 via-gray-900 to-cyan-900/80 flex flex-col items-center justify-center p-4 relative">
                      <MessageCircle size={24} className="text-emerald-400/50 absolute top-3 right-3" />
                      <p className="text-white text-sm font-medium text-center line-clamp-5 leading-relaxed">
                        &ldquo;{post.text_content || post.headline}&rdquo;
                      </p>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {displayName[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-gray-400 text-xs">@{username}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-800">
                      <p className="text-gray-300 text-sm line-clamp-4">
                        {post.text_content || post.headline}
                      </p>
                    </div>
                  )}

                  {/* Overlay on hover - only for media posts */}
                  {!isShout && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="flex items-center gap-2">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                            {displayName[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium">@{username}</span>
                      </div>
                    </div>
                  )}

                  {/* Provenance badge */}
                  {post.provenance && post.provenance !== 'original' && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-gray-300">
                      {post.provenance.replace('_', ' ')}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Content coming soon. Be the first to post!</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/browse"
            onClick={handleExploreClick}
            className="inline-flex items-center gap-2 rounded-full border border-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            View more in Explore
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
