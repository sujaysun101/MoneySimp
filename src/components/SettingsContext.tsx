import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Settings = {
  theme: string;
  language: string;
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
};

const SETTINGS_KEY = 'moneySimpUserSettings';

export interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        setSettingsState(DEFAULT_SETTINGS);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const setSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettingsState((prev) => ({ ...prev, [key]: value }));
  };

  if (!isLoaded) {
    // Prevent rendering children until settings are loaded
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}
