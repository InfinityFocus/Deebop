'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, X, MoreHorizontal, Play, StopCircle } from 'lucide-react';
import { Button } from '@/components/shared';
import { Avatar } from '@/components/child/AvatarSelector';
import { TimeoutModal } from './TimeoutModal';
import { useCountdown, formatCountdown } from '@/hooks/useCountdown';
import { TIMEOUT_REASONS, type TimeoutWithChild, type CreateTimeoutInput } from '@/types';

interface Props {
  childId: string;
  childName: string;
  childAvatarId: string;
}

export function ActiveTimeouts({ childId, childName, childAvatarId }: Props) {
  const [timeouts, setTimeouts] = useState<TimeoutWithChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchTimeouts = async () => {
    try {
      const response = await fetch('/api/parent/timeouts');
      const data = await response.json();

      if (data.success) {
        // Filter to only this child's timeouts
        setTimeouts(
          data.data.filter((t: TimeoutWithChild) => t.childId === childId)
        );
      }
    } catch (error) {
      console.error('Failed to fetch timeouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeouts();
    // Poll every 10 seconds to update status
    const interval = setInterval(fetchTimeouts, 10000);
    return () => clearInterval(interval);
  }, [childId]);

  const handleCreateTimeout = async (input: CreateTimeoutInput) => {
    const response = await fetch('/api/parent/timeouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create timeout');
    }

    await fetchTimeouts();
  };

  const handleEndTimeout = async (timeoutId: string) => {
    try {
      const response = await fetch(`/api/parent/timeouts/${timeoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTimeouts();
      }
    } catch (error) {
      console.error('Failed to end timeout:', error);
    }
    setActionMenuId(null);
  };

  const handleExtendTimeout = async (timeoutId: string, minutes: number) => {
    try {
      const response = await fetch(`/api/parent/timeouts/${timeoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend', extendMinutes: minutes }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTimeouts();
      }
    } catch (error) {
      console.error('Failed to extend timeout:', error);
    }
    setActionMenuId(null);
  };

  const handleCancelTimeout = async (timeoutId: string) => {
    try {
      const response = await fetch(`/api/parent/timeouts/${timeoutId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchTimeouts();
      }
    } catch (error) {
      console.error('Failed to cancel timeout:', error);
    }
    setActionMenuId(null);
  };

  if (isLoading) {
    return (
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
        <div className="text-gray-400 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Wrap-up Timer</h2>
          </div>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1"
          >
            <Plus size={16} />
            <span>Start Timer</span>
          </Button>
        </div>

        {timeouts.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No active timers. Use the Wrap-up Timer to pause {childName}&apos;s chat for a set duration.
          </p>
        ) : (
          <div className="space-y-3">
            {timeouts.map((timeout) => (
              <TimeoutCard
                key={timeout.id}
                timeout={timeout}
                childAvatarId={childAvatarId}
                showActionMenu={actionMenuId === timeout.id}
                onToggleActionMenu={() =>
                  setActionMenuId(actionMenuId === timeout.id ? null : timeout.id)
                }
                onEnd={() => handleEndTimeout(timeout.id)}
                onExtend={(mins) => handleExtendTimeout(timeout.id, mins)}
                onCancel={() => handleCancelTimeout(timeout.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TimeoutModal
          childId={childId}
          childName={childName}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateTimeout}
        />
      )}
    </>
  );
}

function TimeoutCard({
  timeout,
  childAvatarId,
  showActionMenu,
  onToggleActionMenu,
  onEnd,
  onExtend,
  onCancel,
}: {
  timeout: TimeoutWithChild;
  childAvatarId: string;
  showActionMenu: boolean;
  onToggleActionMenu: () => void;
  onEnd: () => void;
  onExtend: (mins: number) => void;
  onCancel: () => void;
}) {
  const countdown = useCountdown(timeout.endAt);
  const startCountdown = useCountdown(timeout.startAt);

  const isScheduled = timeout.status === 'scheduled' && !startCountdown.isExpired;
  const reasonData = timeout.reason
    ? TIMEOUT_REASONS.find((r) => r.value === timeout.reason)
    : null;

  return (
    <div className="bg-dark-700 rounded-lg p-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar avatarId={childAvatarId} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  isScheduled ? 'text-yellow-400' : 'text-orange-400'
                }`}
              >
                {isScheduled ? 'Starting in' : 'Ends in'}
              </span>
              <span className="font-mono text-white font-semibold">
                {isScheduled
                  ? formatCountdown(startCountdown)
                  : formatCountdown(countdown)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {reasonData && (
                <span>
                  {reasonData.emoji} {reasonData.label}
                </span>
              )}
              {timeout.conversationId ? (
                <span>This chat only</span>
              ) : (
                <span>All chats</span>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={onToggleActionMenu}
            className="p-2 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <MoreHorizontal size={18} className="text-gray-400" />
          </button>

          {showActionMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-10 py-1">
              {isScheduled ? (
                <button
                  onClick={onCancel}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                >
                  <X size={16} />
                  Cancel Timer
                </button>
              ) : (
                <>
                  <button
                    onClick={onEnd}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-dark-700"
                  >
                    <Play size={16} />
                    Unlock Now
                  </button>
                  <div className="border-t border-dark-600 my-1" />
                  <div className="px-4 py-1 text-xs text-gray-500">Extend by</div>
                  <button
                    onClick={() => onExtend(10)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                  >
                    +10 minutes
                  </button>
                  <button
                    onClick={() => onExtend(30)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                  >
                    +30 minutes
                  </button>
                  <button
                    onClick={() => onExtend(60)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                  >
                    +1 hour
                  </button>
                  <div className="border-t border-dark-600 my-1" />
                  <button
                    onClick={onCancel}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-dark-700"
                  >
                    <StopCircle size={16} />
                    End Early
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
