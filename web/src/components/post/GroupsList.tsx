'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import { CreateGroupInline } from './CreateGroupInline';

interface Group {
  id: string;
  name: string;
  member_count: number;
}

interface GroupsListProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function GroupsList({ selectedIds, onSelectionChange }: GroupsListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (!res.ok) throw new Error('Failed to fetch groups');

      const data = await res.json();
      setGroups(data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleGroup = (groupId: string) => {
    if (selectedIds.includes(groupId)) {
      onSelectionChange(selectedIds.filter((id) => id !== groupId));
    } else {
      onSelectionChange([...selectedIds, groupId]);
    }
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups((prev) => [newGroup, ...prev]);
    setShowCreateGroup(false);
    // Auto-select the newly created group
    onSelectionChange([...selectedIds, newGroup.id]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Create group button */}
      {!showCreateGroup && (
        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="flex items-center gap-2 px-4 py-3 mb-4 bg-zinc-800 border border-dashed border-zinc-600 rounded-lg text-zinc-400 hover:text-white hover:border-emerald-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create new group</span>
        </button>
      )}

      {/* Inline group creation */}
      {showCreateGroup && (
        <CreateGroupInline
          onCreated={handleGroupCreated}
          onCancel={() => setShowCreateGroup(false)}
        />
      )}

      {/* Groups list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You haven&apos;t created any groups yet</p>
            <p className="text-sm mt-1">Groups let you share with specific followers</p>
          </div>
        ) : (
          groups.map((group) => {
            const isSelected = selectedIds.includes(group.id);

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-colors
                  ${isSelected
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'hover:bg-zinc-800 border border-transparent'
                  }
                `}
              >
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-zinc-600'
                  }
                `}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-zinc-400" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium text-white truncate">{group.name}</div>
                  <div className="text-sm text-zinc-500">
                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selection count */}
      {selectedIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700 text-sm text-zinc-400">
          {selectedIds.length} group{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
