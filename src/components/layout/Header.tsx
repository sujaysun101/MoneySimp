// src/components/layout/Header.tsx
"use client"
import React, { useEffect, useState }from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { APP_NAME, ALL_NAV_ITEMS } from '@/lib/constants'; // Use ALL_NAV_ITEMS
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState(APP_NAME);

 useEffect(() => {
    const currentNavItem = ALL_NAV_ITEMS.find(item => {
      if (item.href === '/dashboard' && pathname === '/') return true; // Special case for dashboard at root
      if (item.href === '/') return pathname === '/'; // For exact match on root
      // For nested routes, check if pathname starts with item.href, but only if href is not just '/'
      return item.href !== '/' && pathname.startsWith(item.href);
    });
    setPageTitle(currentNavItem ? currentNavItem.label : APP_NAME);
  }, [pathname]);


  const currentNavItem = ALL_NAV_ITEMS.find(item => {
    // Handle dashboard potentially being at '/' for authenticated users or '/dashboard'
    if (item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) return true;
    if (item.href === '/') return pathname === '/'; // For exact match on root like landing page
    // For other nested routes
    return item.href !== '/' && pathname.startsWith(item.href);
  });


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2">
        {currentNavItem && currentNavItem.icon && <currentNavItem.icon className="h-6 w-6 text-primary" />}
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      {/* Future additions: User profile, notifications, etc. */}
    </header>
  );
}
