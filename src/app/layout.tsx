// src/app/layout.tsx
"use client"; 
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsProvider, useSettings } from '@/components/SettingsContext';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Header } from '@/components/layout/Header';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

function isPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === '/' || pathname === '/login' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsMobileMenuOpen(false);
    };
    
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const demo = localStorage.getItem('moneySimpDemoMode') === 'true';
    if (demo) setDemoMode(true);

    if (!auth) {
      setIsLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      const stillDemo = localStorage.getItem('moneySimpDemoMode') === 'true';
      if (user && !stillDemo) {
        localStorage.setItem('moneySimpLoggedIn', 'true');
        localStorage.setItem('moneySimpUserEmail', user.email || '');
        localStorage.setItem('moneySimpUserId', user.uid);
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/session', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
          });
        } catch (error) {
          console.error('Could not establish server session', error);
        }
      } else if (!user && !stillDemo) {
        localStorage.removeItem('moneySimpLoggedIn');
        localStorage.removeItem('moneySimpUserEmail');
        localStorage.removeItem('moneySimpUserId');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const demo = localStorage.getItem('moneySimpDemoMode') === 'true';
    if (demo !== demoMode) setDemoMode(demo);
    if (isLoadingAuth) return;

    const publicPath = isPublicPath(pathname);
    const authed = Boolean(firebaseUser) || demo;
    if (authed && publicPath) {
      router.replace('/dashboard');
    } else if (!authed && !publicPath) {
      router.replace('/login');
    }
  }, [firebaseUser, demoMode, pathname, router, isLoadingAuth]);

  // Helper to apply theme globally
  function SettingsEffect() {
    const { settings } = useSettings();
    useEffect(() => {
      let appliedTheme = settings.theme;
      if (settings.theme === 'default' || settings.theme === 'system') {
        const hour = new Date().getHours();
        appliedTheme = hour >= 9 && hour < 16 ? 'light' : 'dark';
      }
      if (appliedTheme !== 'light' && appliedTheme !== 'dark') appliedTheme = 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(appliedTheme);
    }, [settings.theme]);
    return null;
  }

  const publicPath = isPublicPath(pathname);
  const isAuthenticated = !!firebaseUser || demoMode;

  if (isLoadingAuth && !publicPath) {
    // Show loading state only for protected routes while auth is being checked
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <title>{`${APP_NAME} - Loading...`}</title>
            <meta name="description" content="Loading your financial dashboard." />
        </head>
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
          <PageSkeleton />
          <Toaster />
        </body>
      </html>
    );
  }

  if (publicPath || !isAuthenticated) {
    // Render children directly for public paths or if not authenticated (and on a public path, or already redirected)
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <title>{`${APP_NAME} — Personal finance`}</title>
            <meta name="description" content="Track expenses, budgets, subscriptions, and goals. Try a sample household without linking a bank." />
            <meta property="og:title" content="MoneySimp" />
            <meta property="og:description" content="Track expenses, budgets, subscriptions, and goals." />
            <meta property="og:image" content="/portfolio-screenshot-landing.png" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }
  
  // Authenticated layout
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <title>{`${APP_NAME} - App`}</title>
            <meta name="description" content="Manage your finances." />
        </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <SettingsProvider>
          <SettingsEffect />
          
          <div className="flex h-screen flex-col bg-background">
            {demoMode && (
              <div className="border-b bg-accent/25 px-4 py-2 text-center text-sm text-foreground">
                Demo data — Maya Chen&apos;s sample household. These figures are not a live bank connection.
              </div>
            )}
            <div className="flex min-h-0 flex-1">
            {/* Mobile overlay */}
            {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
            
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col">
              <div className="flex flex-col flex-grow border-r bg-sidebar overflow-y-auto">
                <SidebarNav />
              </div>
            </div>
            
            {/* Mobile Sidebar */}
            <div className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r transform transition-transform duration-300 ease-in-out md:hidden",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{APP_NAME}</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-sidebar-accent min-h-[44px] min-w-[44px] touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Close sidebar"
                  aria-label="Close sidebar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarNav />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Mobile Header */}
              {/* Mobile and Desktop Header */}
              <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
              
              {/* Page Content */}
              <main className="flex-1 overflow-y-auto p-4">
                {children}
              </main>
            </div>
          </div>
          </div>
          
          <ChatbotWidget />
        </SettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}
