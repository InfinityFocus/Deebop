'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Flag, Megaphone, Users, ArrowLeft, FileText, Heart, Repeat, Star } from 'lucide-react';
import { clsx } from 'clsx';

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/blog', icon: FileText, label: 'Blog' },
  { href: '/admin/moderation', icon: Flag, label: 'Moderation' },
  { href: '/admin/ads', icon: Megaphone, label: 'Ads' },
  { href: '/admin/wellbeing', icon: Heart, label: 'Wellbeing' },
  { href: '/admin/reposts', icon: Repeat, label: 'Reposts' },
  { href: '/admin/favourites', icon: Star, label: 'Favourites' },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Back to app */}
            <Link
              href="/home"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
              aria-label="Back to app"
            >
              <ArrowLeft size={20} aria-hidden="true" />
              <span className="hidden sm:inline">Back to App</span>
            </Link>

            {/* Admin badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
                Admin
              </span>
            </div>
          </div>

          {/* Admin Navigation */}
          <nav aria-label="Admin navigation">
            <ul className="flex gap-1 -mb-px overflow-x-auto">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap',
                        isActive
                          ? 'border-emerald-500 text-white'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
