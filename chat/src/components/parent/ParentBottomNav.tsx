'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bell,
  User,
  Settings,
  LogOut,
  UserPlus,
  Gift,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/children', label: 'Children', icon: Users },
  { href: '/approvals', label: 'Approvals', icon: Bell },
];

const menuItems = [
  { href: '/children/new', label: 'Add Child', icon: UserPlus },
  { href: '/referrals', label: 'Referrals', icon: Gift },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function ParentBottomNav() {
  const pathname = usePathname();
  const { user, pendingCount } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/parent/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  const isMenuActive =
    pathname.startsWith('/settings') ||
    pathname.startsWith('/referrals') ||
    pathname === '/children/new';

  return (
    <>
      {/* Menu Overlay */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed bottom-20 right-2 left-2 bg-dark-800 border border-dark-700 rounded-2xl shadow-xl z-[60] md:hidden"
        >
          {/* User Info Header */}
          {user && user.type === 'parent' && (
            <div className="flex items-center gap-3 p-4 border-b border-dark-700">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user.displayName || 'Parent'}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
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

          {/* Menu Items */}
          <nav className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                    isActive
                      ? 'text-white bg-dark-700'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-dark-700 py-2">
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="flex items-center gap-4 px-4 py-3 w-full text-red-400 hover:bg-dark-700 transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 md:hidden z-50"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="flex items-center justify-around h-16">
          {mainNavItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const isApprovals = item.href === '/approvals';
            const showBadge = isApprovals && pendingCount > 0;

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center h-16 min-w-[64px] transition-colors ${
                    isActive ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}

          {/* Menu Button */}
          <li className="flex-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex flex-col items-center justify-center h-16 w-full min-w-[64px] transition-colors ${
                isMenuActive || menuOpen
                  ? 'text-primary-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <User size={24} strokeWidth={isMenuActive || menuOpen ? 2.5 : 1.5} />
              <span className="text-xs mt-1">Menu</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
