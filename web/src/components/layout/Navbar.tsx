'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlaySquare, PlusSquare, User } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/reels', icon: PlaySquare, label: 'Reels' },
  { href: '/post', icon: PlusSquare, label: 'Post' },
  { href: '/explore', icon: Search, label: 'Explore' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
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
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  aria-hidden="true"
                />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
