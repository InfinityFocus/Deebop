'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreateEventForm } from '@/components/events';

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/events"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-white">Create Event</h1>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-xl p-6">
          <CreateEventForm />
        </div>
      </div>
    </div>
  );
}
