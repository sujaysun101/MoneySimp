import React, { useEffect, useState, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

const GOOGLE_TRANSLATE_API_KEY = 'YOUR_GOOGLE_TRANSLATE_API_KEY'; // Replace with your key
const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

async function translateText(text: string, target: string, source = 'en'): Promise<string> {
  if (!text.trim() || target === source) return text;
  const res = await fetch(TRANSLATE_ENDPOINT + `?key=${GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: 'text',
      })
    }
  );
  const data = await res.json();
  if (data && data.data && data.data.translations && data.data.translations[0]) {
    return data.data.translations[0].translatedText;
  }
  return text;
}

export const TranslationContext = React.createContext({
  translate: async (text: string) => text,
  language: 'en',
});

export function useTranslation() {
  return React.useContext(TranslationContext);
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [language, setLanguage] = useState(settings.language || 'en');

  useEffect(() => {
    setLanguage(settings.language || 'en');
  }, [settings.language]);

  // Provide a translate function for use in components
  const translate = async (text: string) => {
    if (!text || language === 'en') return text;
    return await translateText(text, language, 'en');
  };

  return (
    <TranslationContext.Provider value={{ translate, language }}>
      {children}
    </TranslationContext.Provider>
  );
}
