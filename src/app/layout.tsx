// src/app/layout.tsx
"use client"; 
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { onAuthStateChanged, type User } from 'firebase/auth';
import { X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsProvider, useSettings } from '@/components/SettingsContext';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Header } from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start true, then set to false after first auth check
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsMobileMenuOpen(false);
    };
    
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false); // Auth state determined
      if (user) {
        localStorage.setItem('moneySimpLoggedIn', 'true');
        localStorage.setItem('moneySimpUserEmail', user.email || '');
      } else {
        localStorage.removeItem('moneySimpLoggedIn');
        localStorage.removeItem('moneySimpUserEmail');
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []);

  useEffect(() => {
    if (isLoadingAuth) return; // Don't redirect until auth state is known

    const isPublicPath = pathname === '/' || (pathname?.startsWith('/login') ?? false);

    if (firebaseUser && isPublicPath) {
      // If logged in and on a public path, redirect to dashboard
      router.replace('/dashboard');
    } else if (!firebaseUser && !isPublicPath) {
      // If not logged in and on a protected path, redirect to login
      router.replace('/login');
    }
  }, [firebaseUser, pathname, router, isLoadingAuth]);

  // Helper to apply theme globally
  function SettingsEffect() {
    const { settings } = useSettings();
    useEffect(() => {
      let appliedTheme = settings.theme;
      if (settings.theme === 'default') {
        const hour = new Date().getHours();
        appliedTheme = hour >= 9 && hour < 16 ? 'light' : 'dark';
      }
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(appliedTheme);
    }, [settings.theme]);
    return null;
  }

  const isPublicPath = pathname === '/' || (pathname?.startsWith('/login') ?? false);
  const isAuthenticated = !!firebaseUser;

  if (isLoadingAuth && !isPublicPath) {
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
          <div className="flex justify-center items-center min-h-screen">Loading...</div>
          <Toaster />
        </body>
      </html>
    );
  }

  if (isPublicPath || !isAuthenticated) {
    // Render children directly for public paths or if not authenticated (and on a public path, or already redirected)
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <title>{`${APP_NAME}`}</title>
            <meta name="description" content="Your personified finance tracker!" />
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
          
          <div className="flex h-screen bg-background">
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
          
          <ChatbotWidget />
        </SettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}
