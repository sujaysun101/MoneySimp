
// src/components/layout/SidebarNav.tsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PiggyBank, LogOut } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { APP_NAME, AUTH_NAV_ITEMS, UNAUTH_NAV_ITEMS, type NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar'; 
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import onAuthStateChanged and signOut

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { setOpenMobile, isMobile } = useSidebar(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const handleNavItemClick = () => {
    if (isMobile) {
      setOpenMobile(false); 
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('moneySimpLoggedIn');
      localStorage.removeItem('moneySimpUserEmail');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      if (isMobile) setOpenMobile(false);
      router.push('/login'); // Firebase onAuthStateChanged in RootLayout will also trigger redirect
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive"});
    }
  };

  const currentNavItems = isAuthenticated ? AUTH_NAV_ITEMS : UNAUTH_NAV_ITEMS;

  const isActive = (item: NavItem) => {
    if (item.href === '/') return pathname === '/';
    if (item.href === '/dashboard') return pathname === '/dashboard' || (isAuthenticated && pathname === '/'); 
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 sticky top-0 bg-sidebar z-10">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold text-sidebar-foreground" onClick={handleNavItemClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-piggy-bank"><path d="M10 15.5V14a2 2 0 1 0-4 0v1.5"/><path d="M8 15.5v4.5H6a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h2.4a2 2 0 0 1 1.6.8l2.1 2.9c.3.4.9.6 1.4.6H16a2 2 0 0 0 2-2V9a2 2 0 1 0-4 0v1.5a2 2 0 1 1-4 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2.5c0 .8.4 1.5.9 1.9L5 15"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/></svg>
          <span>{APP_NAME}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              {item.isButton ? (
                <SidebarMenuButton
                  variant="default"
                  size="default"
                  className="justify-start w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  tooltip={item.label}
                  onClick={() => {
                    if (item.action) item.action();
                    handleNavItemClick(); 
                  }}
                >
                  <item.icon className="h-5 w-5 text-sidebar-foreground/70 group-hover/menu-button:text-sidebar-accent-foreground" />
                  <span className="truncate">{item.label}</span>
                </SidebarMenuButton>
              ) : (
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    variant="default"
                    size="default"
                    className={cn(
                      "justify-start w-full",
                      isActive(item) ?
                      "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" :
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    tooltip={item.label}
                    isActive={isActive(item)}
                    onClick={handleNavItemClick} 
                  >
                    <item.icon className={cn("h-5 w-5", isActive(item) ? "text-primary" : "text-sidebar-foreground/70 group-hover/menu-button:text-sidebar-accent-foreground")} />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
      {isAuthenticated && (
        <div className="mt-auto p-2 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      )}
    </>
  );
}
