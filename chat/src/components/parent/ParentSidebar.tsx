'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/children', label: 'Children', icon: Users },
  { href: '/children/new', label: 'Add Child', icon: UserPlus },
  { href: '/approvals', label: 'Approvals', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function ParentSidebar() {
  const pathname = usePathname();
  const { user, pendingCount } = useAuthStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/parent/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="hidden md:flex w-64 bg-dark-800 border-r border-dark-700 flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="Deebop Chat"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-lg font-bold logo-shimmer">Deebop Chat</h1>
            <p className="text-xs text-gray-500">Parent Dashboard</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      {user && user.type === 'parent' && (
        <div className="p-4 border-b border-dark-700">
          <p className="text-sm text-gray-400">Signed in as</p>
          <p className="text-white font-medium truncate">
            {user.displayName || user.email}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
              {item.href === '/approvals' && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-dark-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
