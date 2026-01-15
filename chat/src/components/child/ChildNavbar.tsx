'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Users, MessageCircle, LogOut } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/chats', label: 'Chats', icon: MessageCircle },
];

export function ChildNavbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/child/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-900 border-b border-dark-700">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/friends" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Deebop Chat"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-lg font-bold logo-shimmer">Chat</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {user && user.type === 'child' && (
              <div className="flex items-center gap-2">
                <Avatar avatarId={user.avatarId || 'cat'} size="sm" />
                <span className="text-sm text-gray-300 hidden sm:block">
                  {user.displayName || user.username}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
