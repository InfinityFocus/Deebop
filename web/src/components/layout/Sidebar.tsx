'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlaySquare, PlusSquare, Bell, User, Settings, LogOut, Bookmark, Crown, Images, Calendar, Link2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';

const mainNavItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/reels', icon: PlaySquare, label: 'Reels' },
  { href: '/explore', icon: Search, label: 'Explore' },
  { href: '/albums', icon: Images, label: 'Albums' },
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/post', icon: PlusSquare, label: 'Create' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/saved', icon: Bookmark, label: 'Saved' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const secondaryNavItems = [
  { href: '/creator-page', icon: Link2, label: 'Creator Page' },
  { href: '/settings/subscription', icon: Crown, label: 'Upgrade' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-gray-800 z-50"
      role="navigation"
      aria-label="Desktop navigation"
    >
      {/* Logo */}
      <div className="p-6">
        <Link href="/home" className="text-2xl font-bold">
          <span className="logo-shimmer">
            Deebop
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white font-semibold'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  )}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Secondary Navigation */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <ul className="space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-4 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white font-semibold'
                        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    )}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
              {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {user.display_name || user.username}
              </p>
              <p className="text-sm text-gray-500 truncate">@{user.username}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={20} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="block w-full py-2 text-center bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
