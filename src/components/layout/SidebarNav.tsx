// src/components/layout/SidebarNav.tsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PiggyBank, LogOut } from 'lucide-react';
import { APP_NAME, AUTH_NAV_ITEMS, UNAUTH_NAV_ITEMS, type NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; 

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe(); 
  }, []);

  const handleNavItemClick = () => {
    // Close the mobile sidebar when navigation item is clicked
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('closeSidebar');
      window.dispatchEvent(event);
    }
  };
  
  const handleLogout = async () => {
    if (!auth) {
      toast({ title: "Logout Failed", description: "Authentication not initialized.", variant: "destructive" });
      return;
    }
    try {
      await signOut(auth);
      localStorage.removeItem('moneySimpLoggedIn');
      localStorage.removeItem('moneySimpUserEmail');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      handleNavItemClick(); // Close mobile menu if open
      router.push('/login'); 
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive"});
    }
  };

  let currentNavItems = isAuthenticated ? AUTH_NAV_ITEMS : UNAUTH_NAV_ITEMS;

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
      <div className="flex-1 py-4">
        <div className="space-y-1 px-3">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActiveItem = isActive(item);
            
            if (item.isButton && !item.isExternal) {
              // Client-side action button
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
              // External link
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
              // Internal Next.js Link
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleNavItemClick}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActiveItem 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                    min-h-[44px] touch-manipulation
                  `}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActiveItem ? "text-primary-foreground" : "")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      </div>

      {/* Logout Button */}
      {isAuthenticated && (
        <div className="border-t pt-4 px-3 pb-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start min-h-[44px] touch-manipulation" 
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

