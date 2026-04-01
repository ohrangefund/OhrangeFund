import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import pt from './locales/pt';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

// To add a new language:
// 1. Create src/i18n/locales/xx.ts
// 2. Add `xx: { translation: xx }` to resources above
// 3. Add the option to LanguageScreen.tsx
