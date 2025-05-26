
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
        <SidebarProvider defaultOpen={true} collapsible="icon">
          <Sidebar side="left" variant="sidebar" className="border-r">
            <SidebarNav />
          </Sidebar>
          <SidebarInset className="flex flex-col">
            <Header />
            <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
