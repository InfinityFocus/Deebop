'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  backHref?: string;
}

export function PageHeader({ title, subtitle, icon, actions, children, backHref }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {backHref && (
              <Link href={backHref} className="p-1 -ml-1 hover:bg-gray-800 rounded-lg transition">
                <ArrowLeft size={20} className="text-gray-400" />
              </Link>
            )}
            {icon && <span className="text-emerald-400">{icon}</span>}
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </header>
  );
}
