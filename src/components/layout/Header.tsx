'use client';

import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APP_NAME, ALL_NAV_ITEMS } from '@/lib/constants';
import { endSession } from '@/lib/client-auth';
import { isDemoMode } from '@/lib/demo-client';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pageTitle, setPageTitle] = useState(APP_NAME);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const currentNavItem = ALL_NAV_ITEMS.find(item => {
      if (item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) return true;
      return item.href !== '/' && (pathname ?? '').startsWith(item.href);
    });
    setPageTitle(currentNavItem ? currentNavItem.label : APP_NAME);
    setDemo(isDemoMode());
    setEmail(localStorage.getItem('moneySimpUserEmail') || '');
    setName(localStorage.getItem('moneySimpUserName') || '');
  }, [pathname]);

  const currentNavItem = ALL_NAV_ITEMS.find(item => {
    if (item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) return true;
    return item.href !== '/' && (pathname ?? '').startsWith(item.href);
  });

  async function signOut() {
    await endSession();
    router.push('/');
  }

  const label = demo ? (name || 'Demo household') : (email || 'Account');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur-md sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </Button>
      <div className="flex min-w-0 items-center gap-2">
        {currentNavItem?.icon && <currentNavItem.icon className="h-5 w-5 shrink-0 text-primary" />}
        <h1 className="truncate text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto max-w-[46vw] sm:max-w-xs">
            <span className="truncate">{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{demo ? 'Sample household' : email || 'Signed in'}</DropdownMenuLabel>
          {demo && <p className="px-2 pb-2 text-xs text-muted-foreground">Demo data, not a linked bank.</p>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
