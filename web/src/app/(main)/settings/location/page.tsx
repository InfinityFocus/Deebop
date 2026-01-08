'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Search, Loader2, X, Check } from 'lucide-react';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import type { City } from '@/types/explore';

export default function LocationSettingsPage() {
  const { userCity, setUserCity } = useExplorePreferencesStore();
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch popular cities
      const citiesRes = await fetch('/api/cities?limit=20');
      if (citiesRes.ok) {
        const data = await citiesRes.json();
        setPopularCities(data.cities);
      }

      // Fetch user's location
      const locationRes = await fetch('/api/user/location');
      if (locationRes.ok) {
        const data = await locationRes.json();
        if (data.location?.city) {
          setUserCity(data.location.city);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchCities = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setCities([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/cities?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        setCities(data.cities);
      }
    } catch (err) {
      console.error('Error searching cities:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCities(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchCities]);

  const handleSelectCity = async (city: City) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: city.id }),
      });

      if (res.ok) {
        setUserCity(city);
        setMessage({ type: 'success', text: `Location set to ${city.name}` });
        setQuery('');
      } else {
        setMessage({ type: 'error', text: 'Failed to update location' });
      }
    } catch (err) {
      console.error('Error updating location:', err);
      setMessage({ type: 'error', text: 'Failed to update location' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLocation = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: null }),
      });

      if (res.ok) {
        setUserCity(null);
        setMessage({ type: 'success', text: 'Location removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove location' });
      }
    } catch (err) {
      console.error('Error removing location:', err);
      setMessage({ type: 'error', text: 'Failed to remove location' });
    } finally {
      setSaving(false);
    }
  };

  const displayCities = query.trim() ? cities : popularCities;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Your Location</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Current location */}
        {userCity && (
          <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
            <p className="text-sm text-zinc-400 mb-2">Current Location</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium">{userCity.name}</p>
                  <p className="text-sm text-zinc-400">{userCity.countryName}</p>
                </div>
              </div>
              <button
                onClick={handleRemoveLocation}
                disabled={saving}
                className="p-2 rounded-full hover:bg-zinc-700 transition-colors"
                title="Remove location"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a city..."
            className="w-full pl-12 pr-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
          )}
        </div>

        {/* City list */}
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            {query.trim() ? 'Search Results' : 'Popular Cities'}
          </h3>

          {displayCities.length > 0 ? (
            <div className="space-y-1">
              {displayCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  disabled={saving}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-800 transition-colors text-left ${
                    userCity?.id === city.id
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : ''
                  }`}
                >
                  <MapPin
                    className={`w-5 h-5 flex-shrink-0 ${
                      userCity?.id === city.id
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{city.name}</p>
                    <p className="text-sm text-zinc-400">{city.countryName}</p>
                  </div>
                  {city.population && (
                    <span className="text-sm text-zinc-500">
                      {city.population >= 1000000
                        ? `${(city.population / 1000000).toFixed(1)}M`
                        : `${(city.population / 1000).toFixed(0)}K`}
                    </span>
                  )}
                  {userCity?.id === city.id && (
                    <Check className="w-5 h-5 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() && !searching ? (
            <div className="py-8 text-center text-zinc-500">
              <p>No cities found for "{query}"</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
