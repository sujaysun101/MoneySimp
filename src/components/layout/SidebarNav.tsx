// src/components/layout/SidebarNav.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiggyBank } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { APP_NAME, NAV_ITEMS, type NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';


export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.href === '/') return pathname === '/';
    // For nested routes, check if pathname starts with item.href
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 sticky top-0 bg-sidebar z-10">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
          <PiggyBank className="h-6 w-6 text-primary" />
          <span>{APP_NAME}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.label}>
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
                >
                  <item.icon className={cn("h-5 w-5", isActive(item) ? "text-primary" : "text-sidebar-foreground/70 group-hover/menu-button:text-sidebar-accent-foreground")} />
                  <span className="truncate">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </>
  );
}
