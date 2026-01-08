'use client';

import { useState, useEffect } from 'react';
import { X, Users, User } from 'lucide-react';
import { FollowersList } from './FollowersList';
import { GroupsList } from './GroupsList';

type Tab = 'followers' | 'groups';

interface AudiencePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  selectedGroupIds: string[];
  onSelectionChange: (userIds: string[], groupIds: string[]) => void;
}

export function AudiencePickerModal({
  isOpen,
  onClose,
  selectedUserIds,
  selectedGroupIds,
  onSelectionChange,
}: AudiencePickerModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('followers');
  const [tempUserIds, setTempUserIds] = useState<string[]>(selectedUserIds);
  const [tempGroupIds, setTempGroupIds] = useState<string[]>(selectedGroupIds);

  // Sync temp state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempUserIds(selectedUserIds);
      setTempGroupIds(selectedGroupIds);
    }
  }, [isOpen, selectedUserIds, selectedGroupIds]);

  const handleSave = () => {
    onSelectionChange(tempUserIds, tempGroupIds);
    onClose();
  };

  const totalSelected = tempUserIds.length + tempGroupIds.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white">Select audience</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700">
          <button
            onClick={() => setActiveTab('followers')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'followers'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-zinc-500 hover:text-white'
              }
            `}
          >
            <User className="w-4 h-4" />
            Followers
            {tempUserIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                {tempUserIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'groups'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-zinc-500 hover:text-white'
              }
            `}
          >
            <Users className="w-4 h-4" />
            Groups
            {tempGroupIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                {tempGroupIds.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden min-h-0">
          {activeTab === 'followers' ? (
            <FollowersList
              selectedIds={tempUserIds}
              onSelectionChange={setTempUserIds}
            />
          ) : (
            <GroupsList
              selectedIds={tempGroupIds}
              onSelectionChange={setTempGroupIds}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              {totalSelected === 0 ? (
                'Select at least one follower or group'
              ) : (
                <>
                  {tempUserIds.length > 0 && (
                    <span>{tempUserIds.length} follower{tempUserIds.length !== 1 ? 's' : ''}</span>
                  )}
                  {tempUserIds.length > 0 && tempGroupIds.length > 0 && <span> + </span>}
                  {tempGroupIds.length > 0 && (
                    <span>{tempGroupIds.length} group{tempGroupIds.length !== 1 ? 's' : ''}</span>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={totalSelected === 0}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
