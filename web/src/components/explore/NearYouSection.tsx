'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Settings, Loader2 } from 'lucide-react';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import TrendingPostCard from './TrendingPostCard';
import TrendingEventCard from './TrendingEventCard';
import CitySelector from './CitySelector';
import type { City, PostResult, EventResult } from '@/types/explore';

interface NearYouData {
  posts: PostResult[];
  events: EventResult[];
}

export default function NearYouSection() {
  const { userCity, setUserCity } = useExplorePreferencesStore();
  const [data, setData] = useState<NearYouData>({ posts: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  useEffect(() => {
    if (userCity) {
      fetchNearbyContent();
    } else {
      // Try to fetch user's location from API
      fetchUserLocation();
    }
  }, [userCity]);

  const fetchUserLocation = async () => {
    try {
      const res = await fetch('/api/user/location');
      if (res.ok) {
        const data = await res.json();
        if (data.location?.city) {
          setUserCity(data.location.city);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error fetching user location:', err);
      setLoading(false);
    }
  };

  const fetchNearbyContent = async () => {
    if (!userCity) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/explore/near?cityId=${userCity.id}&tab=all`);
      if (res.ok) {
        const responseData = await res.json();
        setData({
          posts: responseData.results?.posts || [],
          events: responseData.results?.events || [],
        });
      }
    } catch (err) {
      console.error('Error fetching nearby content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (city: City) => {
    try {
      const res = await fetch('/api/user/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: city.id }),
      });

      if (res.ok) {
        setUserCity(city);
      }
    } catch (err) {
      console.error('Error setting location:', err);
    }
  };

  // No city set - show prompt
  if (!userCity && !loading) {
    return (
      <div className="p-6 bg-zinc-800/30 rounded-xl border border-zinc-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <MapPin className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Discover content near you</h3>
            <p className="text-zinc-400 mt-1">
              Set your city to see posts and events from creators nearby
            </p>
            <button
              onClick={() => setCitySelectorOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
            >
              Set Your City
            </button>
          </div>
        </div>

        <CitySelector
          isOpen={citySelectorOpen}
          onClose={() => setCitySelectorOpen(false)}
          onSelect={handleCitySelect}
          currentCity={userCity}
        />
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  const hasContent = data.posts.length > 0 || data.events.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Near You</h3>
          <span className="text-zinc-400">· {userCity?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCitySelectorOpen(true)}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            title="Change city"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
          </button>
          <Link
            href="/explore/near"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            See all →
          </Link>
        </div>
      </div>

      {hasContent ? (
        <div className="space-y-6">
          {/* Nearby posts */}
          {data.posts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-3">
                Recent Posts
              </h4>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {data.posts.slice(0, 6).map((post) => (
                  <TrendingPostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* Nearby events */}
          {data.events.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-3">
                Upcoming Events
              </h4>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {data.events.slice(0, 4).map((event) => (
                  <TrendingEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-zinc-500">
          <p>No content near {userCity?.name} yet</p>
          <p className="text-sm mt-1">Be the first to post something!</p>
        </div>
      )}

      <CitySelector
        isOpen={citySelectorOpen}
        onClose={() => setCitySelectorOpen(false)}
        onSelect={handleCitySelect}
        currentCity={userCity}
      />
    </div>
  );
}
