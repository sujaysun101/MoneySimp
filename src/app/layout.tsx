// src/app/layout.tsx
"use client"; 
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { onAuthStateChanged, type User } from 'firebase/auth';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsProvider, useSettings } from '@/components/SettingsContext';
import { ChatbotWidget } from '@/components/ChatbotWidget';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
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

    const isPublicPath = pathname === '/' || pathname.startsWith('/login');

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

  const isPublicPath = pathname === '/' || pathname.startsWith('/login');
  const isAuthenticated = !!firebaseUser;

  if (isLoadingAuth && !isPublicPath) {
    // Show loading state only for protected routes while auth is being checked
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
            <title>{APP_NAME} - Loading...</title>
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
            <title>{APP_NAME}</title>
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
            <title>{APP_NAME} - App</title>
            <meta name="description" content="Manage your finances." />
        </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <SettingsProvider>
          <SettingsEffect />
          {/* Chatbot widget appears on every page */}
          <ChatbotWidget />
          <SidebarProvider defaultOpen={true} collapsible="icon">
              {/* Hamburger icon for all screens, fixed top-left, only when sidebar is closed */}
              <div
                className={cn(
                  "fixed top-2 left-2 z-50 transition-opacity duration-300",
                  sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                )}
              >
                <button
                  className="p-2 rounded-md bg-sidebar text-sidebar-foreground shadow hover:bg-sidebar-accent transition-colors focus:outline-none"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  type="button"
                >
                  <span className="block w-6 h-0.5 bg-current mb-1 rounded"></span>
                  <span className="block w-6 h-0.5 bg-current mb-1 rounded"></span>
                  <span className="block w-6 h-0.5 bg-current rounded"></span>
                </button>
              </div>
              {/* Sidebar slides in/out, overlays content with shadow and semi-transparent bg */}
              <div
                className={cn(
                  "fixed inset-y-0 left-0 z-40 transition-transform duration-300 w-64",
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
              >
                <Sidebar
                  side="left"
                  variant="sidebar"
                  className="border-r h-full shadow-2xl bg-sidebar/90 backdrop-blur-md"
                >
                  {/* Close button inside sidebar, only when open */}
                  <button
                    className={cn(
                      "absolute top-2 right-2 z-50 p-2 rounded-full hover:bg-sidebar-accent transition-colors",
                      sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                    type="button"
                    tabIndex={sidebarOpen ? 0 : -1}
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <SidebarNav />
                </Sidebar>
              </div>
              {/* Main content area, always flush left, sidebar overlays it */}
              <div className="transition-all duration-300 flex flex-col w-full">
                <Header />
                <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0 md:gap-8 !pl-0">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </SettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}
