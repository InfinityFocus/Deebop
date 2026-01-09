'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, PlaySquare, PlusSquare, User,
  Bell, Bookmark, Images, Calendar, Link2, Crown, Settings, LogOut, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';

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
  const { user, logout } = useAuth();
  const unreadCount = useUnreadNotificationCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
          className="fixed bottom-20 right-2 left-2 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl z-[60] overflow-hidden md:hidden"
        >
          {/* User Info Header */}
          {user && (
            <div className="flex items-center gap-3 p-4 border-b border-gray-800">
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
