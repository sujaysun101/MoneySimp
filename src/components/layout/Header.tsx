// src/components/layout/Header.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { Menu, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME, ALL_NAV_ITEMS } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import NotificationWidget from '@/components/community/NotificationWidget';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState(APP_NAME);
  const { user, logout } = useAuth();

  useEffect(() => {
    const currentNavItem = ALL_NAV_ITEMS.find(item => {
      if (item.href === '/dashboard' && pathname === '/') return true;
      if (item.href === '/') return pathname === '/';
      return item.href !== '/' && (pathname ?? '').startsWith(item.href);
    });
    setPageTitle(currentNavItem ? currentNavItem.label : APP_NAME);
  }, [pathname]);

  const currentNavItem = ALL_NAV_ITEMS.find(item => {
    if (item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) return true;
    if (item.href === '/') return pathname === '/';
    return item.href !== '/' && (pathname ?? '').startsWith(item.href);
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden touch-target-44"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2 ml-2 sm:ml-4">
          {currentNavItem && currentNavItem.icon && <currentNavItem.icon className="h-6 w-6 text-primary" />}
          <h1 className="text-xl font-semibold text-foreground ml-2">{pageTitle}</h1>
        </div>
      </div>

      {/* Right-side items: notifications + user info + logout */}
      <div className="flex items-center gap-3">
        <NotificationWidget />

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1">
                {user.displayName || user.username}
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/30">
                    <Shield className="w-2.5 h-2.5 mr-0.5" /> Admin
                  </span>
                )}
              </span>
              <span className="text-muted-foreground text-[11px]">@{user.username}</span>
            </div>

            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
              {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
