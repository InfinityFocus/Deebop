'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, X, Loader2, UserPlus, UserMinus, Search } from 'lucide-react';
import Image from 'next/image';

interface GroupMember {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  added_at: string;
}

interface Group {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
}

interface Follower {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function GroupManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

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

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error('Failed to fetch group details');
      const data = await res.json();
      setSelectedGroup(data.group);
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete group');

      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: [memberId] }),
      });

      if (!res.ok) throw new Error('Failed to remove member');

      // Refresh group details
      await fetchGroupDetails(selectedGroup.id);
      await fetchGroups();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Audience Groups</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Create groups to easily share private posts with specific followers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <Users className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-medium text-white mb-2">No groups yet</h3>
          <p className="text-zinc-500 mb-4">
            Create your first group to share content with specific followers
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            Create a Group
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Groups List */}
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => fetchGroupDetails(group.id)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border transition text-left
                  ${selectedGroup?.id === group.id
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }
                `}
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{group.name}</div>
                  <div className="text-sm text-zinc-500">
                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(group.id);
                  }}
                  className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </button>
            ))}
          </div>

          {/* Selected Group Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            {selectedGroup ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-white">{selectedGroup.name}</h3>
                  <button
                    onClick={() => setShowAddMembersModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Members
                  </button>
                </div>

                {selectedGroup.members && selectedGroup.members.length > 0 ? (
                  <div className="space-y-2">
                    {selectedGroup.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg"
                      >
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.username}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 font-medium">
                            {(member.display_name || member.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {member.display_name || member.username}
                          </div>
                          <div className="text-sm text-zinc-500 truncate">@{member.username}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-700 transition"
                          title="Remove from group"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No members in this group</p>
                    <button
                      onClick={() => setShowAddMembersModal(true)}
                      className="mt-2 text-emerald-400 hover:text-emerald-300"
                    >
                      Add followers →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a group to view members</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newGroup) => {
            setGroups((prev) => [newGroup, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && selectedGroup && (
        <AddMembersModal
          groupId={selectedGroup.id}
          existingMemberIds={selectedGroup.members?.map((m) => m.id) || []}
          onClose={() => setShowAddMembersModal(false)}
          onMembersAdded={() => {
            fetchGroupDetails(selectedGroup.id);
            fetchGroups();
            setShowAddMembersModal(false);
          }}
        />
      )}
    </div>
  );
}

// Create Group Modal Component
function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (group: Group) => void;
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white">Create New Group</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Close Friends, Family"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Members Modal Component
function AddMembersModal({
  groupId,
  existingMemberIds,
  onClose,
  onMembersAdded,
}: {
  groupId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onMembersAdded: () => void;
}) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('limit', '50');

        const res = await fetch(`/api/users/me/followers?${params}`);
        if (!res.ok) throw new Error('Failed to fetch followers');

        const data = await res.json();
        // Filter out existing members
        setFollowers(data.followers.filter((f: Follower) => !existingMemberIds.includes(f.id)));
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchFollowers, 300);
    return () => clearTimeout(debounce);
  }, [search, existingMemberIds]);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: selectedIds }),
      });

      if (!res.ok) throw new Error('Failed to add members');

      onMembersAdded();
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFollower = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white">Add Members</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search followers..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              {search ? 'No followers found' : 'All your followers are already in this group'}
            </div>
          ) : (
            <div className="space-y-2">
              {followers.map((follower) => {
                const isSelected = selectedIds.includes(follower.id);

                return (
                  <button
                    key={follower.id}
                    type="button"
                    onClick={() => toggleFollower(follower.id)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition
                      ${isSelected
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                      }
                    `}
                  >
                    <div
                      className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}
                    `}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {follower.avatar_url ? (
                      <Image
                        src={follower.avatar_url}
                        alt={follower.username}
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm font-medium">
                        {(follower.display_name || follower.username).charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium text-white truncate">
                        {follower.display_name || follower.username}
                      </div>
                      <div className="text-sm text-zinc-500 truncate">@{follower.username}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-700 bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              {selectedIds.length} selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedIds.length === 0 || submitting}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Members'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
