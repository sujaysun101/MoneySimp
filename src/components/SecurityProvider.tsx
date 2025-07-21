// src/components/SecurityProvider.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SecureStorage } from '@/lib/encryption';
import { initOfflineStorage, getOfflineStorage, clearOfflineStorage } from '@/lib/offlineStorage';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { SyncStatus } from '@/lib/types';

interface SecurityContextType {
  secureStorage: SecureStorage | null;
  isOfflineReady: boolean;
  syncStatus: SyncStatus;
  initializeForUser: (user: User) => Promise<void>;
  clearUserData: () => Promise<void>;
  lockApp: () => void;
  isLocked: boolean;
  unlockApp: (password: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const [secureStorage, setSecureStorage] = useState<SecureStorage | null>(null);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false,
  });

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor authentication state
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await initializeForUser(user);
      } else {
        await clearUserData();
      }
    });

    return () => unsubscribe();
  }, []);

  const initializeForUser = async (user: User) => {
    try {
      // Initialize secure storage
      const storage = new SecureStorage(user.uid, user.email || '');
      setSecureStorage(storage);

      // Initialize offline storage
      await initOfflineStorage(user.uid, storage['encryptionKey']);
      setIsOfflineReady(true);

      // Get last sync time
      const offlineStorage = getOfflineStorage();
      const lastSync = await offlineStorage.getLastSyncTime();
      setSyncStatus(prev => ({ ...prev, lastSync }));

      console.log('Security context initialized for user:', user.uid);
    } catch (error) {
      console.error('Failed to initialize security context:', error);
      setIsOfflineReady(false);
    }
  };

  const clearUserData = async () => {
    try {
      if (secureStorage) {
        secureStorage.clear();
      }
      await clearOfflineStorage();
      setSecureStorage(null);
      setIsOfflineReady(false);
      setIsLocked(false);
      setSyncStatus({
        isOnline: navigator.onLine,
        lastSync: null,
        pendingChanges: 0,
        syncInProgress: false,
      });
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockApp = async (password: string): Promise<boolean> => {
    // In a production app, you'd verify the password against a stored hash
    // For this example, we'll use a simple check
    const user = auth?.currentUser;
    if (!user) return false;

    try {
      // You could implement biometric authentication here
      // For now, we'll just check if it's the user's email (simplified)
      if (password === user.email) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unlock app:', error);
      return false;
    }
  };

  // Auto-lock after inactivity (optional)
  useEffect(() => {
    if (typeof window === 'undefined' || !secureStorage) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        lockApp();
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [secureStorage]);

  const value: SecurityContextType = {
    secureStorage,
    isOfflineReady,
    syncStatus,
    initializeForUser,
    clearUserData,
    lockApp,
    isLocked,
    unlockApp,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// App Lock Screen Component
export function AppLockScreen() {
  const { unlockApp, isLocked } = useSecurity();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsUnlocking(true);
    setError('');

    try {
      const success = await unlockApp(password);
      if (!success) {
        setError('Invalid credentials');
        setPassword('');
      }
    } catch (error) {
      setError('Failed to unlock app');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">App Locked</h1>
          <p className="text-muted-foreground mt-2">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email (demo)"
              disabled={isUnlocking}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={isUnlocking || !password.trim()}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>Your data is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}
