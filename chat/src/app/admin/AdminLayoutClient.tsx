'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Baby,
  MessageSquare,
  Search,
  ClipboardList,
  ChevronLeft,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/parents', label: 'Parents', icon: Users },
  { href: '/admin/children', label: 'Children', icon: Baby },
  { href: '/admin/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/admin/messages', label: 'Messages', icon: Search },
  { href: '/admin/audit', label: 'Audit Log', icon: ClipboardList },
];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <ChevronLeft size={16} />
                <span>Back to App</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-white font-semibold">Chat Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded">
                Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
