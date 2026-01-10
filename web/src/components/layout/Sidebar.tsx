'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlaySquare, PlusSquare, Bell, User, Settings, LogOut, Bookmark, Crown, Images, Calendar, Link2, MoreHorizontal, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';

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
  const unreadCount = useUnreadNotificationCount();
  const [moreOpen, setMoreOpen] = useState(false);

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
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const isNotifications = item.href === '/notifications';
            const showBadge = isNotifications && unreadCount > 0;

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
                  <div className="relative">
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} className={showBadge && !isActive ? 'text-emerald-400' : undefined} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
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

          {/* More Section - Footer Links */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-4 px-4 py-3 w-full text-left text-gray-400 hover:bg-gray-900 hover:text-white rounded-lg transition-colors"
            >
              <MoreHorizontal size={24} strokeWidth={1.5} />
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
              <div className="mt-2 space-y-4 pl-4">
                {/* Product */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider px-4 mb-1">Product</p>
                  <ul className="space-y-1">
                    <li>
                      <Link href="/features" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link href="/pricing" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Blog
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Company */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider px-4 mb-1">Company</p>
                  <ul className="space-y-1">
                    <li>
                      <Link href="/about" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link href="/careers" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Careers
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Legal */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider px-4 mb-1">Legal</p>
                  <ul className="space-y-1">
                    <li>
                      <Link href="/terms" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Terms
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Privacy
                      </Link>
                    </li>
                    <li>
                      <Link href="/cookies" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Cookies
                      </Link>
                    </li>
                    <li>
                      <Link href="/community-guidelines" className="block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        Community Guidelines
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
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
