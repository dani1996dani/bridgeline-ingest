'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UploadCloud, LayoutDashboard, Send, FileText } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    {
      href: '/',
      label: 'Upload',
      icon: UploadCloud,
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/invitation',
      label: 'Invite to Bid',
      icon: Send,
    },
  ];

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container max-w-8xl mx-auto h-16 flex flex-row gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-xl tracking-tight text-zinc-900">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          Bridgeline <span className="text-zinc-400 font-normal">Ingest</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isActive ? 'text-blue-600' : 'text-zinc-400'
                  )}
                />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div></div>
      </div>
    </nav>
  );
}
