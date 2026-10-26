// src/components/layout/SidebarNav.tsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PiggyBank, LogOut, Shield } from 'lucide-react';
import { APP_NAME, AUTH_NAV_ITEMS, UNAUTH_NAV_ITEMS, type NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';
import React from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();

  const handleNavItemClick = () => {
    // Close the mobile sidebar when navigation item is clicked
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('closeSidebar');
      window.dispatchEvent(event);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      handleNavItemClick();
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: error?.message || "Could not log you out.", variant: "destructive" });
    }
  };

  let currentNavItems: NavItem[] = isAuthenticated ? [...AUTH_NAV_ITEMS] : UNAUTH_NAV_ITEMS;

  // Add Admin item dynamically if user has admin privileges
  if (isAuthenticated && isAdmin) {
    // Insert Admin right below Dashboard or at the top of menu
    currentNavItems = [
      currentNavItems[0], // Dashboard
      { href: '/admin', label: 'Admin Portal', icon: Shield, matchSegments: 1 },
      ...currentNavItems.slice(1),
    ];
  }

  const isActive = (item: NavItem) => {
    if (item.href === '/') return pathname === '/';
    if (item.href === '/dashboard') return pathname === '/dashboard' || (isAuthenticated && pathname === '/');
    return pathname ? pathname.startsWith(item.href) : false;
  };

  return (
    <nav className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link 
          href={isAuthenticated ? "/dashboard" : "/"} 
          className="flex items-center gap-2 font-semibold text-sidebar-foreground" 
          onClick={handleNavItemClick}
        >
          <PiggyBank className="h-6 w-6 text-primary" />
          <span>{APP_NAME}</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-3">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActiveItem = isActive(item);
            const isAdminItem = item.href === '/admin';

            if (item.isButton && !item.isExternal) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.action) item.action();
                    handleNavItemClick(); 
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left
                    text-muted-foreground hover:text-foreground hover:bg-muted
                    min-h-[44px] touch-manipulation
                  `}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            } else if (item.isExternal) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavItemClick}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    text-muted-foreground hover:text-foreground hover:bg-muted
                    min-h-[44px] touch-manipulation
                  `}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </a>
              );
            } else {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleNavItemClick}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActiveItem 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : isAdminItem
                      ? 'text-primary hover:text-primary hover:bg-primary/10 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                    min-h-[44px] touch-manipulation
                  `}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActiveItem ? "text-primary-foreground" : isAdminItem ? "text-primary" : "")} />
                  <span className="truncate">{item.label}</span>
                  {isAdminItem && !isActiveItem && (
                    <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                      Admin
                    </span>
                  )}
                </Link>
              );
            }
          })}
        </div>
      </div>

      {/* User & Logout section */}
      {isAuthenticated && (
        <div className="border-t pt-4 px-3 pb-4 space-y-2">
          {user && (
            <div className="px-3 py-2 rounded-lg bg-muted/40 text-xs flex items-center justify-between">
              <div className="truncate">
                <p className="font-semibold text-foreground truncate">{user.displayName || user.username}</p>
                <p className="text-muted-foreground text-[11px] truncate">@{user.username}</p>
              </div>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase">
                  Admin
                </span>
              )}
            </div>
          )}

          <Button 
            variant="ghost" 
            className="w-full justify-start min-h-[44px] touch-manipulation text-muted-foreground hover:text-destructive transition-colors" 
            onClick={handleLogout}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
}
