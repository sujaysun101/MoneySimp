// This file must remain a server component (no hooks). All client logic lives in AppShell.
import type React from 'react';
import { Inter } from 'next/font/google';
import { APP_NAME } from '@/lib/constants';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { usingFallback } from '@/lib/firebase';
import './globals.css';
import { logWebVital } from '@/lib/performanceMetrics';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <title>{APP_NAME}</title>
        <meta name="description" content="Your personified finance tracker" />
        {/* Dev-only custom script injection for React DevTools / user request.
            Original warning to surface in DOM for debugging: 
            LogUtils.js:19 The width(269) and height(300) are both fixed numbers, maybe you don't need to use a ResponsiveContainer.
            If you intended to load React DevTools via a script, note that the standalone devtools usually run on 8097 by default.
            User requested port 3000, so we leave this as-is. */}
        {process.env.NODE_ENV !== 'production' && (
          <script src="http://localhost:8097" suppressHydrationWarning />
        )}
        
  {/* Performance hints */}
  <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
  <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link rel="dns-prefetch" href="//www.gstatic.com" />
  <link rel="dns-prefetch" href="//firestore.googleapis.com" />
  <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        {process.env.NODE_ENV !== 'production' && usingFallback && (
          <div className="w-full bg-yellow-500 text-black text-sm px-4 py-2 text-center">
            Using fallback Firebase config. Provide env vars to disable. (Dev-only banner)
          </div>
        )}
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

// Web Vitals reporting (App Router supports exporting this function from layout)
// Logs metrics locally and optionally sends them to an API endpoint.
// Note: reportWebVitals disabled for now due to App Router type constraints.
