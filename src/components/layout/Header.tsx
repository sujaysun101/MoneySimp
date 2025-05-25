// src/components/layout/Header.tsx
"use client"
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { APP_NAME } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

export function Header() {
  const pathname = usePathname();
  const currentNavItem = NAV_ITEMS.find(item => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  });
  const pageTitle = currentNavItem ? currentNavItem.label : APP_NAME;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2">
        {currentNavItem && <currentNavItem.icon className="h-6 w-6 text-primary" />}
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      {/* Future additions: User profile, notifications, etc. */}
    </header>
  );
}
