'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Creator {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function FeaturedCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        // Fetch users with most posts (featured creators)
        const res = await fetch('/api/users/search?limit=8&sort=posts');
        if (res.ok) {
          const data = await res.json();
          setCreators(data.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch creators:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Beta badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            Beta
          </span>
          <span className="text-gray-400 text-sm">New platform, growing community</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Featured Creators
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-10">
          Join a community of photographers, artists, and creators sharing their best work.
        </p>

        {/* Creators row */}
        {loading ? (
          <div className="flex justify-center gap-4 flex-wrap">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse" />
                <div className="w-16 h-3 rounded bg-gray-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : creators.length > 0 ? (
          <div className="flex justify-center gap-6 flex-wrap">
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/u/${creator.username}`}
                className="flex flex-col items-center gap-2 group"
              >
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-emerald-500 transition-colors"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white border-2 border-transparent group-hover:border-emerald-400 transition-colors">
                    {(creator.displayName || creator.username)?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  @{creator.username}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-white" />
            </div>
            <p className="text-gray-400">Be among the first creators to join!</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition"
          >
            Join the community
            <Sparkles size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
