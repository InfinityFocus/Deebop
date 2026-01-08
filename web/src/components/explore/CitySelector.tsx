'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import type { City } from '@/types/explore';

interface CitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  currentCity?: City | null;
}

export default function CitySelector({
  isOpen,
  onClose,
  onSelect,
  currentCity,
}: CitySelectorProps) {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularCities, setPopularCities] = useState<City[]>([]);

  // Fetch popular cities on mount
  useEffect(() => {
    if (isOpen) {
      fetchPopularCities();
    }
  }, [isOpen]);

  const fetchPopularCities = async () => {
    try {
      const res = await fetch('/api/cities?limit=10');
      if (res.ok) {
        const data = await res.json();
        setPopularCities(data.cities);
      }
    } catch (err) {
      console.error('Error fetching popular cities:', err);
    }
  };

  const searchCities = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setCities([]);
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCities(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchCities]);

  const handleSelect = (city: City) => {
    onSelect(city);
    onClose();
  };

  if (!isOpen) return null;

  const displayCities = query.trim() ? cities : popularCities;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[80vh] bg-zinc-900 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold">Select Your City</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Current city */}
        {currentCity && (
          <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
              Current Location
            </p>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">
                {currentCity.name}, {currentCity.countryName}
              </span>
            </div>
          </div>
        )}

        {/* City list */}
        <div className="flex-1 overflow-y-auto">
          {!query.trim() && (
            <p className="px-4 py-2 text-xs text-zinc-500 uppercase tracking-wide">
              Popular Cities
            </p>
          )}

          {displayCities.length > 0 ? (
            <div className="space-y-1 p-2">
              {displayCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelect(city)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors text-left ${
                    currentCity?.id === city.id
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : ''
                  }`}
                >
                  <MapPin
                    className={`w-5 h-5 ${
                      currentCity?.id === city.id
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{city.name}</p>
                    <p className="text-sm text-zinc-400">{city.countryName}</p>
                  </div>
                  {city.population && (
                    <span className="ml-auto text-xs text-zinc-500">
                      {city.population >= 1000000
                        ? `${(city.population / 1000000).toFixed(1)}M`
                        : `${(city.population / 1000).toFixed(0)}K`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() && !loading ? (
            <div className="p-8 text-center">
              <p className="text-zinc-500">No cities found</p>
              <p className="text-sm text-zinc-600 mt-1">
                Try a different search term
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
