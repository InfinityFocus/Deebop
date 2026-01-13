'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, PlaySquare, PlusSquare, User,
  Bell, Bookmark, Images, Calendar, Link2, Crown, Settings, LogOut, X,
  MoreHorizontal, ChevronDown, Check, Plus, Loader2, Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import type { ProfileSummary } from '@/types/database';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/reels', icon: PlaySquare, label: 'Reels' },
  { href: '/post', icon: PlusSquare, label: 'Post' },
  { href: '/explore', icon: Search, label: 'Explore' },
  // Profile is handled separately with menu
];

const menuItems = [
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/saved', icon: Bookmark, label: 'Saved' },
  { href: '/albums', icon: Images, label: 'Albums' },
  { href: '/events', icon: Calendar, label: 'Events' },
];

const secondaryMenuItems = [
  { href: '/creator-page', icon: Link2, label: 'Creator Page' },
  { href: '/settings/subscription', icon: Crown, label: 'Upgrade' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, profiles, canAddProfile, switchProfile } = useAuth();
  const unreadCount = useUnreadNotificationCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [switchingProfile, setSwitchingProfile] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSwitchProfile = async (profile: ProfileSummary) => {
    if (profile.id === user?.id || profile.is_suspended) return;
    setSwitchingProfile(profile.id);
    try {
      await switchProfile(profile.id);
      setMenuOpen(false);
      setProfilesOpen(false);
    } catch (error) {
      console.error('Failed to switch profile:', error);
    } finally {
      setSwitchingProfile(null);
    }
  };

  const showProfileSwitcher = profiles.length > 1 || canAddProfile;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isProfileActive = pathname.startsWith('/profile') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/saved') ||
    pathname.startsWith('/albums') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/creator-page') ||
    pathname.startsWith('/settings');

  return (
    <>
      {/* Profile Menu Overlay */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed bottom-20 right-2 left-2 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl z-[60] md:hidden max-h-[70vh] overflow-y-auto scrollbar-thin"
        >
          {/* User Info Header */}
          {user && (
            <div className="border-b border-gray-800">
              <div className="flex items-center gap-3 p-4">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                    {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{user.display_name || user.username}</p>
                  <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Switcher */}
              {showProfileSwitcher && (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => setProfilesOpen(!profilesOpen)}
                    className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition"
                  >
                    <Users size={16} />
                    <span>Switch Profile</span>
                    <ChevronDown
                      size={14}
                      className={clsx('ml-auto transition-transform', profilesOpen && 'rotate-180')}
                    />
                  </button>

                  {profilesOpen && (
                    <div className="mt-2 bg-gray-800/50 rounded-lg overflow-hidden">
                      {/* Profile list */}
                      <div className="max-h-40 overflow-y-auto scrollbar-thin">
                        {profiles.map((profile) => (
                          <button
                            key={profile.id}
                            onClick={() => handleSwitchProfile(profile)}
                            disabled={profile.id === user?.id || profile.is_suspended || switchingProfile !== null}
                            className={clsx(
                              'w-full px-3 py-2 flex items-center gap-3 transition',
                              profile.id === user?.id
                                ? 'bg-emerald-500/10'
                                : profile.is_suspended
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-700 cursor-pointer'
                            )}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                              ) : (
                                profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-medium text-white truncate">{profile.display_name || profile.username}</p>
                              <p className="text-xs text-gray-400 truncate">@{profile.username}</p>
                            </div>
                            {switchingProfile === profile.id ? (
                              <Loader2 size={16} className="text-emerald-400 animate-spin" />
                            ) : profile.id === user?.id ? (
                              <Check size={16} className="text-emerald-400" />
                            ) : profile.is_suspended ? (
                              <span className="text-xs text-red-400">Suspended</span>
                            ) : null}
                          </button>
                        ))}
                      </div>

                      {/* Add profile */}
                      {canAddProfile && (
                        <Link
                          href="/settings/profiles/new"
                          onClick={() => { setMenuOpen(false); setProfilesOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2 border-t border-gray-700 hover:bg-gray-700 transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <Plus size={16} className="text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-300">Add Profile</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Menu Items */}
          <nav className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              const isNotifications = item.href === '/notifications';
              const showBadge = isNotifications && unreadCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3 transition-colors',
                    isActive
                      ? 'text-white bg-gray-800'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <div className="relative">
                    <Icon size={20} className={showBadge && !isActive ? 'text-emerald-400' : undefined} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Secondary Menu Items */}
          <div className="border-t border-gray-800 py-2">
            {secondaryMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3 transition-colors',
                    isActive
                      ? 'text-white bg-gray-800'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* More - Footer Links */}
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-4 px-4 py-3 w-full text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <MoreHorizontal size={20} />
              <span>More</span>
              <ChevronDown
                size={16}
                className={clsx(
                  'ml-auto transition-transform',
                  moreOpen && 'rotate-180'
                )}
              />
            </button>

            {moreOpen && (
              <div className="bg-gray-800/50 py-2">
                {/* Product */}
                <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-1">Product</p>
                <Link href="/features" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Features</Link>
                <Link href="/pricing" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Pricing</Link>
                <Link href="/blog" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Blog</Link>

                {/* Company */}
                <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-1 mt-2">Company</p>
                <Link href="/about" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">About</Link>
                <Link href="/careers" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Careers</Link>
                <Link href="/contact" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Contact</Link>

                {/* Legal */}
                <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-1 mt-2">Legal</p>
                <Link href="/terms" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Terms</Link>
                <Link href="/privacy" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Privacy</Link>
                <Link href="/cookies" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Cookies</Link>
                <Link href="/community-guidelines" className="block px-6 py-2 text-sm text-gray-400 hover:text-white">Community Guidelines</Link>
              </div>
            )}
          </div>

          {/* Logout */}
          {user && (
            <div className="border-t border-gray-800 py-2">
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-4 px-4 py-3 w-full text-red-400 hover:bg-gray-800 transition-colors"
              >
                <LogOut size={20} />
                <span>Log out</span>
              </button>
            </div>
          )}

          {/* Sign In for logged out users */}
          {!user && (
            <div className="border-t border-gray-800 p-4">
              <Link
                href="/login"
                className="block w-full py-2 text-center bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 md:hidden z-50 pb-safe"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={clsx(
                    'flex flex-col items-center justify-center h-16 min-w-[64px] transition-colors',
                    'active:scale-95 touch-manipulation',
                    isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} aria-hidden="true" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}

          {/* Menu Button (opens menu) */}
          <li className="flex-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={clsx(
                'flex flex-col items-center justify-center h-16 w-full min-w-[64px] transition-colors',
                'active:scale-95 touch-manipulation',
                isProfileActive || menuOpen ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              )}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <div className="relative">
                <User size={24} strokeWidth={isProfileActive || menuOpen ? 2.5 : 1.5} aria-hidden="true" />
                {unreadCount > 0 && !menuOpen && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Menu</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
