import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

const STORAGE_KEY = 'app_language';
export type Language = 'en' | 'pt';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const lang = (stored === 'pt' || stored === 'en') ? stored : 'en';
      setLanguageState(lang);
      i18n.changeLanguage(lang);
    });
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
