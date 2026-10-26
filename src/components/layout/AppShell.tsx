"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SettingsProvider, useSettings } from '@/components/SettingsContext';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { X } from 'lucide-react';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface AppShellProps { children: React.ReactNode }

function SettingsEffect() {
  const { settings } = useSettings();
  useEffect(() => {
    let appliedTheme = settings.theme;
    if (settings.theme === 'system') {
      const hour = new Date().getHours();
      appliedTheme = hour >= 9 && hour < 16 ? 'light' : 'dark';
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(appliedTheme);
  }, [settings.theme]);
  return null;
}

// Lightweight dynamic imports for large UI chunks.
const SidebarNavDynamic = dynamic(() => import('@/components/layout/SidebarNav').then(m => m.SidebarNav), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full animate-pulse">
      <div className="h-14 border-b bg-muted/30" />
      <div className="flex-1 space-y-2 p-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-9 rounded bg-muted/30" />))}
      </div>
      <div className="h-14 border-t bg-muted/30" />
    </div>
  )
});

const HeaderDynamic = dynamic(() => import('@/components/layout/Header').then(m => m.Header), {
  ssr: false,
  loading: () => (<div className="h-14 w-full border-b bg-muted/30 animate-pulse" />)
});

// Chatbot loaded only after idle to avoid hurting FCP.
const LazyChatbotWidget = dynamic(() => import('@/components/ChatbotWidget').then(m => m.ChatbotWidget), { ssr: false, loading: () => null });

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: isLoadingAuth } = useAuth();
  const authStartRef = useRef<number | null>(typeof performance !== 'undefined' ? performance.now() : null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('moneySimpSidebarOpen') === '1'; } catch { return false; }
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // Idle scheduling helper
  const scheduleIdle = (cb: () => void, timeout = 1500) => {
    if (typeof window === 'undefined') return;
    (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(cb, { timeout })
      : setTimeout(cb, timeout);
  };

  useEffect(() => {
    if (!isLoadingAuth) {
      if (user) {
        localStorage.setItem('moneySimpLoggedIn', 'true');
        localStorage.setItem('moneySimpUserEmail', user.email || user.username || '');
      } else {
        localStorage.removeItem('moneySimpLoggedIn');
        localStorage.removeItem('moneySimpUserEmail');
      }
      setShowHeader(true);
      setShowSidebar(true);
      scheduleIdle(() => setShowChatbot(true), 2500);

      if (authStartRef.current != null && (window as any)?.logCustomMetric) {
        const dur = performance.now() - authStartRef.current;
        (window as any).logCustomMetric('auth_resolve_ms', Math.round(dur));
      }
    }
  }, [isLoadingAuth, user]);

  useEffect(() => {
    const handleCloseSidebar = () => setIsMobileMenuOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  // Persist sidebar state
  useEffect(() => {
    try { localStorage.setItem('moneySimpSidebarOpen', isMobileMenuOpen ? '1' : '0'); } catch {}
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isLoadingAuth) return;
    const isPublic = pathname === '/' || (pathname?.startsWith('/login') ?? false);
    if (user && pathname === '/login') {
      router.replace('/dashboard');
    } else if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [user, pathname, router, isLoadingAuth]);

  const debugOverlay = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('MoneySimpDebug') === '1';

  const isPublic = pathname === '/' || (pathname?.startsWith('/login') ?? false);
  const isAuthenticated = !!user;

  if (!isLoadingAuth && !isAuthenticated && !isPublic) {
    return <LoadingScreen />;
  }

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <SettingsProvider>
      <SettingsEffect />
      <ErrorBoundary>
        <WebVitalsReporter />
        <div className="flex h-screen bg-background">
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          )}
          {debugOverlay && (
            <div className="fixed bottom-2 right-2 z-[100] bg-black/80 text-xs text-green-200 p-2 rounded max-w-xs space-y-1 font-mono">
              <div>path: {pathname}</div>
              <div>user: {user ? user.username : 'anon'}</div>
              <div>loadingAuth: {String(isLoadingAuth)}</div>
              <div>public: {String(isPublic)}</div>
              <div>sidebarOpen: {String(isMobileMenuOpen)}</div>
            </div>
          )}
          <div className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow border-r bg-sidebar overflow-y-auto">
              {showSidebar ? <SidebarNavDynamic /> : (
                <div className="p-3 space-y-2 animate-pulse">
                  {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-9 rounded bg-muted/30" />))}
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r transform transition-transform duration-300 ease-in-out md:hidden',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
              {showSidebar ? <SidebarNavDynamic /> : (
                <div className="p-3 space-y-2 animate-pulse">
                  {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="h-9 rounded bg-muted/30" />))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            {showHeader ? <HeaderDynamic onMenuClick={() => setIsMobileMenuOpen(true)} /> : (
              <div className="h-14 w-full border-b bg-muted/30 animate-pulse" />
            )}
            <main className="flex-1 overflow-y-auto p-4 relative">
              {isLoadingAuth && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                  <LoadingScreen />
                </div>
              )}
              {children}
            </main>
          </div>
        </div>
        {showChatbot && <LazyChatbotWidget />}
        <Toaster />
      </ErrorBoundary>
    </SettingsProvider>
  );
}
