'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Settings, Loader2 } from 'lucide-react';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import {
  TrendingPostCard,
  TrendingEventCard,
  TrendingCreatorCard,
  CitySelector,
} from '@/components/explore';
import type { City, PostResult, EventResult, CreatorResult, NearYouTab } from '@/types/explore';

const TABS: { id: NearYouTab; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'events', label: 'Events' },
  { id: 'creators', label: 'Creators' },
];

interface NearData {
  posts: PostResult[];
  events: EventResult[];
  creators: CreatorResult[];
}

export default function NearYouPage() {
  const { userCity, setUserCity } = useExplorePreferencesStore();
  const [activeTab, setActiveTab] = useState<NearYouTab>('posts');
  const [data, setData] = useState<NearData>({ posts: [], events: [], creators: [] });
  const [loading, setLoading] = useState(true);
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  useEffect(() => {
    if (userCity) {
      fetchNearbyContent();
    } else {
      fetchUserLocation();
    }
  }, [userCity, activeTab]);

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
      const res = await fetch(
        `/api/explore/near?cityId=${userCity.id}&tab=${activeTab}&limit=30`
      );
      if (res.ok) {
        const responseData = await res.json();
        setData({
          posts: responseData.results?.posts || [],
          events: responseData.results?.events || [],
          creators: responseData.results?.creators || [],
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

  // No city set
  if (!userCity && !loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href="/explore"
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Creators Near You</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Set your location</h2>
          <p className="text-zinc-400 mb-6">
            Select your city to discover posts, events, and creators near you
          </p>
          <button
            onClick={() => setCitySelectorOpen(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium transition-colors"
          >
            Select City
          </button>
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

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/explore"
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h1 className="text-xl font-bold">Creators Near You</h1>
                {userCity && (
                  <span className="text-zinc-400">· {userCity.name}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setCitySelectorOpen(true)}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              title="Change city"
            >
              <Settings className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <>
            {/* Posts tab */}
            {activeTab === 'posts' && (
              <div>
                {data.posts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.posts.map((post) => (
                      <TrendingPostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-zinc-500">
                    <p>No posts near {userCity?.name} yet</p>
                    <p className="text-sm mt-1">Be the first to post!</p>
                  </div>
                )}
              </div>
            )}

            {/* Events tab */}
            {activeTab === 'events' && (
              <div>
                {data.events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.events.map((event) => (
                      <TrendingEventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-zinc-500">
                    <p>No events near {userCity?.name}</p>
                    <p className="text-sm mt-1">Create one to get started!</p>
                  </div>
                )}
              </div>
            )}

            {/* Creators tab */}
            {activeTab === 'creators' && (
              <div>
                {data.creators.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.creators.map((creator) => (
                      <TrendingCreatorCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-zinc-500">
                    <p>No creators near {userCity?.name} yet</p>
                    <p className="text-sm mt-1">Invite your friends!</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
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
