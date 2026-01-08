'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar } from 'lucide-react';
import { EventGrid } from '@/components/events';
import type { EventListType } from '@/types/event';

const tabs: { key: EventListType; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'hosted', label: 'Hosting' },
  { key: 'attending', label: 'Attending' },
  { key: 'past', label: 'Past' },
];

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<EventListType>('upcoming');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl font-bold text-white">Events</h1>
            </div>
            <Link
              href="/events/create"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Plan gatherings, invite friends, and share photos together with private event galleries.
          </p>

          {/* Tabs */}
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-2 px-1 font-medium whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <EventGrid
          type={activeTab}
          emptyMessage={
            activeTab === 'upcoming'
              ? "You don't have any upcoming events"
              : activeTab === 'hosted'
              ? "You haven't created any events yet"
              : activeTab === 'attending'
              ? "You're not attending any events"
              : 'No past events'
          }
        />
      </div>
    </div>
  );
}