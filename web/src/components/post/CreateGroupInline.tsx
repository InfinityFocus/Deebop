'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  member_count: number;
}

interface CreateGroupInlineProps {
  onCreated: (group: Group) => void;
  onCancel: () => void;
}

export function CreateGroupInline({ onCreated, onCancel }: CreateGroupInlineProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create group');
        return;
      }

      onCreated(data.group);
    } catch (err) {
      console.error('Create group error:', err);
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-white">Create new group</h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-zinc-500 hover:text-white rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        placeholder="Group name (e.g., Close Friends)"
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        autoFocus
      />

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      <p className="mt-2 text-xs text-zinc-500">
        You can add members to this group later from your profile settings
      </p>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create'
          )}
        </button>
      </div>
    </form>
  );
}
