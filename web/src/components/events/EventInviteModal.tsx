'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Search, UserPlus, Loader2, Check, Mail, Users } from 'lucide-react';
import { useSendEventInvites } from '@/hooks/useEventInvites';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface EventInviteModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EventInviteModal({ eventId, isOpen, onClose }: EventInviteModalProps) {
  const { mutate: sendInvites, isPending } = useSendEventInvites(eventId);

  const [activeTab, setActiveTab] = useState<'users' | 'email'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Parse emails from textarea
  const parseEmails = (input: string): string[] => {
    // Split by comma, newline, semicolon, or space
    const emails = input
      .split(/[,;\n\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && EMAIL_REGEX.test(e));
    return [...new Set(emails)]; // Remove duplicates
  };

  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);
    setParsedEmails(parseEmails(value));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSend = () => {
    const hasUsers = selectedUsers.length > 0;
    const hasEmails = parsedEmails.length > 0;

    if (!hasUsers && !hasEmails) return;

    sendInvites(
      {
        userIds: hasUsers ? selectedUsers.map((u) => u.id) : undefined,
        emails: hasEmails ? parsedEmails : undefined,
        message: message.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setSuccessMessage(`Sent ${data.invitedCount} invite${data.invitedCount !== 1 ? 's' : ''}`);
          setSelectedUsers([]);
          setEmailInput('');
          setParsedEmails([]);
          setMessage('');
          setTimeout(() => {
            setSuccessMessage('');
            onClose();
          }, 2000);
        },
      }
    );
  };

  const canSend = selectedUsers.length > 0 || parsedEmails.length > 0;
  const inviteCount = selectedUsers.length + parsedEmails.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Invite People</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {successMessage ? (
            <div className="text-center py-8">
              <Check className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
              <p className="text-white">{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-gray-700 rounded-lg">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                    activeTab === 'users'
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Search Users
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                    activeTab === 'email'
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Invite by Email
                </button>
              </div>

              {activeTab === 'users' ? (
                <>
                  {/* Search */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                    </button>
                  </div>

                  {/* Selected Users */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm"
                        >
                          <span>{user.displayName || user.username}</span>
                          <button
                            onClick={() => toggleUser(user)}
                            className="hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((user) => {
                        const isSelected = selectedUsers.some((u) => u.id === user.id);
                        return (
                          <button
                            key={user.id}
                            onClick={() => toggleUser(user)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-emerald-500/20 border border-emerald-500/50'
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                              {user.avatarUrl ? (
                                <Image
                                  src={user.avatarUrl}
                                  alt={user.displayName || user.username}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-white">
                                {user.displayName || user.username}
                              </p>
                              <p className="text-sm text-gray-400">@{user.username}</p>
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Enter email addresses (separated by commas or new lines)
                    </label>
                    <textarea
                      value={emailInput}
                      onChange={(e) => handleEmailInputChange(e.target.value)}
                      placeholder="john@example.com, jane@example.com"
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Parsed Emails */}
                  {parsedEmails.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">
                        {parsedEmails.length} valid email{parsedEmails.length !== 1 ? 's' : ''} found:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {parsedEmails.map((email) => (
                          <div
                            key={email}
                            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-sm"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Message */}
              {canSend && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Add a message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hey, I'd love for you to come to my event!"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!successMessage && (
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleSend}
              disabled={isPending || !canSend}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Send {inviteCount > 0 && `(${inviteCount})`} Invite{inviteCount !== 1 && 's'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
