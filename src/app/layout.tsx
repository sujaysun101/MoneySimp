// src/app/layout.tsx
"use client"; 
import type { Metadata } from 'next'; // Metadata type can still be used if exported from a server component or this file is split
import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Metadata generation should ideally be in a server component if this remains a client component.
// For now, we'll keep it simple. Next.js might show warnings if this component is fully client-side.
// export const metadata: Metadata = { // Cannot export metadata from client component
//   title: APP_NAME,
//   description: 'Your personal finance companion.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null initially, then boolean

  useEffect(() => {
    const loggedIn = localStorage.getItem('moneySimpLoggedIn') === 'true';
    setIsAuthenticated(loggedIn);

    if (!loggedIn && pathname !== '/' && !pathname.startsWith('/login')) {
      router.replace('/login');
    } else if (loggedIn && (pathname === '/' || pathname.startsWith('/login'))) {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  // Determine if the current path is a public path (landing, login)
  const isPublicPath = pathname === '/' || pathname.startsWith('/login');

  if (isAuthenticated === null && !isPublicPath) {
    // Still checking auth, and not on a public path, show loading or nothing
    // This helps prevent flicker before redirection
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <div className="flex justify-center items-center min-h-screen">Loading...</div>
          <Toaster />
        </body>
      </html>
    );
  }

  if (isPublicPath || !isAuthenticated) {
    // Render children directly for public paths or if not authenticated (and already on a public path)
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
            <title>{APP_NAME}</title>
            <meta name="description" content="Your personified finance tracker!" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
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
      <body className={`${inter.variable} font-sans antialiased`}>
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
